using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;
using Xunit;

namespace SmartFarm.Repositories.Tests;

public class AuditFixesTests
{
    private static AppDbContext Context() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static readonly SePayOptions Options = new()
    {
        WebhookSecret = "audit-secret",
        BankName = "Test Bank",
        BankAccountNumber = "123456",
        AccountName = "SMART FARM"
    };

    private sealed class FakeRoutingService(double? distanceKm) : IRoutingService
    {
        public Task<double?> GetDistanceKmAsync(double fromLat, double fromLng, double toLat, double toLng,
            CancellationToken cancellationToken = default) => Task.FromResult(distanceKm);
    }

    private static User Customer(string email = "customer@audit.local") => new()
    {
        Email = email,
        FullName = "Audit Customer",
        PasswordHash = "x",
        Role = RoleNames.Customer
    };

    private static Supply Seed(decimal rentalPrice = 100) => new()
    {
        SupplyName = "Cai Ngot",
        SupplyType = SupplyType.Seed,
        HarvestDays = 20,
        Unit = "goi",
        UnitPrice = 20,
        RentalPrice = rentalPrice,
        QuantityInStock = 50,
        IsActive = true
    };

    private static (FarmZone zone, SoilTray tray) SingleTray()
    {
        var zone = new FarmZone { ZoneName = "Zone A", TotalCapacity = 10, IsActive = true };
        var rack = new FarmRack { Zone = zone, RackCode = "R01", TotalTiers = 1, MaxTraysPerTier = 10 };
        var tray = new SoilTray { Rack = rack, TrayCode = "T01", TierIndex = 1, CurrentStatus = TrayStatus.Available };
        return (zone, tray);
    }

    // =========================================================================
    // 1. Direct Tray Rental (POST /rentals) OSRM & Out-of-Range validation
    // =========================================================================

    [Fact]
    public async Task Rental_with_missing_coordinates_throws_400()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed();
        var (zone, tray) = SingleTray();
        db.AddRange(customer, seed, zone, tray);
        await db.SaveChangesAsync();

        var routing = new FakeRoutingService(5.0);
        var pricing = new DeliveryPricingService(db, routing);
        var orderService = new OrderService(db);
        var rentalService = new RentalService(new UnitOfWork(db), orderService, pricing);

        var err = await Assert.ThrowsAsync<AppException>(() => rentalService.CreateAsync(customer.UserId,
            new CreateTrayRentalRequest(seed.SupplyId, 1, ShippingLatitude: null, ShippingLongitude: null)));

        Assert.Equal(400, err.StatusCode);
    }

    [Fact]
    public async Task Rental_out_of_range_without_acceptance_throws_422()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed();
        var (zone, tray) = SingleTray();
        var config = new FarmConfig { FarmLatitude = 10.70, FarmLongitude = 106.60, MaxDeliveryRadiusKm = 10 };
        db.AddRange(customer, seed, zone, tray, config);
        await db.SaveChangesAsync();

        var routing = new FakeRoutingService(18.5); // 18.5 km > 10 km
        var pricing = new DeliveryPricingService(db, routing);
        var orderService = new OrderService(db);
        var rentalService = new RentalService(new UnitOfWork(db), orderService, pricing);

        var err = await Assert.ThrowsAsync<AppException>(() => rentalService.CreateAsync(customer.UserId,
            new CreateTrayRentalRequest(seed.SupplyId, 1, ShippingAddress: "Xa", ShippingLatitude: 10.90, ShippingLongitude: 106.80, IsAccepted: false)));

        Assert.Equal(422, err.StatusCode);
    }

    [Fact]
    public async Task Rental_out_of_range_with_acceptance_succeeds_and_saves_metadata()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed();
        var (zone, tray) = SingleTray();
        var config = new FarmConfig { FarmLatitude = 10.70, FarmLongitude = 106.60, MaxDeliveryRadiusKm = 10 };
        db.AddRange(customer, seed, zone, tray, config);
        await db.SaveChangesAsync();

        var routing = new FakeRoutingService(18.5);
        var pricing = new DeliveryPricingService(db, routing);
        var orderService = new OrderService(db);
        var rentalService = new RentalService(new UnitOfWork(db), orderService, pricing);

        var res = await rentalService.CreateAsync(customer.UserId,
            new CreateTrayRentalRequest(seed.SupplyId, 1, ShippingAddress: "Xa", ShippingLatitude: 10.90, ShippingLongitude: 106.80, IsAccepted: true));

        Assert.True(res.IsAccepted);
        Assert.Equal(18.5, res.DeliveryDistanceKm);
        Assert.Equal("Xa", res.ShippingAddress);

        var saved = await db.Orders.FindAsync(res.OrderId);
        Assert.NotNull(saved);
        Assert.True(saved.IsAccepted);
        Assert.Equal(18.5, saved.DeliveryDistanceKm);
        Assert.Equal(10.90, saved.ShippingLatitude);
        Assert.Equal(106.80, saved.ShippingLongitude);
    }

    // =========================================================================
    // 2. Payment Security & Retries
    // =========================================================================

    [Fact]
    public async Task Webhook_without_prior_payment_record_creates_payment_and_confirms_order()
    {
        await using var db = Context();
        var customer = Customer();
        var order = new Order
        {
            Customer = customer,
            OrderCode = "SP2026102401010101",
            OrderType = OrderType.SeedPacket,
            OrderStatus = OrderStatus.AwaitingPayment,
            TotalAmount = 250,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30)
        };
        db.AddRange(customer, order);
        await db.SaveChangesAsync();

        var service = new PaymentService(db, Options);
        var raw = $$"""{"id": 9001, "gateway": "VCB", "transactionDate": "2026-10-24 10:00:00", "accountNumber": "123456", "code": "{{order.OrderCode}}", "content": "{{order.OrderCode}}", "transferType": "in", "transferAmount": 250, "referenceCode": "REF9001"}""";
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var sig = Sign(raw, timestamp, Options.WebhookSecret);

        var result = await service.HandleWebhookAsync(raw, sig, timestamp);

        Assert.Equal(PaymentExceptionTypes.None, result.Result);
        var savedOrder = await db.Orders.FindAsync(order.OrderId);
        Assert.Equal(OrderStatus.Confirmed, savedOrder!.OrderStatus);

        var savedPayment = await db.Payments.FirstOrDefaultAsync(p => p.OrderId == order.OrderId);
        Assert.NotNull(savedPayment);
        Assert.Equal(PaymentStatuses.Success, savedPayment.PaymentStatus);
        Assert.Equal(250, savedPayment.AmountPaid);
    }

    [Fact]
    public async Task Webhook_with_overpaid_amount_marks_success_and_confirms_order()
    {
        await using var db = Context();
        var customer = Customer();
        var order = new Order
        {
            Customer = customer,
            OrderCode = "SP2026102402020202",
            OrderType = OrderType.SeedPacket,
            OrderStatus = OrderStatus.AwaitingPayment,
            TotalAmount = 200,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30)
        };
        db.AddRange(customer, order);
        await db.SaveChangesAsync();

        var service = new PaymentService(db, Options);
        await service.CreateAsync(customer.UserId, order.OrderId);

        var raw = $$"""{"id": 9002, "gateway": "VCB", "transactionDate": "2026-10-24 10:00:00", "accountNumber": "123456", "code": "{{order.OrderCode}}", "content": "{{order.OrderCode}}", "transferType": "in", "transferAmount": 250, "referenceCode": "REF9002"}""";
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var sig = Sign(raw, timestamp, Options.WebhookSecret);

        var result = await service.HandleWebhookAsync(raw, sig, timestamp);

        Assert.Equal(PaymentExceptionTypes.Overpaid, result.Result);
        var savedOrder = await db.Orders.FindAsync(order.OrderId);
        Assert.Equal(OrderStatus.Confirmed, savedOrder!.OrderStatus);

        var savedPayment = await db.Payments.FirstOrDefaultAsync(p => p.OrderId == order.OrderId);
        Assert.NotNull(savedPayment);
        Assert.Equal(PaymentStatuses.Success, savedPayment.PaymentStatus);
        Assert.Equal(PaymentExceptionTypes.Overpaid, savedPayment.ExceptionType);
    }

    [Fact]
    public async Task Payment_retry_resets_failed_payment_to_pending()
    {
        await using var db = Context();
        var customer = Customer();
        var order = new Order
        {
            Customer = customer,
            OrderCode = "SP2026102403030303",
            OrderType = OrderType.SeedPacket,
            OrderStatus = OrderStatus.AwaitingPayment,
            TotalAmount = 300,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30)
        };
        var failedPayment = new Payment
        {
            Order = order,
            PaymentStatus = PaymentStatuses.Failed,
            ExceptionType = PaymentExceptionTypes.Underpaid,
            AmountPaid = 100
        };
        db.AddRange(customer, order, failedPayment);
        await db.SaveChangesAsync();

        var service = new PaymentService(db, Options);
        var instructions = await service.CreateAsync(customer.UserId, order.OrderId);

        Assert.Equal(PaymentStatuses.Pending, instructions.Status);

        var reloaded = await db.Payments.FindAsync(failedPayment.PaymentId);
        Assert.Equal(PaymentStatuses.Pending, reloaded!.PaymentStatus);
        Assert.Equal(PaymentExceptionTypes.None, reloaded.ExceptionType);
    }

    [Theory]
    [InlineData(OrderStatus.Preparing)]
    [InlineData(OrderStatus.Delivering)]
    [InlineData(OrderStatus.Completed)]
    public async Task Webhook_does_not_revert_preparing_delivering_or_completed_order_to_confirmed(string advancedStatus)
    {
        await using var db = Context();
        var customer = Customer();
        var order = new Order
        {
            Customer = customer,
            OrderCode = "SP2026102404040404",
            OrderType = OrderType.SeedPacket,
            OrderStatus = advancedStatus,
            TotalAmount = 200,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30)
        };
        var existingPayment = new Payment
        {
            Order = order,
            PaymentStatus = PaymentStatuses.Success,
            AmountPaid = 200,
            TransactionCode = "REF_OLD_SUCCESS"
        };
        db.AddRange(customer, order, existingPayment);
        await db.SaveChangesAsync();

        var service = new PaymentService(db, Options);
        var raw = $$"""{"id": 9003, "gateway": "VCB", "transactionDate": "2026-10-24 10:00:00", "accountNumber": "123456", "code": "{{order.OrderCode}}", "content": "{{order.OrderCode}}", "transferType": "in", "transferAmount": 200, "referenceCode": "REF9003"}""";
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var sig = Sign(raw, timestamp, Options.WebhookSecret);

        var result = await service.HandleWebhookAsync(raw, sig, timestamp);

        Assert.Equal(PaymentExceptionTypes.OrderStateMismatch, result.Result);

        // Trạng thái đơn PHẢI giữ nguyên, KHÔNG được bị lùi về CONFIRMED
        var reloadedOrder = await db.Orders.FindAsync(order.OrderId);
        Assert.Equal(advancedStatus, reloadedOrder!.OrderStatus);

        // Bản ghi PaymentWebhookEvent vẫn lưu và có PaymentId hợp lệ (không phải 0)
        var webhookEvent = await db.PaymentWebhookEvents.SingleAsync(e => e.SePayTransactionId == 9003);
        Assert.Equal(existingPayment.PaymentId, webhookEvent.PaymentId);
        Assert.True(webhookEvent.PaymentId > 0);
    }

    [Fact]
    public async Task Webhook_before_payment_creation_generates_valid_payment_id_and_no_zero_foreign_key()
    {
        await using var db = Context();
        var customer = Customer();
        var order = new Order
        {
            Customer = customer,
            OrderCode = "SP2026102405050505",
            OrderType = OrderType.SeedPacket,
            OrderStatus = OrderStatus.AwaitingPayment,
            TotalAmount = 150,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30)
        };
        db.AddRange(customer, order);
        await db.SaveChangesAsync();

        // Không tạo payment trước -> db.Payments rỗng
        Assert.Empty(await db.Payments.ToListAsync());

        var service = new PaymentService(db, Options);
        var raw = $$"""{"id": 9004, "gateway": "VCB", "transactionDate": "2026-10-24 10:00:00", "accountNumber": "123456", "code": "{{order.OrderCode}}", "content": "{{order.OrderCode}}", "transferType": "in", "transferAmount": 150, "referenceCode": "REF9004"}""";
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var sig = Sign(raw, timestamp, Options.WebhookSecret);

        var result = await service.HandleWebhookAsync(raw, sig, timestamp);

        Assert.Equal(PaymentExceptionTypes.None, result.Result);

        var createdPayment = await db.Payments.SingleAsync();
        Assert.True(createdPayment.PaymentId > 0);
        Assert.Equal(PaymentStatuses.Success, createdPayment.PaymentStatus);

        var webhookEvent = await db.PaymentWebhookEvents.SingleAsync(e => e.SePayTransactionId == 9004);
        Assert.NotNull(webhookEvent.PaymentId);
        Assert.Equal(createdPayment.PaymentId, webhookEvent.PaymentId);
        Assert.True(webhookEvent.PaymentId > 0); // Không bao giờ là 0
    }

    // =========================================================================
    // 3. Delivery Address Sync & Multi-Cycle Scheduling
    // =========================================================================

    [Fact]
    public async Task Delivery_reschedule_with_coordinates_updates_distance_and_syncs_to_order()
    {
        await using var db = Context();
        var customer = Customer();
        var order = new Order
        {
            Customer = customer,
            OrderCode = "DEL-SYNC-01",
            OrderType = OrderType.SeedPacket,
            OrderStatus = OrderStatus.Confirmed,
            ExpiresAt = DateTime.UtcNow.AddDays(1)
        };
        var config = new FarmConfig { FarmLatitude = 10.70, FarmLongitude = 106.60, MaxDeliveryRadiusKm = 20 };
        db.AddRange(customer, order, config);
        await db.SaveChangesAsync();

        var routing = new FakeRoutingService(6.2);
        var pricing = new DeliveryPricingService(db, routing);
        var service = new DeliveryService(db, deliveryPricing: pricing);

        var scheduled = await service.ScheduleCustomerAsync(customer.UserId, order.OrderId, new ScheduleDeliveryRequest(
            RecipientName: "Nguyen Van A",
            RecipientPhone: "0909123456",
            ShippingAddress: "45 Le Duan, Q1",
            ScheduledDeliveryAt: DateTime.UtcNow.AddDays(1),
            Notes: "Giao gio hanh chinh",
            ShippingLatitude: 10.78,
            ShippingLongitude: 106.70));

        Assert.Equal("45 Le Duan, Q1", scheduled.ShippingAddress);

        var reloadedOrder = await db.Orders.FindAsync(order.OrderId);
        Assert.Equal("45 Le Duan, Q1", reloadedOrder!.ShippingAddress);
        Assert.Equal(10.78, reloadedOrder.ShippingLatitude);
        Assert.Equal(106.70, reloadedOrder.ShippingLongitude);
        Assert.Equal(6.2, reloadedOrder.DeliveryDistanceKm);
        Assert.False(reloadedOrder.IsAccepted);
    }

    [Fact]
    public async Task Delivery_reschedule_out_of_range_without_acceptance_throws_422()
    {
        await using var db = Context();
        var customer = Customer();
        var order = new Order
        {
            Customer = customer,
            OrderCode = "DEL-SYNC-02",
            OrderType = OrderType.SeedPacket,
            OrderStatus = OrderStatus.Confirmed,
            ExpiresAt = DateTime.UtcNow.AddDays(1)
        };
        var config = new FarmConfig { FarmLatitude = 10.70, FarmLongitude = 106.60, MaxDeliveryRadiusKm = 10 };
        db.AddRange(customer, order, config);
        await db.SaveChangesAsync();

        var routing = new FakeRoutingService(25.0); // 25 km > 10 km
        var pricing = new DeliveryPricingService(db, routing);
        var service = new DeliveryService(db, deliveryPricing: pricing);

        var err = await Assert.ThrowsAsync<AppException>(() => service.ScheduleCustomerAsync(customer.UserId, order.OrderId,
            new ScheduleDeliveryRequest(
                RecipientName: "Nguyen Van B",
                RecipientPhone: "0909123456",
                ShippingAddress: "Binh Duong",
                ScheduledDeliveryAt: DateTime.UtcNow.AddDays(1),
                Notes: null,
                ShippingLatitude: 11.0,
                ShippingLongitude: 106.7,
                IsAccepted: false)));

        Assert.Equal(422, err.StatusCode);
    }

    [Fact]
    public async Task Multi_cycle_delivery_scheduling_targets_correct_cycle_or_delivery_id()
    {
        await using var db = Context();
        var customer = Customer();
        var order = new Order
        {
            Customer = customer,
            OrderCode = "DEL-MULTI-01",
            OrderType = OrderType.TrayRental,
            OrderStatus = OrderStatus.Confirmed,
            ExpiresAt = DateTime.UtcNow.AddDays(10)
        };
        var deliveryCycle1 = new Delivery
        {
            Order = order,
            CycleNumber = 1,
            RecipientName = "Old Receiver",
            RecipientPhone = "0901111111",
            ShippingAddress = "Old Address",
            DeliveryStatus = DeliveryStatuses.Delivered,
            ScheduledDeliveryAt = DateTime.UtcNow.AddDays(-2)
        };
        var deliveryCycle2 = new Delivery
        {
            Order = order,
            CycleNumber = 2,
            RecipientName = "Cycle 2 Receiver",
            RecipientPhone = "0902222222",
            ShippingAddress = "Old Address",
            DeliveryStatus = DeliveryStatuses.Pending
        };
        var (zone, tray) = SingleTray();
        var seed = Seed();
        var rental = new TrayRental
        {
            Customer = customer,
            Order = order,
            SoilTray = tray,
            Supply = seed,
            CropStatus = CropStatus.Harvested,
            ActualHarvestDate = DateTime.UtcNow.AddDays(2),
            ExpectedHarvestDate = DateTime.UtcNow.AddDays(2),
            TotalCycles = 2,
            CurrentCycle = 2
        };
        order.TrayRentals.Add(rental);
        db.AddRange(customer, zone, tray, seed, order, deliveryCycle1, deliveryCycle2);
        await db.SaveChangesAsync();

        var service = new DeliveryService(db);

        // Schedule targeting Cycle 2 specifically by CycleNumber
        var result = await service.ScheduleCustomerAsync(customer.UserId, order.OrderId, new ScheduleDeliveryRequest(
            RecipientName: "New Cycle 2 Receiver",
            RecipientPhone: "0909999999",
            ShippingAddress: "Updated Address",
            ScheduledDeliveryAt: DateTime.UtcNow.AddDays(3),
            Notes: null,
            CycleNumber: 2));

        Assert.Equal(deliveryCycle2.DeliveryId, result.DeliveryId);
        Assert.Equal("New Cycle 2 Receiver", result.RecipientName);
        Assert.Equal("Updated Address", result.ShippingAddress);

        // Verify cycle 1 was untouched
        var reloaded1 = await db.Deliveries.FindAsync(deliveryCycle1.DeliveryId);
        Assert.Equal("Old Receiver", reloaded1!.RecipientName);
        Assert.Equal(DeliveryStatuses.Delivered, reloaded1.DeliveryStatus);
    }

    private static string Sign(string body, string timestamp, string secret)
    {
        var hash = System.Security.Cryptography.HMACSHA256.HashData(
            System.Text.Encoding.UTF8.GetBytes(secret),
            System.Text.Encoding.UTF8.GetBytes($"{timestamp}.{body}"));
        return "sha256=" + Convert.ToHexString(hash).ToLowerInvariant();
    }
}
