using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;
using Xunit;

namespace SmartFarm.Repositories.Tests;

public class GrowingCycleTests
{
    private static AppDbContext Context() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    // Tạo 1 TrayRental đã HARVESTED với tổng chu kỳ cho trước; khay đang MAINTENANCE.
    private static async Task<TrayRental> SeedHarvestedAsync(AppDbContext db, int totalCycles, int currentCycle)
    {
        var zone = new FarmZone { ZoneName = "Z", TotalCapacity = 4 };
        var rack = new FarmRack { Zone = zone, RackCode = "R1", TotalTiers = 1, MaxTraysPerTier = 4 };
        var tray = new SoilTray { Rack = rack, TrayCode = "T1", TierIndex = 1, CurrentStatus = TrayStatus.Maintenance };
        var customer = new User { Email = "c@test.local", FullName = "C", PasswordHash = "x", Role = RoleNames.Customer };
        var supply = new Supply { SupplyName = "Seed", SupplyType = SupplyType.Seed, HarvestDays = 10, Unit = "goi" };
        var order = new Order { Customer = customer, OrderCode = "CYC1", ExpiresAt = DateTime.UtcNow.AddDays(1) };
        var rental = new TrayRental
        {
            Customer = customer, SoilTray = tray, Supply = supply, Order = order,
            StartDate = DateTime.UtcNow.AddDays(-10), ExpectedHarvestDate = DateTime.UtcNow,
            ActualHarvestDate = DateTime.UtcNow, CropStatus = CropStatus.Harvested,
            TotalCycles = totalCycles, CurrentCycle = currentCycle
        };
        db.AddRange(zone, rack, tray, customer, supply, order, rental);
        await db.SaveChangesAsync();
        return rental;
    }

    // Đánh dấu chu kỳ hiện tại của rental đã GIAO XONG (delivery DELIVERED) — điều kiện cho next-cycle (A1).
    private static async Task MarkCurrentCycleDeliveredAsync(AppDbContext db, TrayRental rental)
    {
        db.Deliveries.Add(new Delivery
        {
            OrderId = rental.OrderId, RentalId = rental.RentalId, CycleNumber = rental.CurrentCycle,
            RecipientName = "R", RecipientPhone = "0900000000", ShippingAddress = "A",
            DeliveryStatus = DeliveryStatuses.Delivered, DeliveredAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task Next_cycle_increments_and_replants_when_cycles_remain()
    {
        await using var db = Context();
        var rental = await SeedHarvestedAsync(db, totalCycles: 3, currentCycle: 1);
        await MarkCurrentCycleDeliveredAsync(db, rental);
        var service = new CultivationService(db);

        var result = await service.NextCycleAsync(rental.RentalId);

        Assert.Equal(2, result.CurrentCycle);
        Assert.Equal(3, result.TotalCycles);
        Assert.Equal(CropStatus.Planted, result.CropStatus);
        Assert.Null(result.ActualHarvestDate);
        Assert.True(result.HasNextCycle);           // 2 < 3 -> còn chu kỳ nữa
        var tray = await db.SoilTrays.FirstAsync();
        Assert.Equal(TrayStatus.Rented, tray.CurrentStatus); // khay trồng lại
    }

    [Fact]
    public async Task Next_cycle_blocked_until_current_cycle_delivered()
    {
        await using var db = Context();
        var rental = await SeedHarvestedAsync(db, totalCycles: 3, currentCycle: 1);
        // Chưa có delivery DELIVERED cho chu kỳ hiện tại.
        var service = new CultivationService(db);

        var err = await Assert.ThrowsAsync<AppException>(() => service.NextCycleAsync(rental.RentalId));
        Assert.Equal(409, err.StatusCode);
    }

    [Fact]
    public async Task Delivered_non_final_cycle_keeps_order_confirmed_not_completed()
    {
        await using var db = Context();
        var rental = await SeedHarvestedAsync(db, totalCycles: 2, currentCycle: 1); // chu kỳ 1/2 (chưa cuối)
        // Tạo delivery cho chu kỳ 1 ở trạng thái SHIPPING rồi mark DELIVERED qua service.
        db.Deliveries.Add(new Delivery
        {
            OrderId = rental.OrderId, RentalId = rental.RentalId, CycleNumber = 1,
            RecipientName = "R", RecipientPhone = "0900000000", ShippingAddress = "A",
            DeliveryStatus = DeliveryStatuses.Shipping, ShippedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        var deliveryId = (await db.Deliveries.FirstAsync()).DeliveryId;
        var delivery = new DeliveryService(db);

        await delivery.UpdateAsync(deliveryId, new UpdateDeliveryRequest(DeliveryStatuses.Delivered, null, null, null));

        var order = await db.Orders.FirstAsync(o => o.OrderId == rental.OrderId);
        Assert.Equal(OrderStatus.Confirmed, order.OrderStatus); // chưa cuối -> quay về CONFIRMED, KHÔNG completed
    }

    [Fact]
    public async Task Delivered_final_cycle_completes_order()
    {
        await using var db = Context();
        var rental = await SeedHarvestedAsync(db, totalCycles: 2, currentCycle: 2); // chu kỳ cuối
        db.Deliveries.Add(new Delivery
        {
            OrderId = rental.OrderId, RentalId = rental.RentalId, CycleNumber = 2,
            RecipientName = "R", RecipientPhone = "0900000000", ShippingAddress = "A",
            DeliveryStatus = DeliveryStatuses.Shipping, ShippedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        var deliveryId = (await db.Deliveries.FirstAsync()).DeliveryId;
        var delivery = new DeliveryService(db);

        await delivery.UpdateAsync(deliveryId, new UpdateDeliveryRequest(DeliveryStatuses.Delivered, null, null, null));

        var order = await db.Orders.FirstAsync(o => o.OrderId == rental.OrderId);
        Assert.Equal(OrderStatus.Completed, order.OrderStatus); // chu kỳ cuối -> COMPLETED
    }

    [Fact]
    public async Task Next_cycle_on_last_cycle_is_rejected()
    {
        await using var db = Context();
        var rental = await SeedHarvestedAsync(db, totalCycles: 3, currentCycle: 3); // đã ở chu kỳ cuối
        var service = new CultivationService(db);

        var err = await Assert.ThrowsAsync<AppException>(() => service.NextCycleAsync(rental.RentalId));
        Assert.Equal(409, err.StatusCode);
    }

    [Fact]
    public async Task Next_cycle_requires_harvested_status()
    {
        await using var db = Context();
        var rental = await SeedHarvestedAsync(db, totalCycles: 3, currentCycle: 1);
        rental.CropStatus = CropStatus.Growing; // chưa thu hoạch
        await db.SaveChangesAsync();
        var service = new CultivationService(db);

        var err = await Assert.ThrowsAsync<AppException>(() => service.NextCycleAsync(rental.RentalId));
        Assert.Equal(409, err.StatusCode);
    }

    [Fact]
    public async Task Activate_due_plantings_flips_waiting_to_planted_when_due()
    {
        await using var db = Context();
        var zone = new FarmZone { ZoneName = "Z", TotalCapacity = 4 };
        var rack = new FarmRack { Zone = zone, RackCode = "R1", TotalTiers = 1, MaxTraysPerTier = 4 };
        var tray = new SoilTray { Rack = rack, TrayCode = "T1", TierIndex = 1, CurrentStatus = TrayStatus.Rented };
        var customer = new User { Email = "c@test.local", FullName = "C", PasswordHash = "x", Role = RoleNames.Customer };
        var supply = new Supply { SupplyName = "Seed", SupplyType = SupplyType.Seed, HarvestDays = 10, Unit = "goi" };
        // Đơn đã CONFIRMED (đã thanh toán) -> mới được phép kích hoạt gieo.
        var order = new Order { Customer = customer, OrderCode = "WAIT1", OrderStatus = OrderStatus.Confirmed, ExpiresAt = DateTime.UtcNow.AddDays(1) };
        // Khay 1: tới ngày (StartDate quá khứ) -> sẽ PLANTED. Khay 2: còn tương lai -> giữ WAITING.
        var due = new TrayRental { Customer = customer, SoilTray = tray, Supply = supply, Order = order, StartDate = DateTime.UtcNow.AddHours(-1), ExpectedHarvestDate = DateTime.UtcNow.AddDays(10), CropStatus = CropStatus.WaitingPlanting };
        var tray2 = new SoilTray { Rack = rack, TrayCode = "T2", TierIndex = 1, CurrentStatus = TrayStatus.Rented };
        var notDue = new TrayRental { Customer = customer, SoilTray = tray2, Supply = supply, Order = order, StartDate = DateTime.UtcNow.AddDays(2), ExpectedHarvestDate = DateTime.UtcNow.AddDays(12), CropStatus = CropStatus.WaitingPlanting };
        db.AddRange(zone, rack, tray, tray2, customer, supply, order, due, notDue);
        await db.SaveChangesAsync();
        var service = new CultivationService(db);

        var count = await service.ActivateDuePlantingsAsync(DateTime.UtcNow);

        Assert.Equal(1, count);
        Assert.Equal(CropStatus.Planted, (await db.TrayRentals.FindAsync(due.RentalId))!.CropStatus);
        Assert.Equal(CropStatus.WaitingPlanting, (await db.TrayRentals.FindAsync(notDue.RentalId))!.CropStatus);
    }

    [Fact]
    public async Task Activate_due_plantings_skips_rental_when_order_not_confirmed()
    {
        await using var db = Context();
        var zone = new FarmZone { ZoneName = "Z", TotalCapacity = 4 };
        var rack = new FarmRack { Zone = zone, RackCode = "R1", TotalTiers = 1, MaxTraysPerTier = 4 };
        var tray = new SoilTray { Rack = rack, TrayCode = "T1", TierIndex = 1, CurrentStatus = TrayStatus.Rented };
        var customer = new User { Email = "c@test.local", FullName = "C", PasswordHash = "x", Role = RoleNames.Customer };
        var supply = new Supply { SupplyName = "Seed", SupplyType = SupplyType.Seed, HarvestDays = 10, Unit = "goi" };
        // Đơn CHƯA thanh toán (AWAITING_PAYMENT) nhưng khay đã tới ngày trồng.
        var order = new Order { Customer = customer, OrderCode = "WAIT2", OrderStatus = OrderStatus.AwaitingPayment, ExpiresAt = DateTime.UtcNow.AddDays(1) };
        var due = new TrayRental { Customer = customer, SoilTray = tray, Supply = supply, Order = order, StartDate = DateTime.UtcNow.AddHours(-1), ExpectedHarvestDate = DateTime.UtcNow.AddDays(10), CropStatus = CropStatus.WaitingPlanting };
        db.AddRange(zone, rack, tray, customer, supply, order, due);
        await db.SaveChangesAsync();
        var service = new CultivationService(db);

        var count = await service.ActivateDuePlantingsAsync(DateTime.UtcNow);

        // Chưa thanh toán -> không được bắt đầu trồng dù đã tới ngày.
        Assert.Equal(0, count);
        Assert.Equal(CropStatus.WaitingPlanting, (await db.TrayRentals.FindAsync(due.RentalId))!.CropStatus);
    }

    [Fact]
    public async Task Harvest_reports_remaining_cycles()
    {
        await using var db = Context();
        var rental = await SeedHarvestedAsync(db, totalCycles: 2, currentCycle: 1);
        rental.CropStatus = CropStatus.ReadyToHarvest; // chuẩn bị thu hoạch
        await db.SaveChangesAsync();
        var service = new CultivationService(db);

        var result = await service.HarvestAsync(rental.RentalId, new HarvestRequest(null));

        Assert.Equal(CropStatus.Harvested, result.CropStatus);
        Assert.True(result.HasNextCycle); // currentCycle 1 < total 2
    }
}
