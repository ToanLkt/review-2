using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Repositories;
using SmartFarm.Services;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;
using Xunit;

namespace SmartFarm.Repositories.Tests;

public class PriorityTwoOrderServiceTests
{
    private static AppDbContext Context()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task Seed_packet_order_reserves_stock_once()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(stock: 10);
        db.AddRange(customer, seed);
        await db.SaveChangesAsync();
        var service = new OrderService(db);

        var created = await service.CreateSeedPacketAsync(customer.UserId,
            new CreateSeedPacketOrderRequest(seed.SupplyId, 3, "123 Farm Road", 10.80, 106.70));
        db.Payments.Add(new Payment
        {
            OrderId = created.OrderId,
            PaymentStatus = PaymentStatuses.Success,
            PaymentMethod = "BANK_TRANSFER",
            AmountPaid = created.TotalAmount,
            PaidAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        await service.TransitionAsync(created.OrderId, OrderStatus.Confirmed);
        await service.TransitionAsync(created.OrderId, OrderStatus.Confirmed);

        Assert.Equal(OrderType.SeedPacket, created.OrderType);
        Assert.Equal(7, (await db.Supplies.FindAsync(seed.SupplyId))!.QuantityInStock);
        Assert.Single(await db.OrderItems.Where(x => x.OrderId == created.OrderId).ToListAsync());
    }

    [Fact]
    public async Task Invalid_or_skipped_transition_is_rejected()
    {
        await using var db = Context();
        var customer = Customer();
        var order = new Order
        {
            Customer = customer,
            OrderCode = "TR-INVALID",
            OrderType = OrderType.TrayRental,
            OrderStatus = OrderStatus.AwaitingPayment,
            ExpiresAt = DateTime.UtcNow.AddMinutes(20)
        };
        db.Add(order);
        await db.SaveChangesAsync();
        var service = new OrderService(db);

        var error = await Assert.ThrowsAsync<AppException>(() =>
            service.TransitionAsync(order.OrderId, OrderStatus.Preparing));

        Assert.Equal(409, error.StatusCode);
        Assert.Equal(OrderStatus.AwaitingPayment, (await db.Orders.FindAsync(order.OrderId))!.OrderStatus);
    }

    [Fact]
    public async Task Valid_transition_chain_reaches_completed()
    {
        await using var db = Context();
        var customer = Customer();
        var order = new Order
        {
            Customer = customer, OrderCode = "TR-VALID", OrderType = OrderType.TrayRental,
            OrderStatus = OrderStatus.AwaitingPayment, ExpiresAt = DateTime.UtcNow.AddMinutes(20)
        };
        db.Add(order);
        await db.SaveChangesAsync();
        db.Payments.Add(new Payment
        {
            OrderId = order.OrderId,
            PaymentStatus = PaymentStatuses.Success,
            PaymentMethod = "BANK_TRANSFER",
            AmountPaid = 100,
            PaidAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        var service = new OrderService(db);

        foreach (var status in new[]
                 { OrderStatus.Confirmed, OrderStatus.Preparing, OrderStatus.Delivering, OrderStatus.Completed })
            Assert.Equal(status, (await service.TransitionAsync(order.OrderId, status)).Status);
    }

    [Fact]
    public async Task Expiring_seed_order_restores_inventory_only_once()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(stock: 6);
        var order = new Order
        {
            Customer = customer,
            OrderCode = "SP-EXPIRED",
            OrderType = OrderType.SeedPacket,
            OrderStatus = OrderStatus.AwaitingPayment,
            ExpiresAt = DateTime.UtcNow.AddMinutes(-1)
        };
        order.Items.Add(new OrderItem
        {
            Supply = seed, ItemType = OrderType.SeedPacket, Quantity = 4, UnitPrice = 10, Subtotal = 40
        });
        db.Add(order);
        await db.SaveChangesAsync();
        var service = new OrderService(db);

        Assert.Equal(1, await service.ExpireAwaitingPaymentAsync(DateTime.UtcNow));
        Assert.Equal(0, await service.ExpireAwaitingPaymentAsync(DateTime.UtcNow));

        Assert.Equal(10, (await db.Supplies.FindAsync(seed.SupplyId))!.QuantityInStock);
        Assert.Equal(OrderStatus.Expired, (await db.Orders.FindAsync(order.OrderId))!.OrderStatus);
    }

    [Fact]
    public async Task Expiring_rental_releases_reserved_tray_only_once()
    {
        await using var db = Context();
        var customer = Customer();
        var seed = Seed(stock: 10);
        var zone = new FarmZone { ZoneName = "Zone A", TotalCapacity = 1 };
        var rack = new FarmRack { Zone = zone, RackCode = "R1", TotalTiers = 1, MaxTraysPerTier = 1 };
        var tray = new SoilTray { Rack = rack, TrayCode = "T1", TierIndex = 1, CurrentStatus = TrayStatus.Rented };
        var order = new Order
        {
            Customer = customer,
            OrderCode = "TR-EXPIRED",
            OrderType = OrderType.TrayRental,
            OrderStatus = OrderStatus.AwaitingPayment,
            ExpiresAt = DateTime.UtcNow.AddMinutes(-1)
        };
        order.TrayRentals.Add(new TrayRental
        {
            Customer = customer, Supply = seed, SoilTray = tray,
            StartDate = DateTime.UtcNow, ExpectedHarvestDate = DateTime.UtcNow.AddDays(10)
        });
        db.Add(order);
        await db.SaveChangesAsync();
        var service = new OrderService(db);

        Assert.Equal(1, await service.ExpireAwaitingPaymentAsync(DateTime.UtcNow));
        Assert.Equal(0, await service.ExpireAwaitingPaymentAsync(DateTime.UtcNow));

        Assert.Equal(TrayStatus.Available, (await db.SoilTrays.FindAsync(tray.SoilTrayId))!.CurrentStatus);
    }

    [Fact]
    public async Task Customer_cannot_read_another_customers_order()
    {
        await using var db = Context();
        var owner = Customer("owner@test.local");
        var other = Customer("other@test.local");
        var order = new Order
        {
            Customer = owner, OrderCode = "SP-PRIVATE", OrderType = OrderType.SeedPacket,
            OrderStatus = OrderStatus.AwaitingPayment, ExpiresAt = DateTime.UtcNow.AddMinutes(20)
        };
        db.AddRange(owner, other, order);
        await db.SaveChangesAsync();
        var service = new OrderService(db);

        var error = await Assert.ThrowsAsync<AppException>(() => service.GetCustomerAsync(other.UserId, order.OrderId));
        Assert.Equal(404, error.StatusCode);
    }

    [Fact]
    public async Task Staff_rental_filter_excludes_seed_packet_orders()
    {
        await using var db = Context();
        var customer = Customer();
        db.AddRange(customer,
            new Order
            {
                Customer = customer, OrderCode = "TR-LIST", OrderType = OrderType.TrayRental,
                OrderStatus = OrderStatus.Confirmed, ExpiresAt = DateTime.UtcNow.AddMinutes(20)
            },
            new Order
            {
                Customer = customer, OrderCode = "SP-LIST", OrderType = OrderType.SeedPacket,
                OrderStatus = OrderStatus.Confirmed, ExpiresAt = DateTime.UtcNow.AddMinutes(20)
            });
        await db.SaveChangesAsync();
        var service = new OrderService(db);

        var page = await service.ListStaffAsync(new QueryRequest(), OrderType.TrayRental, null);

        Assert.Equal(1, page.TotalItems);
        Assert.Single(page.Items);
    }

    [Fact]
    public async Task Customer_rentals_endpoint_excludes_seed_packet_orders()
    {
        await using var db = Context();
        var customer = Customer();
        db.AddRange(customer,
            new Order
            {
                Customer = customer, OrderCode = "TR-CUSTOMER", OrderType = OrderType.TrayRental,
                OrderStatus = OrderStatus.Confirmed, ExpiresAt = DateTime.UtcNow.AddMinutes(20)
            },
            new Order
            {
                Customer = customer, OrderCode = "SP-CUSTOMER", OrderType = OrderType.SeedPacket,
                OrderStatus = OrderStatus.Confirmed, ExpiresAt = DateTime.UtcNow.AddMinutes(20)
            });
        await db.SaveChangesAsync();
        var orderService = new OrderService(db);
        var rentalService = new RentalService(new UnitOfWork(db), orderService);

        var page = await rentalService.ListAsync(customer.UserId, new QueryRequest());

        Assert.Equal(1, page.TotalItems);
        Assert.Single(page.Items);
    }

    private static User Customer(string email = "customer@test.local") => new()
    {
        Email = email, FullName = "Test Customer", PasswordHash = "x", Role = RoleNames.Customer
    };

    private static Supply Seed(int stock) => new()
    {
        SupplyName = "Lettuce", SupplyType = SupplyType.Seed, HarvestDays = 30,
        Unit = "packet", UnitPrice = 10, RentalPrice = 20, QuantityInStock = stock
    };
}
