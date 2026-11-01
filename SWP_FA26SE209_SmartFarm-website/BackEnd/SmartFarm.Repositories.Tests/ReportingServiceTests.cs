using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services;
using SmartFarm.Services.Services;
using Xunit;

namespace SmartFarm.Repositories.Tests;

public class ReportingServiceTests
{
    private static AppDbContext Context()=>new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    [Fact]
    public async Task Reports_aggregate_unique_persisted_business_records()
    {
        await using var db=Context();var customer=new User{Email="report@test",FullName="C",PasswordHash="x"};var supply=new Supply{SupplyName="Radish",SupplyType=SupplyType.Seed,Unit="PACKET",QuantityInStock=8,MinStockLevel=10,IsActive=true};var order=new Order{Customer=customer,OrderCode="REPORT01",OrderType=OrderType.SeedPacket,OrderStatus=OrderStatus.Completed,CreatedAt=DateTime.UtcNow,ExpiresAt=DateTime.UtcNow};var payment=new Payment{Order=order,PaymentStatus=PaymentStatuses.Success,AmountPaid=2000,PaidAt=DateTime.UtcNow};db.AddRange(customer,supply,order,payment);await db.SaveChangesAsync();
        var service=new ReportingService(db,new InventoryService(db));var revenue=await service.RevenueAsync(null,null);Assert.Equal(2000,revenue.TotalRevenue);Assert.Equal(2000,revenue.RevenueByOrderType[OrderType.SeedPacket]);var inventory=await service.InventoryAsync();Assert.Equal(1,inventory.LowStockSupplies);Assert.Equal(8,inventory.TotalAvailable);
    }
    [Fact]
    public async Task Report_rejects_invalid_date_range()
    {
        await using var db=Context();var service=new ReportingService(db,new InventoryService(db));var error=await Assert.ThrowsAsync<AppException>(()=>service.RevenueAsync(DateTime.UtcNow,DateTime.UtcNow.AddDays(-1)));Assert.Equal(400,error.StatusCode);
    }
}
