using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;
using Xunit;

namespace SmartFarm.Repositories.Tests;

// Kiểm thử khoảng cách (OSRM) + flow chấp nhận giao ngoài bán kính khi checkout giỏ thuê khay.
// Không tính phí ship (đã bỏ) — chỉ đo khoảng cách để chặn/chấp nhận theo bán kính.
public class CartCheckoutDeliveryTests
{
    private static AppDbContext Context() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private sealed class FakeRoutingService(double? distanceKm) : IRoutingService
    {
        public int CallCount { get; private set; }
        public Task<double?> GetDistanceKmAsync(double fromLat, double fromLng, double toLat, double toLng,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult(distanceKm);
        }
    }

    private static User Customer() => new()
    { Email = "dist@test.local", FullName = "Dist Customer", PasswordHash = "x", Role = RoleNames.Customer };

    private static Supply Seed(decimal rentalPrice = 100) => new()
    {
        SupplyName = "Rau muong", SupplyType = SupplyType.Seed, HarvestDays = 10, Unit = "goi",
        UnitPrice = 10, RentalPrice = rentalPrice, QuantityInStock = 100, IsActive = true
    };

    private static (FarmZone zone, SoilTray[] trays) Trays(int count)
    {
        var zone = new FarmZone { ZoneName = "Zone " + Guid.NewGuid().ToString("N")[..6], TotalCapacity = count, IsActive = true };
        var rack = new FarmRack { Zone = zone, RackCode = "R" + Guid.NewGuid().ToString("N")[..6], TotalTiers = 1, MaxTraysPerTier = count };
        var trays = Enumerable.Range(1, count).Select(_ => new SoilTray
        { Rack = rack, TrayCode = "T" + Guid.NewGuid().ToString("N")[..6], TierIndex = 1, CurrentStatus = TrayStatus.Available }).ToArray();
        return (zone, trays);
    }

    [Fact]
    public async Task Checkout_within_range_stores_distance_and_total_without_shipping_fee()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(rentalPrice: 100);
        var (zone, trays) = Trays(1);
        db.Add(new FarmConfig
        {
            FarmLatitude = 10.76, FarmLongitude = 106.66, MaxDeliveryRadiusKm = 10,
            DiscountTrayThreshold = 99, DiscountCycleThreshold = 99, LoyalOrderThreshold = 99
        });
        db.AddRange(customer, seed, zone);
        db.AddRange(trays.Cast<object>().ToArray());
        await db.SaveChangesAsync();
        var routing = new FakeRoutingService(4.0);
        var svc = new CartService(db, routing: routing);
        await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));

        var order = await svc.CheckoutAsync(customer.UserId,
            new CheckoutCartRequest(IsRiskAccepted: true, ShippingAddress: "12 Duong ABC",
                ShippingLatitude: 10.80, ShippingLongitude: 106.70));

        Assert.Equal(1, routing.CallCount);
        var dbOrder = await db.Orders.FirstAsync(o => o.OrderId == order.OrderId);
        Assert.Equal(100m, dbOrder.Subtotal);
        Assert.Equal(100m, dbOrder.TotalAmount);   // không cộng phí ship
        Assert.Equal(4.0, dbOrder.DeliveryDistanceKm);
        Assert.Equal("12 Duong ABC", dbOrder.ShippingAddress);
        Assert.False(dbOrder.IsAccepted);
    }

    [Fact]
    public async Task Checkout_without_coordinates_is_rejected_and_no_order_created()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(rentalPrice: 100);
        var (zone, trays) = Trays(1);
        db.Add(new FarmConfig { FarmLatitude = 10.76, FarmLongitude = 106.66, DiscountTrayThreshold = 99, DiscountCycleThreshold = 99, LoyalOrderThreshold = 99 });
        db.AddRange(customer, seed, zone);
        db.AddRange(trays.Cast<object>().ToArray());
        await db.SaveChangesAsync();
        var routing = new FakeRoutingService(4.0);
        var svc = new CartService(db, routing: routing);
        await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));

        // Không gửi toạ độ -> bắt buộc phải có -> chặn 400, không tạo đơn, không gọi OSRM.
        var error = await Assert.ThrowsAsync<AppException>(() => svc.CheckoutAsync(customer.UserId,
            new CheckoutCartRequest(IsRiskAccepted: true)));

        Assert.Equal(400, error.StatusCode);
        Assert.Equal(0, routing.CallCount);
        Assert.Empty(await db.Orders.ToListAsync());
        Assert.All(await db.SoilTrays.ToListAsync(), t => Assert.Equal(TrayStatus.Available, t.CurrentStatus));
    }

    [Fact]
    public async Task Checkout_rejected_when_out_of_range_and_not_accepted()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(rentalPrice: 100);
        var (zone, trays) = Trays(1);
        db.Add(new FarmConfig { FarmLatitude = 10.76, FarmLongitude = 106.66, MaxDeliveryRadiusKm = 10 });
        db.AddRange(customer, seed, zone);
        db.AddRange(trays.Cast<object>().ToArray());
        await db.SaveChangesAsync();
        var routing = new FakeRoutingService(30.0); // vượt bán kính 10km
        var svc = new CartService(db, routing: routing);
        await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));

        var error = await Assert.ThrowsAsync<AppException>(() => svc.CheckoutAsync(customer.UserId,
            new CheckoutCartRequest(IsRiskAccepted: true, ShippingAddress: "Xa qua",
                ShippingLatitude: 12.0, ShippingLongitude: 108.0)));

        Assert.Equal(422, error.StatusCode);
        Assert.Empty(await db.Orders.ToListAsync());
        Assert.All(await db.SoilTrays.ToListAsync(), t => Assert.Equal(TrayStatus.Available, t.CurrentStatus));
        Assert.NotEmpty(await db.CartItems.ToListAsync());
    }

    [Fact]
    public async Task Checkout_out_of_range_with_acceptance_creates_order_and_sets_is_accepted()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(rentalPrice: 100);
        var (zone, trays) = Trays(1);
        db.Add(new FarmConfig { FarmLatitude = 10.76, FarmLongitude = 106.66, MaxDeliveryRadiusKm = 10,
            DiscountTrayThreshold = 99, DiscountCycleThreshold = 99, LoyalOrderThreshold = 99 });
        db.AddRange(customer, seed, zone);
        db.AddRange(trays.Cast<object>().ToArray());
        await db.SaveChangesAsync();
        var routing = new FakeRoutingService(30.0); // vượt bán kính 10km
        var svc = new CartService(db, routing: routing);
        await svc.AddItemAsync(customer.UserId, new AddCartItemRequest(seed.SupplyId, null));

        // Ngoài bán kính + CÓ tick -> tạo đơn, khóa khay, IsAccepted=true. Tổng KHÔNG cộng phí ship.
        var order = await svc.CheckoutAsync(customer.UserId,
            new CheckoutCartRequest(IsRiskAccepted: true, ShippingAddress: "Xa qua",
                ShippingLatitude: 12.0, ShippingLongitude: 108.0, IsAccepted: true));

        var dbOrder = await db.Orders.FirstAsync(o => o.OrderId == order.OrderId);
        Assert.True(dbOrder.IsAccepted);
        Assert.True(order.IsAccepted);
        Assert.Equal(30.0, dbOrder.DeliveryDistanceKm);
        Assert.Equal(100m, dbOrder.TotalAmount); // không phí ship
        Assert.All(await db.SoilTrays.ToListAsync(), t => Assert.Equal(TrayStatus.Rented, t.CurrentStatus));
    }
}
