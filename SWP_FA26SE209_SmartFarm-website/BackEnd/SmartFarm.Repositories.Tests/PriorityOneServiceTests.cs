using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;
using Xunit;

namespace SmartFarm.Repositories.Tests;

public class PriorityOneServiceTests
{
    private static AppDbContext Context()
    {
        var options=new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task Create_tray_rejects_full_rack_tier()
    {
        await using var db=Context();
        var zone=new FarmZone{ZoneName="A",TotalCapacity=2};
        var rack=new FarmRack{Zone=zone,RackCode="R1",TotalTiers=1,MaxTraysPerTier=1};
        rack.SoilTrays.Add(new SoilTray{TrayCode="T1",TierIndex=1});
        db.Add(zone);await db.SaveChangesAsync();
        var service=new FarmInfrastructureService(db);
        await Assert.ThrowsAsync<AppException>(()=>service.CreateTrayAsync(new SoilTrayRequest(rack.RackId,"T2",1,TrayStatus.Available)));
    }

    [Fact]
    public async Task Create_tray_adds_available_tray_when_slot_free()
    {
        // Luồng mà cả admin (/admin/farm/trays) và staff (/staff/farm/trays) cùng gọi: CreateTrayAsync.
        await using var db=Context();
        var zone=new FarmZone{ZoneName="A",TotalCapacity=4};
        var rack=new FarmRack{Zone=zone,RackCode="R1",TotalTiers=2,MaxTraysPerTier=2};
        db.Add(zone);db.Add(rack);await db.SaveChangesAsync();
        var service=new FarmInfrastructureService(db);

        var created=await service.CreateTrayAsync(new SoilTrayRequest(rack.RackId,"A-002",1,TrayStatus.Available));

        Assert.True(created.SoilTrayId>0);
        Assert.Equal("A-002",created.TrayCode);
        Assert.Equal(1,created.TierIndex);
        Assert.Equal(TrayStatus.Available,created.CurrentStatus);
        Assert.Single(await db.SoilTrays.ToListAsync());

        // Trùng mã khay bị chặn.
        await Assert.ThrowsAsync<AppException>(()=>service.CreateTrayAsync(new SoilTrayRequest(rack.RackId,"A-002",2,TrayStatus.Available)));
    }

    [Fact]
    public async Task Threshold_rejects_minimum_greater_than_maximum()
    {
        await using var db=Context();
        var supply=new Supply{SupplyName="Seed",SupplyType=SupplyType.Seed,HarvestDays=7,Unit="Gói"};
        db.Add(supply);await db.SaveChangesAsync();
        var service=new CultivationService(db);
        var request=new CropThresholdRequest(supply.SupplyId,GrowthStage.Growing,80,20,40,80,20,30,100,500,12);
        await Assert.ThrowsAsync<AppException>(()=>service.CreateThresholdAsync(request));
    }

    [Fact]
    public async Task Generate_tasks_is_idempotent()
    {
        await using var db=Context();
        var customer=new User{Email="c@test.local",FullName="C",PasswordHash="x",Role=RoleNames.Customer};
        var supply=new Supply{SupplyName="Seed",SupplyType=SupplyType.Seed,HarvestDays=7,Unit="Gói"};
        var zone=new FarmZone{ZoneName="A",TotalCapacity=1};
        var rack=new FarmRack{Zone=zone,RackCode="R1",TotalTiers=1,MaxTraysPerTier=1};
        var tray=new SoilTray{Rack=rack,TrayCode="T1",TierIndex=1,CurrentStatus=TrayStatus.Rented};
        var order=new Order{OrderCode="O1",Customer=customer,ExpiresAt=DateTime.UtcNow.AddMinutes(30)};
        var rental=new TrayRental{Customer=customer,SoilTray=tray,Supply=supply,Order=order,StartDate=DateTime.UtcNow,ExpectedHarvestDate=DateTime.UtcNow.AddDays(7)};
        db.AddRange(customer,supply,zone,order,rental,new CareSchedule{Supply=supply,DayIndex=1,TaskName="Water",TargetStage=GrowthStage.Growing});
        await db.SaveChangesAsync();
        var service=new CultivationService(db);
        Assert.Equal(1,await service.GenerateTasksAsync(rental.RentalId));
        Assert.Equal(0,await service.GenerateTasksAsync(rental.RentalId));
        Assert.Single(await db.DailyTasks.ToListAsync());
    }
}
