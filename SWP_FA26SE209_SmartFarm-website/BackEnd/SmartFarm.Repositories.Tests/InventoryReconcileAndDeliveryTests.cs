using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;
using Xunit;

namespace SmartFarm.Repositories.Tests;

// GĐ4: (1) reconcile không double-count SALE; (2) SALE atomic với SHIPPING; (3) Delivery FAILED = phương án A.
public class InventoryReconcileAndDeliveryTests
{
    private static AppDbContext Context() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static User Customer() => new() { Email = "c@test.local", FullName = "C", PasswordHash = "x", Role = RoleNames.Customer };

    // Mô phỏng đúng vòng đời: đặt đơn (trừ tồn) -> ship (ghi SALE). Reconcile phải khớp, không lệch.
    [Fact]
    public async Task Reconcile_is_consistent_after_order_and_shipping_without_double_counting_sale()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = new Supply { SupplyName = "Seed", SupplyType = SupplyType.Seed, Unit = "goi",
            UnitPrice = 10, RentalPrice = 20, QuantityInStock = 10, MinStockLevel = 0, IsActive = true };
        db.AddRange(customer, seed);
        await db.SaveChangesAsync();

        // Đặt đơn seed-packet 4 -> QuantityInStock giảm còn 6 (reservation trừ khi đặt).
        var order = new OrderService(db);
        var created = await order.CreateSeedPacketAsync(customer.UserId,
            new CreateSeedPacketOrderRequest(seed.SupplyId, 4, "123 Farm Road", 10.80, 106.70));
        Assert.Equal(6, (await db.Supplies.FindAsync(seed.SupplyId))!.QuantityInStock);

        // Confirm -> tạo delivery -> ship (ghi bút toán SALE, KHÔNG trừ tồn lần hai).
        db.Payments.Add(new Payment
        {
            OrderId = created.OrderId,
            PaymentStatus = PaymentStatuses.Success,
            PaymentMethod = "BANK_TRANSFER",
            AmountPaid = created.TotalAmount,
            PaidAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        await order.TransitionAsync(created.OrderId, OrderStatus.Confirmed);
        var inventory = new InventoryService(db);
        var deliveries = new DeliveryService(db, null, inventory);
        var delivery = await deliveries.CreateAsync(new CreateDeliveryRequest(created.OrderId, null, "C", "0900000000", "A", null));
        await deliveries.UpdateAsync(delivery.DeliveryId, new(DeliveryStatuses.Packaged, null, null, null));
        await deliveries.UpdateAsync(delivery.DeliveryId, new(DeliveryStatuses.Shipping, null, null, null));

        // Tồn vẫn 6 (không bị trừ lần hai bởi SALE), có 1 bút toán SALE.
        Assert.Equal(6, (await db.Supplies.FindAsync(seed.SupplyId))!.QuantityInStock);
        Assert.Single(await db.MaterialMovements.Where(x => x.MovementType == MaterialMovementTypes.Sale).ToListAsync());

        // Reconcile phải RECONCILED (trước khi sửa bug sẽ MISMATCH do đếm SALE hai lần).
        var recon = (await inventory.ReconcileAsync(seed.SupplyId)).Single();
        Assert.True(recon.IsReconciled);
        Assert.Equal("RECONCILED", recon.Status);
        Assert.Equal(6, recon.ExpectedAvailable);
    }

    [Fact]
    public async Task Reconcile_ignores_sale_only_history()
    {
        await using var db = Context();
        var supply = new Supply { SupplyName = "Seed", SupplyType = SupplyType.Seed, Unit = "goi",
            QuantityInStock = 6, MinStockLevel = 0, IsActive = true };
        var customer = Customer();
        var order = new Order { Customer = customer, OrderCode = "SP-SALE", OrderType = OrderType.SeedPacket,
            OrderStatus = OrderStatus.Preparing, ExpiresAt = DateTime.UtcNow,
            Items = [new OrderItem { Supply = supply, ItemType = OrderType.SeedPacket, Quantity = 4 }] };
        db.AddRange(customer, supply, order);
        await db.SaveChangesAsync();
        var inventory = new InventoryService(db);
        await inventory.RecordSaleAsync(order.OrderId); // chỉ có bút toán SALE, không receipt/usage

        var recon = (await inventory.ReconcileAsync(supply.SupplyId)).Single();
        Assert.True(recon.IsReconciled);           // SALE bị loại khỏi công thức -> khớp tồn hiện tại
        Assert.Equal(6, recon.ExpectedAvailable);
    }

    [Fact]
    public async Task Failed_delivery_keeps_order_status_and_does_not_restore_stock()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = new Supply { SupplyName = "Seed", SupplyType = SupplyType.Seed, Unit = "goi",
            UnitPrice = 10, QuantityInStock = 10, MinStockLevel = 0, IsActive = true };
        var order = new Order { Customer = customer, OrderCode = "SP-FAIL", OrderType = OrderType.SeedPacket,
            OrderStatus = OrderStatus.Delivering, ExpiresAt = DateTime.UtcNow,
            Items = [new OrderItem { Supply = seed, ItemType = OrderType.SeedPacket, Quantity = 3 }] };
        var delivery = new Delivery { Order = order, RecipientName = "C", RecipientPhone = "0900000000",
            ShippingAddress = "A", DeliveryStatus = DeliveryStatuses.Shipping };
        db.AddRange(customer, seed, order, delivery);
        await db.SaveChangesAsync();
        var deliveries = new DeliveryService(db, null, new InventoryService(db));

        var result = await deliveries.UpdateAsync(delivery.DeliveryId, new(DeliveryStatuses.Failed, null, null, null));

        Assert.Equal(DeliveryStatuses.Failed, result.Status);
        // Phương án A: order giữ nguyên (Delivering), tồn KHÔNG được hoàn.
        Assert.Equal(OrderStatus.Delivering, (await db.Orders.FindAsync(order.OrderId))!.OrderStatus);
        Assert.Equal(10, (await db.Supplies.FindAsync(seed.SupplyId))!.QuantityInStock);
    }

    [Fact]
    public async Task Delivered_cannot_transition_to_failed()
    {
        await using var db = Context();
        var customer = Customer();
        var order = new Order { Customer = customer, OrderCode = "SP-DONE", OrderType = OrderType.SeedPacket,
            OrderStatus = OrderStatus.Completed, ExpiresAt = DateTime.UtcNow };
        var delivery = new Delivery { Order = order, RecipientName = "C", RecipientPhone = "0900000000",
            ShippingAddress = "A", DeliveryStatus = DeliveryStatuses.Delivered };
        db.AddRange(customer, order, delivery);
        await db.SaveChangesAsync();
        var deliveries = new DeliveryService(db);

        var err = await Assert.ThrowsAsync<AppException>(() =>
            deliveries.UpdateAsync(delivery.DeliveryId, new(DeliveryStatuses.Failed, null, null, null)));
        Assert.Equal(409, err.StatusCode);
    }
}
