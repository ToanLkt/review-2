using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;
using Xunit;

namespace SmartFarm.Repositories.Tests;

public class InventoryServiceTests
{
    private static AppDbContext Context()=>new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Balance_separates_on_hand_reserved_and_available()
    {
        await using var db=Context();var supply=new Supply{SupplyName="Radish",SupplyType=SupplyType.Seed,Unit="PACKET",QuantityInStock=8,MinStockLevel=3,IsActive=true};
        db.Add(supply);db.Add(new Order{OrderCode="INV01",Customer=new User{Email="inv@test",FullName="C",PasswordHash="x"},OrderType=OrderType.SeedPacket,OrderStatus=OrderStatus.AwaitingPayment,ExpiresAt=DateTime.UtcNow.AddMinutes(10),Items=[new OrderItem{Supply=supply,ItemType=OrderType.SeedPacket,Quantity=2}]});await db.SaveChangesAsync();
        var balance=await new InventoryService(db).BalanceAsync(supply.SupplyId);Assert.Equal(10,balance.OnHand);Assert.Equal(2,balance.Reserved);Assert.Equal(8,balance.Available);
    }

    [Fact]
    public async Task Receipt_and_usage_write_movements_and_reject_excess_usage()
    {
        await using var db=Context();var supply=new Supply{SupplyName="Soil",SupplyType=SupplyType.SoilSubstrate,Unit="KG",QuantityInStock=5,IsActive=true};db.Add(supply);await db.SaveChangesAsync();var service=new InventoryService(db);
        await service.ReceiveAsync(supply.SupplyId,7,new(3,"Nhập kho"));await service.UseAsync(supply.SupplyId,7,new(4,"Trồng cây"));Assert.Equal(4,supply.QuantityInStock);Assert.Equal(2,await db.MaterialMovements.CountAsync());
        var error=await Assert.ThrowsAsync<AppException>(()=>service.UseAsync(supply.SupplyId,7,new(5,"Quá tồn")));Assert.Equal(409,error.StatusCode);
    }

    [Fact]
    public async Task Shipping_records_sale_once_and_low_stock_alert_is_refreshed_then_resolved()
    {
        await using var db=Context();var customer=new User{Email="sale@test",FullName="C",PasswordHash="x"};var supply=new Supply{SupplyName="Seed",SupplyType=SupplyType.Seed,Unit="PACKET",QuantityInStock=2,MinStockLevel=3,IsActive=true};var order=new Order{Customer=customer,OrderCode="SALE01",OrderType=OrderType.SeedPacket,OrderStatus=OrderStatus.Preparing,ExpiresAt=DateTime.UtcNow,Items=[new OrderItem{Supply=supply,ItemType=OrderType.SeedPacket,Quantity=2}]};var delivery=new Delivery{Order=order,RecipientName="C",RecipientPhone="0900000000",ShippingAddress="A"};db.AddRange(customer,supply,order,delivery);await db.SaveChangesAsync();var inventory=new InventoryService(db);var deliveries=new DeliveryService(db,null,inventory);
        await deliveries.UpdateAsync(delivery.DeliveryId,new(DeliveryStatuses.Packaged,null,null,null));await deliveries.UpdateAsync(delivery.DeliveryId,new(DeliveryStatuses.Shipping,null,null,null));await deliveries.UpdateAsync(delivery.DeliveryId,new(DeliveryStatuses.Shipping,null,null,null));Assert.Single(await db.MaterialMovements.Where(x=>x.MovementType==MaterialMovementTypes.Sale).ToListAsync());Assert.Single(await db.SystemAlerts.Where(x=>x.AlertType=="LOW_STOCK"&&!x.IsResolved).ToListAsync());
        await inventory.ReceiveAsync(supply.SupplyId,1,new(5,"Bổ sung"));Assert.Empty(await db.SystemAlerts.Where(x=>x.AlertType=="LOW_STOCK"&&!x.IsResolved).ToListAsync());Assert.All(await inventory.ReconcileAsync(supply.SupplyId),x=>Assert.True(x.IsReconciled));
    }
}
