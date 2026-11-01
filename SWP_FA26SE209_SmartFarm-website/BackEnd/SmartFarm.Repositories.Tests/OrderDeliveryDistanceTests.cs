using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;
using Xunit;

namespace SmartFarm.Repositories.Tests;

// Kiểm thử tính khoảng cách giao hàng khi tạo đơn seed-packet bằng OSRM (qua IRoutingService giả lập).
public class OrderDeliveryDistanceTests
{
    private static AppDbContext Context() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    // Stub IRoutingService: trả khoảng cách cố định, ghi lại có được gọi và với toạ độ nào không.
    private sealed class FakeRoutingService(double? distanceKm) : IRoutingService
    {
        public int CallCount { get; private set; }
        public (double fromLat, double fromLng, double toLat, double toLng)? LastCall { get; private set; }

        public Task<double?> GetDistanceKmAsync(double fromLat, double fromLng, double toLat, double toLng,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            LastCall = (fromLat, fromLng, toLat, toLng);
            return Task.FromResult(distanceKm);
        }
    }

    private static User Customer() => new()
    { Email = "geo@test.local", FullName = "Geo Customer", PasswordHash = "x", Role = RoleNames.Customer };

    private static Supply Seed(int stock = 10) => new()
    {
        SupplyName = "Lettuce", SupplyType = SupplyType.Seed, HarvestDays = 30,
        Unit = "packet", UnitPrice = 10, RentalPrice = 20, QuantityInStock = stock
    };

    [Fact]
    public async Task Computes_and_stores_distance_when_coordinates_and_farm_configured()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed();
        db.AddRange(customer, seed);
        // seed.UnitPrice=10, Quantity=2 -> subtotal 20. Không tính phí ship -> TotalAmount = subtotal.
        db.Add(new FarmConfig { FarmLatitude = 10.762622, FarmLongitude = 106.660172, MaxDeliveryRadiusKm = 0 });
        await db.SaveChangesAsync();
        var routing = new FakeRoutingService(5.4);
        var service = new OrderService(db, routing: routing);

        var created = await service.CreateSeedPacketAsync(customer.UserId,
            new CreateSeedPacketOrderRequest(seed.SupplyId, 2, "99 Customer Street", 10.80, 106.70));

        Assert.Equal(1, routing.CallCount);
        Assert.Equal((10.762622, 106.660172, 10.80, 106.70), routing.LastCall);
        Assert.Equal(5.4, created.DeliveryDistanceKm);
        Assert.Equal(10.80, created.ShippingLatitude);
        Assert.Equal(106.70, created.ShippingLongitude);
        Assert.Equal(20m, created.TotalAmount);    // chỉ subtotal, không phí ship
        var saved = await db.Orders.FindAsync(created.OrderId);
        Assert.Equal(5.4, saved!.DeliveryDistanceKm);
    }

    [Fact]
    public async Task Rejects_order_when_customer_sends_no_coordinates()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(stock: 10);
        db.AddRange(customer, seed);
        db.Add(new FarmConfig { FarmLatitude = 10.76, FarmLongitude = 106.66 });
        await db.SaveChangesAsync();
        var routing = new FakeRoutingService(9.9);
        var service = new OrderService(db, routing: routing);

        // Thiếu toạ độ -> bắt buộc -> chặn 400, không tạo đơn, không trừ kho, không gọi OSRM.
        var error = await Assert.ThrowsAsync<AppException>(() => service.CreateSeedPacketAsync(customer.UserId,
            new CreateSeedPacketOrderRequest(seed.SupplyId, 1, "No coordinates here")));

        Assert.Equal(400, error.StatusCode);
        Assert.Equal(0, routing.CallCount);
        Assert.Empty(await db.Orders.ToListAsync());
        Assert.Equal(10, (await db.Supplies.FindAsync(seed.SupplyId))!.QuantityInStock);
    }

    [Fact]
    public async Task Skips_routing_when_farm_has_no_coordinates()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed();
        db.AddRange(customer, seed);
        db.Add(new FarmConfig { FarmLatitude = null, FarmLongitude = null });
        await db.SaveChangesAsync();
        var routing = new FakeRoutingService(9.9);
        var service = new OrderService(db, routing: routing);

        var created = await service.CreateSeedPacketAsync(customer.UserId,
            new CreateSeedPacketOrderRequest(seed.SupplyId, 1, "Somewhere", 10.80, 106.70));

        Assert.Equal(0, routing.CallCount);
        Assert.Null(created.DeliveryDistanceKm);
    }

    [Fact]
    public async Task Rejects_order_when_out_of_range_and_customer_did_not_accept()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(stock: 10);
        db.AddRange(customer, seed);
        db.Add(new FarmConfig { FarmLatitude = 10.76, FarmLongitude = 106.66, MaxDeliveryRadiusKm = 10 });
        await db.SaveChangesAsync();
        var routing = new FakeRoutingService(25.0); // vượt bán kính 10km
        var service = new OrderService(db, routing: routing);

        // Ngoài bán kính + KHÔNG tick đồng ý (IsAccepted=false mặc định) -> chặn 422.
        var error = await Assert.ThrowsAsync<AppException>(() => service.CreateSeedPacketAsync(customer.UserId,
            new CreateSeedPacketOrderRequest(seed.SupplyId, 2, "Far away", 11.50, 107.20)));

        Assert.Equal(422, error.StatusCode);
        // Đơn bị chặn trước transaction -> không trừ kho, không tạo đơn.
        Assert.Equal(10, (await db.Supplies.FindAsync(seed.SupplyId))!.QuantityInStock);
        Assert.Empty(await db.Orders.ToListAsync());
    }

    [Fact]
    public async Task Creates_order_when_out_of_range_and_customer_accepted()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(stock: 10);
        db.AddRange(customer, seed);
        db.Add(new FarmConfig { FarmLatitude = 10.76, FarmLongitude = 106.66, MaxDeliveryRadiusKm = 10 });
        await db.SaveChangesAsync();
        var routing = new FakeRoutingService(25.0); // vượt bán kính 10km
        var service = new OrderService(db, routing: routing);

        // Ngoài bán kính + CÓ tick đồng ý (IsAccepted=true) -> tạo đơn, lưu IsAccepted=true.
        var created = await service.CreateSeedPacketAsync(customer.UserId,
            new CreateSeedPacketOrderRequest(seed.SupplyId, 2, "Far away", 11.50, 107.20, IsAccepted: true));

        Assert.True(created.IsAccepted);
        Assert.Equal(25.0, created.DeliveryDistanceKm);
        var saved = await db.Orders.FindAsync(created.OrderId);
        Assert.True(saved!.IsAccepted);
        Assert.Equal(8, (await db.Supplies.FindAsync(seed.SupplyId))!.QuantityInStock);
    }

    [Fact]
    public async Task Within_range_creates_order_with_is_accepted_false_even_if_ticked()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(stock: 10);
        db.AddRange(customer, seed);
        db.Add(new FarmConfig { FarmLatitude = 10.76, FarmLongitude = 106.66, MaxDeliveryRadiusKm = 10 });
        await db.SaveChangesAsync();
        var routing = new FakeRoutingService(4.0); // trong bán kính
        var service = new OrderService(db, routing: routing);

        // Trong bán kính: IsAccepted của đơn luôn false dù khách lỡ tick.
        var created = await service.CreateSeedPacketAsync(customer.UserId,
            new CreateSeedPacketOrderRequest(seed.SupplyId, 1, "Near", 10.80, 106.70, IsAccepted: true));

        Assert.False(created.IsAccepted);
        var saved = await db.Orders.FindAsync(created.OrderId);
        Assert.False(saved!.IsAccepted);
    }

    [Fact]
    public async Task Stores_null_distance_when_routing_returns_null()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed();
        db.AddRange(customer, seed);
        db.Add(new FarmConfig { FarmLatitude = 10.76, FarmLongitude = 106.66, MaxDeliveryRadiusKm = 10 });
        await db.SaveChangesAsync();
        var routing = new FakeRoutingService(null); // OSRM không trả được tuyến
        var service = new OrderService(db, routing: routing);

        var created = await service.CreateSeedPacketAsync(customer.UserId,
            new CreateSeedPacketOrderRequest(seed.SupplyId, 1, "Unknown route", 10.80, 106.70));

        Assert.Equal(1, routing.CallCount);
        Assert.Null(created.DeliveryDistanceKm);
        // Đơn vẫn tạo thành công (OSRM null không chặn), trừ 1 đơn vị kho: 10 -> 9.
        Assert.Equal(9, (await db.Supplies.FindAsync(seed.SupplyId))!.QuantityInStock);
    }

    private sealed class FakeHttpMessageHandler(string content, System.Net.HttpStatusCode statusCode) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var response = new HttpResponseMessage(statusCode)
            {
                Content = new StringContent(content, System.Text.Encoding.UTF8, "application/json")
            };
            return Task.FromResult(response);
        }
    }

    [Fact]
    public async Task OsrmRoutingService_returns_null_when_disabled()
    {
        var options = new OsrmOptions { Enabled = false, BaseUrl = "http://localhost:5001" };
        var service = new OsrmRoutingService(new HttpClient(), options);
        var result = await service.GetDistanceKmAsync(10.76, 106.66, 10.80, 106.70);
        Assert.Null(result);
    }

    [Fact]
    public async Task OsrmRoutingService_parses_response_correctly()
    {
        var json = "{\"code\":\"Ok\",\"routes\":[{\"distance\":5886.8,\"duration\":420.7}]}";
        var handler = new FakeHttpMessageHandler(json, System.Net.HttpStatusCode.OK);
        var client = new HttpClient(handler);
        var options = new OsrmOptions { Enabled = true, BaseUrl = "http://localhost:5001" };
        var service = new OsrmRoutingService(client, options);

        var result = await service.GetDistanceKmAsync(10.762622, 106.660172, 10.780000, 106.700000);
        Assert.NotNull(result);
        Assert.Equal(5.887, result.Value);
    }
}
