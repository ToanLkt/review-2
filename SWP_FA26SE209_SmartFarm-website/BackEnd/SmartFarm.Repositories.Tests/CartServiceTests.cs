using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;
using Xunit;

namespace SmartFarm.Repositories.Tests;

public class CartServiceTests
{
    private static AppDbContext Context() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static CartService NewService(AppDbContext db) => new(db);

    private static User Customer(string email = "customer@test.local") => new()
    { Email = email, FullName = "Test Customer", PasswordHash = "x", Role = RoleNames.Customer };

    private static Supply Seed(decimal rentalPrice = 20, int harvestDays = 10) => new()
    { SupplyName = "Rau muong", SupplyType = SupplyType.Seed, HarvestDays = harvestDays, Unit = "goi",
      UnitPrice = 10, RentalPrice = rentalPrice, QuantityInStock = 100, IsActive = true };

    private static (FarmZone zone, SoilTray[] trays) Trays(int count)
    {
        var zone = new FarmZone { ZoneName = "Zone " + Guid.NewGuid().ToString("N")[..6], TotalCapacity = count, IsActive = true };
        var rack = new FarmRack { Zone = zone, RackCode = "R" + Guid.NewGuid().ToString("N")[..6], TotalTiers = 1, MaxTraysPerTier = count };
        var trays = Enumerable.Range(1, count).Select(i => new SoilTray
        { Rack = rack, TrayCode = "T" + Guid.NewGuid().ToString("N")[..6], TierIndex = 1, CurrentStatus = TrayStatus.Available }).ToArray();
        return (zone, trays);
    }

    [Fact]
    public async Task Add_item_creates_cart_and_computes_line_total()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(rentalPrice: 25);
        db.AddRange(customer, seed);
        await db.SaveChangesAsync();
        var svc = NewService(db);

        var cart = await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));

        Assert.Equal(1, cart.ItemCount);
        Assert.Equal(25, cart.Items[0].RentalPrice);
        Assert.Equal(25, cart.Items[0].LineTotal); // LineTotal = RentalPrice * cycles
        Assert.Equal(25, cart.Subtotal);
        Assert.Equal(25, cart.Total);
    }

    [Fact]
    public async Task Add_multiple_items_sums_subtotal()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(rentalPrice: 30);
        db.AddRange(customer, seed);
        await db.SaveChangesAsync();
        var svc = NewService(db);

        await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));
        await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));
        var cart = await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));

        Assert.Equal(3, cart.ItemCount);
        Assert.Equal(90, cart.Subtotal);
    }

    [Fact]
    public async Task Add_item_with_unknown_farm_area_returns_404()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed();
        db.AddRange(customer, seed);
        await db.SaveChangesAsync();
        var svc = NewService(db);

        var err = await Assert.ThrowsAsync<AppException>(() =>
            svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, 9999)));
        Assert.Equal(404, err.StatusCode);
    }

    [Fact]
    public async Task Remove_item_updates_cart()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed();
        db.AddRange(customer, seed);
        await db.SaveChangesAsync();
        var svc = NewService(db);
        await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));
        var cart = await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));

        var after = await svc.RemoveItemAsync(customer.UserId, cart.Items[0].CartItemId);

        Assert.Equal(1, after.ItemCount);
    }

    [Fact]
    public async Task Update_item_cycles_updates_line_total_and_subtotal()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(rentalPrice: 20);
        db.AddRange(customer, seed);
        await db.SaveChangesAsync();
        var svc = NewService(db);
        var cart = await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null, TotalCycles: 1));
        var itemId = cart.Items[0].CartItemId;

        var updated = await svc.UpdateItemAsync(customer.UserId, itemId, new UpdateCartItemRequest(TotalCycles: 3));

        Assert.Equal(3, updated.Items[0].TotalCycles);
        Assert.Equal(60, updated.Items[0].LineTotal);
        Assert.Equal(60, updated.Subtotal);
        Assert.Equal(60, updated.Total);
    }

    [Fact]
    public async Task Update_nonexistent_item_throws_404()
    {
        await using var db = Context();
        var customer = Customer();
        db.Add(customer);
        await db.SaveChangesAsync();
        var svc = NewService(db);

        var ex = await Assert.ThrowsAsync<AppException>(() =>
            svc.UpdateItemAsync(customer.UserId, 9999, new UpdateCartItemRequest(TotalCycles: 2)));
        Assert.Equal(404, ex.StatusCode);
    }

    [Fact]
    public async Task Checkout_creates_one_order_with_a_rental_per_item_and_locks_trays()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(rentalPrice: 20, harvestDays: 12);
        var (zone, trays) = Trays(3);
        db.AddRange(customer, seed, zone);
        db.AddRange(trays.Cast<object>().ToArray());
        await db.SaveChangesAsync();
        var svc = NewService(db);
        await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));
        await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));

        var order = await svc.CheckoutAsync(customer.UserId, new CheckoutCartRequest(ShippingAddress: "Test Addr", ShippingLatitude: 10.80, ShippingLongitude: 106.70));

        Assert.Equal(OrderType.TrayRental, order.OrderType);
        Assert.Equal(OrderStatus.AwaitingPayment, order.Status);
        Assert.Equal(2, order.Rentals.Count);                 // 2 khay = 2 rental
        Assert.Equal(40, order.TotalAmount);                  // 2 x 20, GĐ1 chưa có phí
        Assert.Equal(2, await db.SoilTrays.CountAsync(t => t.CurrentStatus == TrayStatus.Rented));
        Assert.Equal(0, await db.CartItems.CountAsync());     // giỏ được dọn sau checkout
    }

    [Fact]
    public async Task Checkout_applies_quantity_discount_when_tray_threshold_met()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(rentalPrice: 100);
        var (zone, trays) = Trays(3);
        // Cấu hình: đạt 3 khay giảm 10%.
        db.Add(new FarmConfig { DiscountTrayThreshold = 3, StandardDiscountPercent = 10, LoyalOrderThreshold = 99, LoyalDiscountPercent = 15 });
        db.AddRange(customer, seed, zone);
        db.AddRange(trays.Cast<object>().ToArray());
        await db.SaveChangesAsync();
        var svc = NewService(db);
        for (int i = 0; i < 3; i++)
            await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));

        var order = await svc.CheckoutAsync(customer.UserId, new CheckoutCartRequest(ShippingAddress: "Test Addr", ShippingLatitude: 10.80, ShippingLongitude: 106.70));

        // 3 x 100 = 300, giảm 10% = 30 -> 270 (chưa phí vì GĐ1 không có pricing rule).
        Assert.Equal(270, order.TotalAmount);
    }

    [Fact]
    public async Task Checkout_multiplies_price_by_cycles_and_applies_cycle_discount()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(rentalPrice: 100);
        var (zone, trays) = Trays(1);
        // Đạt 3 chu kỳ -> giảm 10%. Không đạt mốc số khay (chỉ 1 khay).
        db.Add(new FarmConfig { DiscountCycleThreshold = 3, DiscountTrayThreshold = 99, StandardDiscountPercent = 10, LoyalOrderThreshold = 99, LoyalDiscountPercent = 15 });
        db.AddRange(customer, seed, zone);
        db.AddRange(trays.Cast<object>().ToArray());
        await db.SaveChangesAsync();
        var svc = NewService(db);
        // 1 khay, 3 chu kỳ.
        await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null, 3));

        var order = await svc.CheckoutAsync(customer.UserId, new CheckoutCartRequest(ShippingAddress: "Test Addr", ShippingLatitude: 10.80, ShippingLongitude: 106.70));

        // 100 x 3 chu kỳ = 300, giảm 10% = 30 -> 270 (GĐ1 chưa có phí).
        Assert.Equal(270, order.TotalAmount);
    }

    [Fact]
    public async Task Cart_response_shows_cycles_and_multiplied_line_total()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(rentalPrice: 50);
        db.AddRange(customer, seed);
        await db.SaveChangesAsync();
        var svc = NewService(db);

        var cart = await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null, 4));

        Assert.Equal(4, cart.Items[0].TotalCycles);
        Assert.Equal(50, cart.Items[0].RentalPrice);
        Assert.Equal(200, cart.Items[0].LineTotal);  // 50 x 4 (phí = 0 ở GĐ1)
        Assert.Equal(200, cart.Subtotal);
    }

    [Fact]
    public async Task Checkout_applies_loyal_discount_when_completed_orders_threshold_met()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(rentalPrice: 100);
        var (zone, trays) = Trays(1);
        db.Add(new FarmConfig { DiscountTrayThreshold = 99, StandardDiscountPercent = 10, LoyalOrderThreshold = 2, LoyalDiscountPercent = 15 });
        db.AddRange(customer, seed, zone);
        db.AddRange(trays.Cast<object>().ToArray());
        await db.SaveChangesAsync();
        // Khách đã có 2 đơn COMPLETED -> đạt mốc thân thiết.
        db.AddRange(
            new Order { CustomerId = customer.UserId, OrderCode = "C1", OrderType = OrderType.TrayRental, OrderStatus = OrderStatus.Completed, ExpiresAt = DateTime.UtcNow },
            new Order { CustomerId = customer.UserId, OrderCode = "C2", OrderType = OrderType.TrayRental, OrderStatus = OrderStatus.Completed, ExpiresAt = DateTime.UtcNow });
        await db.SaveChangesAsync();
        var svc = NewService(db);
        await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));

        var order = await svc.CheckoutAsync(customer.UserId, new CheckoutCartRequest(ShippingAddress: "Test Addr", ShippingLatitude: 10.80, ShippingLongitude: 106.70));

        // 1 x 100, giảm 15% = 15 -> 85.
        Assert.Equal(85, order.TotalAmount);
    }

    [Fact]
    public async Task Add_item_rejects_planting_date_beyond_max_pre_order_days()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed();
        db.Add(new FarmConfig { MaxPreOrderDays = 7 });
        db.AddRange(customer, seed);
        await db.SaveChangesAsync();
        var svc = NewService(db);

        var err = await Assert.ThrowsAsync<AppException>(() =>
            svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null, 1, DateTime.UtcNow.AddDays(10))));
        Assert.Equal(409, err.StatusCode);
    }

    [Fact]
    public async Task Checkout_keeps_all_rentals_waiting_planting_until_payment()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(rentalPrice: 50, harvestDays: 10);
        var (zone, trays) = Trays(2);
        db.Add(new FarmConfig { MaxPreOrderDays = 7 });
        db.AddRange(customer, seed, zone);
        db.AddRange(trays.Cast<object>().ToArray());
        await db.SaveChangesAsync();
        var svc = NewService(db);
        // Khay 1: trồng ngay (không chọn ngày). Khay 2: trồng sau 3 ngày.
        await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null, 1, null));
        var future = DateTime.UtcNow.Date.AddDays(3);
        await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null, 1, future));

        var order = await svc.CheckoutAsync(customer.UserId, new CheckoutCartRequest(ShippingAddress: "Test Addr", ShippingLatitude: 10.80, ShippingLongitude: 106.70));

        var rentals = await db.TrayRentals.Where(r => r.OrderId == order.OrderId).OrderBy(r => r.StartDate).ToListAsync();
        Assert.Equal(2, rentals.Count);
        // Chưa thanh toán -> KHÔNG được bắt đầu trồng: cả hai khay đều WAITING_PLANTING,
        // kể cả khay "trồng ngay". StartDate vẫn được lưu để kích hoạt sau khi đơn CONFIRMED.
        Assert.All(rentals, r => Assert.Equal(CropStatus.WaitingPlanting, r.CropStatus));
        var waiting = rentals.First(r => r.StartDate.Date == future);
        Assert.Equal(future, waiting.StartDate.Date);
        Assert.Equal(future.AddDays(10), waiting.ExpectedHarvestDate.Date);
        // Order.TargetPlantingDate = ngày sớm nhất đã chọn (chỉ khay 2 có chọn).
        var dbOrder = await db.Orders.FirstAsync(o => o.OrderId == order.OrderId);
        Assert.Equal(future, dbOrder.TargetPlantingDate!.Value.Date);
    }

    [Fact]
    public async Task Checkout_persists_pricing_snapshot_on_order()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(rentalPrice: 100);
        var (zone, trays) = Trays(3);
        db.Add(new FarmConfig { DiscountTrayThreshold = 3, StandardDiscountPercent = 10, LoyalOrderThreshold = 99, LoyalDiscountPercent = 15, MaxPreOrderDays = 7 });
        db.AddRange(customer, seed, zone);
        db.AddRange(trays.Cast<object>().ToArray());
        await db.SaveChangesAsync();
        var svc = NewService(db);
        for (int i = 0; i < 3; i++) await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));

        var order = await svc.CheckoutAsync(customer.UserId, new CheckoutCartRequest(IsRiskAccepted: true, ShippingAddress: "Test Addr", ShippingLatitude: 10.80, ShippingLongitude: 106.70));

        var dbOrder = await db.Orders.FirstAsync(o => o.OrderId == order.OrderId);
        Assert.Equal(300, dbOrder.Subtotal);          // 3 x 100
        Assert.Equal(10, dbOrder.DiscountPercent);     // đạt mốc 3 khay
        Assert.Equal(30, dbOrder.DiscountAmount);      // 10% của 300
        Assert.Equal(270, dbOrder.TotalAmount);        // 300 - 30 (phí = 0 GĐ1)
    }

    [Fact]
    public async Task Cart_response_exposes_planting_date_and_discount_preview()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(rentalPrice: 100);
        db.Add(new FarmConfig { DiscountTrayThreshold = 2, StandardDiscountPercent = 10, LoyalOrderThreshold = 99, LoyalDiscountPercent = 15, MaxPreOrderDays = 7 });
        db.AddRange(customer, seed);
        await db.SaveChangesAsync();
        var svc = NewService(db);
        var plant = DateTime.UtcNow.Date.AddDays(2);
        await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null, 1, plant));
        var cart = await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));

        Assert.Equal(plant, cart.Items.First(i => i.TargetPlantingDate.HasValue).TargetPlantingDate!.Value.Date);
        Assert.Equal(10, cart.DiscountPercent);  // 2 khay đạt ngưỡng
        Assert.Equal(20, cart.DiscountAmount);   // 10% của 200
        Assert.Equal(180, cart.Total);           // 200 - 20
    }

    [Fact]
    public async Task Checkout_persists_risk_acceptance_on_order()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed();
        var (zone, trays) = Trays(1);
        db.AddRange(customer, seed, zone);
        db.AddRange(trays.Cast<object>().ToArray());
        await db.SaveChangesAsync();
        var svc = NewService(db);
        await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));

        var order = await svc.CheckoutAsync(customer.UserId, new CheckoutCartRequest(IsRiskAccepted: true, ShippingAddress: "Test Addr", ShippingLatitude: 10.80, ShippingLongitude: 106.70));

        var dbOrder = await db.Orders.FirstAsync(o => o.OrderId == order.OrderId);
        Assert.True(dbOrder.IsRiskAccepted); // checkout lưu cờ -> thanh toán không bị chặn
    }

    [Fact]
    public async Task Checkout_empty_cart_returns_400()
    {
        await using var db = Context();
        var customer = Customer();
        db.Add(customer);
        await db.SaveChangesAsync();
        var svc = NewService(db);

        var err = await Assert.ThrowsAsync<AppException>(() => svc.CheckoutAsync(customer.UserId, new CheckoutCartRequest(ShippingAddress: "Test Addr", ShippingLatitude: 10.80, ShippingLongitude: 106.70)));
        Assert.Equal(400, err.StatusCode);
    }

    [Fact]
    public async Task Checkout_without_enough_trays_returns_409()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed();
        var (zone, trays) = Trays(1); // chỉ 1 khay nhưng giỏ có 2 dòng
        db.AddRange(customer, seed, zone);
        db.AddRange(trays.Cast<object>().ToArray());
        await db.SaveChangesAsync();
        var svc = NewService(db);
        await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));
        await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));

        var err = await Assert.ThrowsAsync<AppException>(() => svc.CheckoutAsync(customer.UserId, new CheckoutCartRequest(ShippingAddress: "Test Addr", ShippingLatitude: 10.80, ShippingLongitude: 106.70)));
        Assert.Equal(409, err.StatusCode);
    }

    [Fact]
    public async Task Checkout_with_selected_cart_item_only_processes_and_removes_selected_item()
    {
        await using var db = Context();
        var customer = Customer();
        var seed1 = Seed(rentalPrice: 20);
        var seed2 = new Supply
        {
            SupplyName = "Cai ngot", SupplyType = SupplyType.Seed, HarvestDays = 15, Unit = "goi",
            UnitPrice = 12, RentalPrice = 30, QuantityInStock = 100, IsActive = true
        };
        var (zone, trays) = Trays(3);
        db.AddRange(customer, seed1, seed2, zone);
        db.AddRange(trays.Cast<object>().ToArray());
        await db.SaveChangesAsync();
        var svc = NewService(db);

        var cart = await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed1.SupplyId, null, TotalCycles: 1));
        var item1Id = cart.Items[0].CartItemId;
        cart = await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed2.SupplyId, null, TotalCycles: 2));
        var item2Id = cart.Items.First(i => i.SeedVarietyId == seed2.SupplyId).CartItemId;

        // Chỉ tick khay 2 (item2Id)
        var order = await svc.CheckoutAsync(customer.UserId, new CheckoutCartRequest(
            IsRiskAccepted: true,
            ShippingAddress: "Test Addr",
            ShippingLatitude: 10.80,
            ShippingLongitude: 106.70,
            CartItemIds: [item2Id]));

        // Kiểm tra đơn hàng chỉ có khay 2: 1 khay x 2 chu kỳ x 30 = 60
        Assert.Single(order.Rentals);
        Assert.Equal(60, order.TotalAmount);

        // Kiểm tra giỏ hàng: khay 1 vẫn còn nguyên trong giỏ, khay 2 đã bị xóa
        var remainingCart = await svc.GetAsync(customer.UserId);
        Assert.Equal(1, remainingCart.ItemCount);
        Assert.Equal(item1Id, remainingCart.Items[0].CartItemId);
        Assert.Equal(seed1.SupplyId, remainingCart.Items[0].SeedVarietyId);
    }

    [Fact]
    public async Task Checkout_with_invalid_cart_item_id_throws_400()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed();
        var (zone, trays) = Trays(2);
        db.AddRange(customer, seed, zone);
        db.AddRange(trays.Cast<object>().ToArray());
        await db.SaveChangesAsync();
        var svc = NewService(db);
        await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));

        var err = await Assert.ThrowsAsync<AppException>(() => svc.CheckoutAsync(customer.UserId, new CheckoutCartRequest(
            ShippingAddress: "Test Addr",
            ShippingLatitude: 10.80,
            ShippingLongitude: 106.70,
            CartItemIds: [9999])));
        Assert.Equal(400, err.StatusCode);
    }
}
