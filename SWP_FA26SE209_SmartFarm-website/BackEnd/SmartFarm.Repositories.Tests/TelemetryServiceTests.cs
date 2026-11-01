using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;
using Xunit;

namespace SmartFarm.Repositories.Tests;

public class TelemetryServiceTests
{
    private static AppDbContext Context() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Ingest_updates_device_and_is_idempotent_by_message_id()
    {
        await using var db = Context();
        var seeded = await SeedAsync(db);
        var service = new TelemetryService(db);
        var request = new TelemetryIngestRequest("msg-001", seeded.device.DeviceCode, DateTime.UtcNow,
            28.5f, 70, 62, 900);

        var first = await service.IngestAsync(request);
        var repeated = await service.IngestAsync(request with { Temperature = 30 });

        Assert.Equal(first.TelemetryId, repeated.TelemetryId);
        Assert.Equal(28.5f, repeated.Temperature);
        Assert.Single(await db.SensorTelemetry.ToListAsync());
        Assert.Equal(DeviceStatuses.Online, seeded.device.Status);
        Assert.NotNull(seeded.device.LastSeen);
    }

    [Fact]
    public async Task Ingest_rejects_invalid_or_unassigned_device_data()
    {
        await using var db = Context();
        var seeded = await SeedAsync(db);
        var service = new TelemetryService(db);

        var invalid = await Assert.ThrowsAsync<AppException>(() => service.IngestAsync(
            new("bad-range", seeded.device.DeviceCode, DateTime.UtcNow, 120, null, null, null)));
        Assert.Equal(400, invalid.StatusCode);

        db.TrayDevices.Single().IsActive = false;
        await db.SaveChangesAsync();
        var unassigned = await Assert.ThrowsAsync<AppException>(() => service.IngestAsync(
            new("unassigned", seeded.device.DeviceCode, DateTime.UtcNow, 25, null, null, null)));
        Assert.Equal(409, unassigned.StatusCode);
    }

    [Fact]
    public async Task Customer_can_only_read_telemetry_for_owned_rental()
    {
        await using var db = Context();
        var seeded = await SeedAsync(db);
        var service = new TelemetryService(db);
        await service.IngestAsync(new("owned-001", seeded.device.DeviceCode, DateTime.UtcNow,
            27, 68, 60, 750));

        var latest = await service.LatestCustomerAsync(seeded.customer.UserId, seeded.rental.RentalId);
        var history = await service.HistoryCustomerAsync(seeded.customer.UserId, seeded.rental.RentalId,
            new QueryRequest(), null, null);

        Assert.Equal("owned-001", latest.MessageId);
        Assert.Single(history.Items);
        var denied = await Assert.ThrowsAsync<AppException>(() =>
            service.LatestCustomerAsync(seeded.customer.UserId + 999, seeded.rental.RentalId));
        Assert.Equal(404, denied.StatusCode);
    }

    [Fact]
    public async Task Ingest_stores_actuator_states_when_provided()
    {
        await using var db = Context();
        var seeded = await SeedAsync(db);
        var service = new TelemetryService(db);

        // Telemetry kèm trạng thái thiết bị: quạt tắt, đèn bật, bơm tắt.
        var withStates = await service.IngestAsync(new TelemetryIngestRequest(
            "act-001", seeded.device.DeviceCode, DateTime.UtcNow, 31, 67, 2, 200,
            FanState: false, LedState: true, PumpState: false));

        Assert.False(withStates.FanState);
        Assert.True(withStates.LedState);
        Assert.False(withStates.PumpState);

        // Telemetry không gửi trạng thái -> giữ null (tương thích firmware cũ).
        var withoutStates = await service.IngestAsync(new TelemetryIngestRequest(
            "act-002", seeded.device.DeviceCode, DateTime.UtcNow, 30, 66, 3, 180));
        Assert.Null(withoutStates.FanState);
        Assert.Null(withoutStates.LedState);
        Assert.Null(withoutStates.PumpState);
    }

    [Fact]
    public async Task Latest_by_device_returns_newest_telemetry_with_actuator_states()
    {
        await using var db = Context();
        var seeded = await SeedAsync(db);
        var telemetry = new TelemetryService(db);
        var iot = new IoTManagementService(db);

        // Hai bản ghi: bản mới hơn có LED bật.
        await telemetry.IngestAsync(new TelemetryIngestRequest(
            "dev-old", seeded.device.DeviceCode, DateTime.UtcNow.AddMinutes(-2), 25, 60, 40, 500,
            FanState: false, LedState: false, PumpState: false));
        await telemetry.IngestAsync(new TelemetryIngestRequest(
            "dev-new", seeded.device.DeviceCode, DateTime.UtcNow, 31, 70, 20, 100,
            FanState: true, LedState: true, PumpState: false));

        var latest = await iot.LatestTelemetryAsync(seeded.device.DeviceId);

        Assert.Equal("dev-new", latest.MessageId);
        Assert.Equal(seeded.device.DeviceId, latest.DeviceId);
        Assert.True(latest.FanState);
        Assert.True(latest.LedState);
        Assert.False(latest.PumpState);
        Assert.False(latest.IsStale);
    }

    [Fact]
    public async Task Latest_by_device_throws_404_when_device_or_telemetry_missing()
    {
        await using var db = Context();
        var seeded = await SeedAsync(db);
        var iot = new IoTManagementService(db);

        // Thiết bị không tồn tại.
        var missingDevice = await Assert.ThrowsAsync<AppException>(() => iot.LatestTelemetryAsync(999999));
        Assert.Equal(404, missingDevice.StatusCode);

        // Thiết bị có nhưng chưa có telemetry nào.
        var noTelemetry = await Assert.ThrowsAsync<AppException>(() => iot.LatestTelemetryAsync(seeded.device.DeviceId));
        Assert.Equal(404, noTelemetry.StatusCode);
    }

    private static async Task<(IoTDevice device, User customer, TrayRental rental)> SeedAsync(AppDbContext db)
    {
        var zone = new FarmZone { ZoneName = "MQTT Zone", TotalCapacity = 4 };
        var rack = new FarmRack { Zone = zone, RackCode = "MQTT-R1", TotalTiers = 1, MaxTraysPerTier = 4 };
        var tray = new SoilTray { Rack = rack, TrayCode = "MQTT-T1", TierIndex = 1 };
        var device = new IoTDevice { DeviceCode = "ESP32-MQTT-01", DeviceType = "ESP32", Status = DeviceStatuses.Offline };
        var assignment = new TrayDevice { SoilTray = tray, Device = device, ComponentType = ComponentTypes.SoilMoisture };
        var customer = new User { FullName = "MQTT Customer", Email = "mqtt-customer@test.local", PasswordHash = "x" };
        var supply = new Supply { SupplyName = "MQTT Seed", SupplyType = SupplyType.Seed, HarvestDays = 10 };
        var order = new Order { Customer = customer, OrderCode = "MQTT01", ExpiresAt = DateTime.UtcNow.AddDays(1) };
        var rental = new TrayRental { Customer = customer, SoilTray = tray, Supply = supply, Order = order,
            StartDate = DateTime.UtcNow, ExpectedHarvestDate = DateTime.UtcNow.AddDays(10) };
        db.AddRange(assignment, rental);
        await db.SaveChangesAsync();
        return (device, customer, rental);
    }
}
