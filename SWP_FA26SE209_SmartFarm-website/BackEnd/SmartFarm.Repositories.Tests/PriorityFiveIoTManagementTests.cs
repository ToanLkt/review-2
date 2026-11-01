using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;
using Xunit;

namespace SmartFarm.Repositories.Tests;

public class PriorityFiveIoTManagementTests
{
    private static AppDbContext Context()=>new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Device_crud_status_assignment_and_unassignment_work()
    {
        await using var db=Context();var tray=await SeedTrayAsync(db);var service=new IoTManagementService(db);
        var device=await service.CreateDeviceAsync(new("ESP32-01","AA:BB:CC:DD:EE:01","ESP32","1.0.0",DeviceStatuses.Offline));
        var updated=await service.UpdateDeviceAsync(device.DeviceId,new("ESP32-01","AA:BB:CC:DD:EE:01","ESP32","1.1.0",DeviceStatuses.Offline));
        Assert.Equal("1.1.0",updated.FirmwareVersion);
        var online=await service.UpdateStatusAsync(device.DeviceId,new(DeviceStatuses.Online,null));
        Assert.Equal(DeviceStatuses.Online,online.Status);Assert.NotNull(online.LastSeen);
        var assigned=await service.AssignAsync(new(tray.SoilTrayId,device.DeviceId,"A1",ComponentTypes.SoilMoisture));
        var repeated=await service.AssignAsync(new(tray.SoilTrayId,device.DeviceId,"A2",ComponentTypes.SoilMoisture));
        Assert.Equal(assigned.TrayDeviceId,repeated.TrayDeviceId);Assert.Single(await db.TrayDevices.ToListAsync());
        var error=await Assert.ThrowsAsync<AppException>(()=>service.DeactivateDeviceAsync(device.DeviceId));Assert.Equal(409,error.StatusCode);
        Assert.False((await service.DeactivateAssignmentAsync(assigned.TrayDeviceId)).IsActive);
        await service.DeactivateDeviceAsync(device.DeviceId);
        Assert.Equal(DeviceStatuses.Inactive,(await service.DeviceAsync(device.DeviceId)).Status);
    }

    [Fact]
    public async Task Snapshot_metadata_requires_device_assignment_to_rental_tray()
    {
        await using var db=Context();var tray=await SeedTrayAsync(db);var service=new IoTManagementService(db);
        var customer=new User{Email="iot-customer@test.local",FullName="Customer",PasswordHash="x"};
        var supply=new Supply{SupplyName="Seed",SupplyType=SupplyType.Seed,HarvestDays=7};
        var order=new Order{Customer=customer,OrderCode="IOT01",ExpiresAt=DateTime.UtcNow.AddDays(1)};
        var rental=new TrayRental{Customer=customer,Order=order,SoilTray=tray,Supply=supply,StartDate=DateTime.UtcNow,ExpectedHarvestDate=DateTime.UtcNow.AddDays(7)};
        db.AddRange(customer,supply,order,rental);await db.SaveChangesAsync();
        var camera=await service.CreateDeviceAsync(new("CAM-01",null,"CAMERA","1.0",DeviceStatuses.Online));
        await service.AssignAsync(new(tray.SoilTrayId,camera.DeviceId,null,ComponentTypes.Light));
        var snapshot=await service.AddSnapshotAsync(new(camera.DeviceId,rental.RentalId,"https://cdn.test/image.jpg",null));
        Assert.Equal(rental.RentalId,snapshot.RentalId);Assert.Single((await service.SnapshotsAsync(new QueryRequest(),rental.RentalId,null)).Items);
    }

    [Fact]
    public async Task Actuator_logs_can_be_viewed_and_alerts_resolved_idempotently()
    {
        await using var db=Context();var service=new IoTManagementService(db);
        var device=new IoTDevice{DeviceCode="ACT-01",DeviceType="ESP32",Status=DeviceStatuses.Online};db.Add(device);await db.SaveChangesAsync();
        db.Add(new ActuatorLog{DeviceId=device.DeviceId,ActuatorType=ComponentTypes.WaterPump,Action="ON",TriggeredBy="MANUAL",RequestedAt=DateTime.UtcNow,Result="SUCCESS"});
        var alert=new SystemAlert{DeviceId=device.DeviceId,AlertType="DEVICE_OFFLINE",Severity="CRITICAL",Message="Offline"};db.Add(alert);await db.SaveChangesAsync();
        Assert.Single((await service.ActuatorLogsAsync(new QueryRequest(),device.DeviceId,"SUCCESS",null,null)).Items);
        var rangeError=await Assert.ThrowsAsync<AppException>(()=>service.ActuatorLogsAsync(new QueryRequest(),null,null,DateTime.UtcNow,DateTime.UtcNow.AddDays(-1)));Assert.Equal(400,rangeError.StatusCode);
        Assert.Single((await service.AlertsAsync(new QueryRequest(),false,"CRITICAL",device.DeviceId)).Items);
        Assert.True((await service.ResolveAlertAsync(alert.AlertId,true)).IsResolved);
        Assert.True((await service.ResolveAlertAsync(alert.AlertId,true)).IsResolved);
    }

    [Fact]
    public async Task Manual_actuator_command_is_published_logged_and_acknowledged_idempotently()
    {
        await using var db=Context();var publisher=new FakeCommandPublisher();var service=new IoTManagementService(db,publisher);
        var user=new User{Email="staff-command@test.local",FullName="Staff",PasswordHash="x",Role=RoleNames.Staff};
        var device=new IoTDevice{DeviceCode="ESP32-TRAY-01",DeviceType="ESP32",Status=DeviceStatuses.Online};db.AddRange(user,device);await db.SaveChangesAsync();

        var pending=await service.ActuatorCommandAsync(device.DeviceId,user.UserId,new("PUMP","ON"));

        Assert.Equal("PENDING",pending.Result);Assert.Equal(ComponentTypes.WaterPump,pending.ActuatorType);
        Assert.Equal("ON",pending.Action);Assert.NotNull(publisher.Published);Assert.Equal(device.DeviceCode,publisher.Published!.DeviceCode);
        await service.ProcessActuatorAckAsync(new(pending.CommandId!,device.DeviceCode,"SUCCESS",null,DateTime.UtcNow));
        await service.ProcessActuatorAckAsync(new(pending.CommandId!,device.DeviceCode,"FAILED","duplicate",DateTime.UtcNow));
        var completed=await service.ActuatorCommandAsync(pending.CommandId!);
        Assert.Equal("SUCCESS",completed.Result);Assert.NotNull(completed.AcknowledgedAt);Assert.Null(completed.FailureReason);
    }

    [Fact]
    public async Task Manual_actuator_command_rejects_invalid_values_and_inactive_device()
    {
        await using var db=Context();var service=new IoTManagementService(db,new FakeCommandPublisher());
        var device=new IoTDevice{DeviceCode="ESP32-INACTIVE",DeviceType="ESP32",Status=DeviceStatuses.Inactive};db.Add(device);await db.SaveChangesAsync();
        var inactive=await Assert.ThrowsAsync<AppException>(()=>service.ActuatorCommandAsync(device.DeviceId,1,new("FAN","ON")));Assert.Equal(409,inactive.StatusCode);
        device.Status=DeviceStatuses.Online;await db.SaveChangesAsync();
        var actuator=await Assert.ThrowsAsync<AppException>(()=>service.ActuatorCommandAsync(device.DeviceId,1,new("HEATER","ON")));Assert.Equal(400,actuator.StatusCode);
        var action=await Assert.ThrowsAsync<AppException>(()=>service.ActuatorCommandAsync(device.DeviceId,1,new("LED","TOGGLE")));Assert.Equal(400,action.StatusCode);
    }

    [Fact]
    public async Task Failed_mqtt_publish_marks_command_failed()
    {
        await using var db=Context();var service=new IoTManagementService(db,new FakeCommandPublisher(true));
        var device=new IoTDevice{DeviceCode="ESP32-FAIL",DeviceType="ESP32",Status=DeviceStatuses.Online};db.Add(device);await db.SaveChangesAsync();
        var error=await Assert.ThrowsAsync<AppException>(()=>service.ActuatorCommandAsync(device.DeviceId,1,new("LED","OFF")));Assert.Equal(503,error.StatusCode);
        var log=await db.ActuatorLogs.SingleAsync();Assert.Equal("FAILED",log.Result);Assert.Contains("MQTT publish failed",log.FailureReason);
    }

    [Fact]
    public async Task Customer_can_view_latest_image_of_own_rental()
    {
        await using var db=Context();var tray=await SeedTrayAsync(db);var service=new IoTManagementService(db);
        var customer=new User{Email="own@test.local",FullName="Owner",PasswordHash="x",Role=RoleNames.Customer};
        var supply=new Supply{SupplyName="Seed",SupplyType=SupplyType.Seed,HarvestDays=7};
        var order=new Order{Customer=customer,OrderCode="CAM-OWN",ExpiresAt=DateTime.UtcNow.AddDays(1)};
        var rental=new TrayRental{Customer=customer,Order=order,SoilTray=tray,Supply=supply,StartDate=DateTime.UtcNow,ExpectedHarvestDate=DateTime.UtcNow.AddDays(7)};
        var cam=new IoTDevice{DeviceCode="CAM-OWN",DeviceType="CAMERA",Status=DeviceStatuses.Online};
        db.AddRange(customer,supply,order,rental,cam);await db.SaveChangesAsync();
        db.Add(new CameraSnapshot{DeviceId=cam.DeviceId,RentalId=rental.RentalId,ImageUrl="https://cdn/old.jpg",TakenAt=DateTime.UtcNow.AddHours(-2)});
        db.Add(new CameraSnapshot{DeviceId=cam.DeviceId,RentalId=rental.RentalId,ImageUrl="https://cdn/new.jpg",TakenAt=DateTime.UtcNow});
        await db.SaveChangesAsync();

        var latest=await service.LatestSnapshotForCustomerAsync(customer.UserId,rental.RentalId);
        Assert.Equal("https://cdn/new.jpg",latest.ImageUrl); // trả ảnh mới nhất
        var history=await service.SnapshotsForCustomerAsync(customer.UserId,rental.RentalId,new QueryRequest());
        Assert.Equal(2,history.TotalItems);
    }

    [Fact]
    public async Task Customer_cannot_view_another_customers_rental_images()
    {
        await using var db=Context();var tray=await SeedTrayAsync(db);var service=new IoTManagementService(db);
        var owner=new User{Email="o2@test.local",FullName="Owner",PasswordHash="x",Role=RoleNames.Customer};
        var other=new User{Email="x2@test.local",FullName="Other",PasswordHash="x",Role=RoleNames.Customer};
        var supply=new Supply{SupplyName="Seed",SupplyType=SupplyType.Seed,HarvestDays=7};
        var order=new Order{Customer=owner,OrderCode="CAM-X",ExpiresAt=DateTime.UtcNow.AddDays(1)};
        var rental=new TrayRental{Customer=owner,Order=order,SoilTray=tray,Supply=supply,StartDate=DateTime.UtcNow,ExpectedHarvestDate=DateTime.UtcNow.AddDays(7)};
        db.AddRange(owner,other,supply,order,rental);await db.SaveChangesAsync();

        // Người khác xem rental không phải của mình -> 404
        var err=await Assert.ThrowsAsync<AppException>(()=>service.LatestSnapshotForCustomerAsync(other.UserId,rental.RentalId));
        Assert.Equal(404,err.StatusCode);
    }

    [Fact]
    public async Task Latest_image_returns_404_when_no_snapshot_yet()
    {
        await using var db=Context();var tray=await SeedTrayAsync(db);var service=new IoTManagementService(db);
        var customer=new User{Email="nosnap@test.local",FullName="C",PasswordHash="x",Role=RoleNames.Customer};
        var supply=new Supply{SupplyName="Seed",SupplyType=SupplyType.Seed,HarvestDays=7};
        var order=new Order{Customer=customer,OrderCode="CAM-NONE",ExpiresAt=DateTime.UtcNow.AddDays(1)};
        var rental=new TrayRental{Customer=customer,Order=order,SoilTray=tray,Supply=supply,StartDate=DateTime.UtcNow,ExpectedHarvestDate=DateTime.UtcNow.AddDays(7)};
        db.AddRange(customer,supply,order,rental);await db.SaveChangesAsync();

        var err=await Assert.ThrowsAsync<AppException>(()=>service.LatestSnapshotForCustomerAsync(customer.UserId,rental.RentalId));
        Assert.Equal(404,err.StatusCode);
    }

    [Fact]
    public async Task Upload_snapshot_with_r2_enabled_returns_r2_url()
    {
        await using var db = Context();
        var tray = await SeedTrayAsync(db);
        var cam = new IoTDevice { DeviceCode = "CAM-R2", DeviceType = "CAMERA", Status = DeviceStatuses.Online };
        db.Add(cam);
        await db.SaveChangesAsync();

        var customer = new User { Email = "r2@test.local", FullName = "R2 Customer", PasswordHash = "x", Role = RoleNames.Customer };
        var supply = new Supply { SupplyName = "Seed", SupplyType = SupplyType.Seed, HarvestDays = 7 };
        var order = new Order { Customer = customer, OrderCode = "CAM-R2-ORD", ExpiresAt = DateTime.UtcNow.AddDays(1) };
        var rental = new TrayRental { Customer = customer, Order = order, SoilTray = tray, Supply = supply, StartDate = DateTime.UtcNow, ExpectedHarvestDate = DateTime.UtcNow.AddDays(7) };
        db.AddRange(customer, supply, order, rental);
        db.Add(new TrayDevice { DeviceId = cam.DeviceId, SoilTrayId = tray.SoilTrayId, ComponentType = ComponentTypes.Light, IsActive = true });
        await db.SaveChangesAsync();

        var r2Options = new CloudflareR2Options
        {
            Enabled = true,
            AccountId = "acc123",
            BucketName = "smartfarm-camera",
            ApiToken = "token123",
            PublicDomain = "https://pub-test.r2.dev"
        };

        var fakeHandler = new FakeHttpHandler(_ => new HttpResponseMessage(System.Net.HttpStatusCode.OK));
        var httpClient = new HttpClient(fakeHandler);
        var service = new IoTManagementService(db, null, r2Options, httpClient);

        var tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"));
        var res = await service.AddSnapshotFromUploadAsync(
            cam.DeviceId, rental.RentalId, DateTime.UtcNow,
            [1, 2, 3], ".jpg", tempDir, "http://localhost:5080");

        Assert.StartsWith("https://pub-test.r2.dev/", res.ImageUrl);
        Assert.EndsWith(".jpg", res.ImageUrl);
    }

    private sealed class FakeHttpHandler(Func<HttpRequestMessage, HttpResponseMessage> handler) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(handler(request));
    }

    private static async Task<SoilTray> SeedTrayAsync(AppDbContext db)
    {
        var zone=new FarmZone{ZoneName="IoT Zone",TotalCapacity=10};var rack=new FarmRack{Zone=zone,RackCode="IOT-R1",TotalTiers=1,MaxTraysPerTier=10};
        var tray=new SoilTray{Rack=rack,TrayCode="IOT-T1",TierIndex=1};db.Add(tray);await db.SaveChangesAsync();return tray;
    }

    private sealed class FakeCommandPublisher(bool fail=false):IActuatorCommandPublisher
    {
        public ActuatorCommandMessage? Published{get;private set;}
        public Task PublishAsync(ActuatorCommandMessage command,CancellationToken cancellationToken=default)
        {if(fail)throw new InvalidOperationException("broker unavailable");Published=command;return Task.CompletedTask;}
    }
}
