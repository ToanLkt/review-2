using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;

namespace SmartFarm.Services.Services;

public interface IOrderService
{
    Task<OrderDetailsResponse> CreateSeedPacketAsync(int customerId, CreateSeedPacketOrderRequest request);
    Task<PagedResponse<object>> ListCustomerAsync(int customerId, QueryRequest request);
    Task<OrderDetailsResponse> GetCustomerAsync(int customerId, int orderId);
    Task<PagedResponse<object>> ListStaffAsync(QueryRequest request, string? orderType, string? status);
    Task<OrderDetailsResponse> GetStaffAsync(int orderId);
    Task<OrderDetailsResponse> TransitionAsync(int orderId, string targetStatus);
    Task<int> ExpireAwaitingPaymentAsync(DateTime utcNow);
}

public sealed class OrderService(AppDbContext db,NotificationService? notifications=null,InventoryService? inventory=null,IRoutingService? routing=null) : IOrderService
{
    private readonly DeliveryPricingService _deliveryPricing = new(db, routing);

    private const int PaymentWindowMinutes = 15;

    private static readonly IReadOnlyDictionary<string, string> NextStatus =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [OrderStatus.AwaitingPayment] = OrderStatus.Confirmed,
            [OrderStatus.Confirmed] = OrderStatus.Preparing,
            [OrderStatus.Preparing] = OrderStatus.Delivering,
            [OrderStatus.Delivering] = OrderStatus.Completed
        };

    public async Task<OrderDetailsResponse> CreateSeedPacketAsync(int customerId, CreateSeedPacketOrderRequest request)
    {
        // Tính khoảng cách + phí giao hàng TRƯỚC khi mở transaction để không giữ lock DB trong lúc gọi OSRM qua mạng.
        var delivery = await _deliveryPricing.QuoteAsync(request.ShippingLatitude, request.ShippingLongitude);
        // Ngoài bán kính giao: chỉ cho tạo đơn khi khách đã tick đồng ý. Không tick -> chặn, không tạo đơn.
        if (delivery.IsOutOfRange && !request.IsAccepted)
            throw new AppException(422, "Delivery address is outside the farm's delivery radius. Customer acceptance is required.",
                new { distanceKm = delivery.DistanceKm, requiresAcceptance = true });
        // IsAccepted chỉ có ý nghĩa khi ngoài bán kính; trong bán kính luôn là false.
        var isAccepted = delivery.IsOutOfRange && request.IsAccepted;

        await using var transaction = await BeginTransactionAsync();
        var supply = await FindAndLockSupplyAsync(request.SeedVarietyId)
            ?? throw new AppException(404, "Seed variety not found.");
        if (!supply.IsActive || supply.SupplyType != SupplyType.Seed)
            throw new AppException(404, "Seed variety not found.");
        if (supply.QuantityInStock < request.Quantity)
            throw new AppException(409, "Insufficient seed packet stock.", new { available = supply.QuantityInStock });

        supply.QuantityInStock -= request.Quantity;
        var now = DateTime.UtcNow;
        var subtotal = supply.UnitPrice * request.Quantity;
        var order = new Order
        {
            OrderCode = NewOrderCode("SP", now),
            CustomerId = customerId,
            OrderType = OrderType.SeedPacket,
            OrderStatus = OrderStatus.AwaitingPayment,
            ShippingAddress = request.ShippingAddress.Trim(),
            ShippingLatitude = request.ShippingLatitude,
            ShippingLongitude = request.ShippingLongitude,
            DeliveryDistanceKm = delivery.DistanceKm,
            IsAccepted = isAccepted,
            Subtotal = subtotal,
            TotalAmount = subtotal,
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(PaymentWindowMinutes)
        };
        order.Items.Add(new OrderItem
        {
            SupplyId = supply.SupplyId,
            Supply = supply,
            ItemType = OrderType.SeedPacket,
            Quantity = request.Quantity,
            UnitPrice = supply.UnitPrice,
            Subtotal = subtotal
        });
        db.Orders.Add(order);
        await db.SaveChangesAsync();
        if(inventory is not null)await inventory.RefreshLowStockAlertAsync(supply.SupplyId);
        await CommitAsync(transaction);
        if(notifications is not null)await notifications.SendDomainAsync(customerId,"Đơn hàng đã được tạo",
            $"Đơn {order.OrderCode} đang chờ thanh toán.",NotificationTypes.Order,order.OrderId,$"ORDER:{order.OrderId}:CREATED");
        return await LoadDetailsAsync(order.OrderId);
    }

    public async Task<PagedResponse<object>> ListCustomerAsync(int customerId, QueryRequest request)
    {
        await ExpireAwaitingPaymentAsync(DateTime.UtcNow);
        return await ListAsync(OrderQuery().Where(x => x.CustomerId == customerId), request);
    }

    public async Task<OrderDetailsResponse> GetCustomerAsync(int customerId, int orderId)
    {
        await ExpireOrderIfDueAsync(orderId, DateTime.UtcNow);
        var order = await OrderQuery().FirstOrDefaultAsync(x => x.OrderId == orderId && x.CustomerId == customerId)
            ?? throw new AppException(404, "Order not found.");
        return ToDto(order);
    }

    public async Task<PagedResponse<object>> ListStaffAsync(QueryRequest request, string? orderType, string? status)
    {
        await ExpireAwaitingPaymentAsync(DateTime.UtcNow);
        var query = OrderQuery();
        if (!string.IsNullOrWhiteSpace(orderType)) query = query.Where(x => x.OrderType == orderType.Trim().ToUpperInvariant());
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.OrderStatus == status.Trim().ToUpperInvariant());
        return await ListAsync(query, request);
    }

    public async Task<OrderDetailsResponse> GetStaffAsync(int orderId)
    {
        await ExpireOrderIfDueAsync(orderId, DateTime.UtcNow);
        return await LoadDetailsAsync(orderId);
    }

    public async Task<OrderDetailsResponse> TransitionAsync(int orderId, string targetStatus)
    {
        var target = targetStatus.Trim().ToUpperInvariant();
        await using var transaction = await BeginTransactionAsync();
        var order = await db.Orders.FirstOrDefaultAsync(x => x.OrderId == orderId)
            ?? throw new AppException(404, "Order not found.");

        if (order.OrderStatus == OrderStatus.AwaitingPayment && order.ExpiresAt <= DateTime.UtcNow)
        {
            await ExpireTrackedOrderAsync(order);
            await db.SaveChangesAsync();
            await CommitAsync(transaction);
            throw new AppException(409, "Order has expired.");
        }
        if (string.Equals(order.OrderStatus, target, StringComparison.OrdinalIgnoreCase))
        {
            await CommitAsync(transaction);
            return await LoadDetailsAsync(orderId);
        }
        if (!NextStatus.TryGetValue(order.OrderStatus, out var allowed) || allowed != target)
            throw new AppException(409, $"Invalid order transition: {order.OrderStatus} -> {target}.", new { allowed });

        // Bảo vệ thanh toán: KHÔNG cho xác nhận đơn (-> CONFIRMED) khi chưa có Payment SUCCESS.
        // Chặn staff lỡ tay xác nhận đơn chưa nhận được tiền. Webhook SePay tự set CONFIRMED khi tiền về;
        // đường thủ công này chỉ dùng khi đã có payment thành công nhưng trạng thái đơn chưa kịp cập nhật.
        if (target == OrderStatus.Confirmed)
        {
            var paid = await db.Payments.AnyAsync(p => p.OrderId == orderId && p.PaymentStatus == PaymentStatuses.Success);
            if (!paid)
                throw new AppException(409, "Cannot confirm order before payment succeeds.");
        }

        // A1: không cho hoàn thành đơn thủ công khi còn chu kỳ chưa giao xong (COMPLETED chỉ đến từ delivery chu kỳ cuối).
        if (target == OrderStatus.Completed &&
            await db.TrayRentals.AnyAsync(r => r.OrderId == orderId && r.CurrentCycle < r.TotalCycles))
            throw new AppException(409, "Cannot complete order while cycles remain. Deliver the final cycle instead.");

        order.OrderStatus = target;
        await db.SaveChangesAsync();
        await CommitAsync(transaction);
        if(notifications is not null)await notifications.SendDomainAsync(order.CustomerId,"Trạng thái đơn hàng",
            $"Đơn {order.OrderCode} đã chuyển sang {target}.",NotificationTypes.Order,order.OrderId,$"ORDER:{order.OrderId}:{target}");
        return await LoadDetailsAsync(orderId);
    }

    public async Task<int> ExpireAwaitingPaymentAsync(DateTime utcNow)
    {
        await using var transaction = await BeginTransactionAsync();
        var orders = await db.Orders
            .Include(x => x.Items).ThenInclude(x => x.Supply)
            .Include(x => x.TrayRentals).ThenInclude(x => x.SoilTray)
            .Where(x => x.OrderStatus == OrderStatus.AwaitingPayment && x.ExpiresAt <= utcNow)
            .ToListAsync();
        foreach (var order in orders) await ExpireTrackedOrderAsync(order);
        // Đồng bộ Payment: đơn hết hạn thì payment PENDING của nó cũng chuyển EXPIRED (tránh treo PENDING mãi).
        if (orders.Count > 0)
        {
            var expiredOrderIds = orders.Select(x => x.OrderId).ToList();
            var pendingPayments = await db.Payments
                .Where(p => expiredOrderIds.Contains(p.OrderId) && p.PaymentStatus == PaymentStatuses.Pending)
                .ToListAsync();
            foreach (var payment in pendingPayments) payment.PaymentStatus = PaymentStatuses.Expired;
        }
        if (orders.Count > 0) await db.SaveChangesAsync();
        if(inventory is not null)foreach(var supplyId in orders.SelectMany(x=>x.Items).Select(x=>x.SupplyId).Distinct())await inventory.RefreshLowStockAlertAsync(supplyId);
        await CommitAsync(transaction);
        return orders.Count;
    }

    private async Task ExpireOrderIfDueAsync(int orderId, DateTime utcNow)
    {
        var isDue = await db.Orders.AnyAsync(x => x.OrderId == orderId &&
            x.OrderStatus == OrderStatus.AwaitingPayment && x.ExpiresAt <= utcNow);
        if (isDue) await ExpireAwaitingPaymentAsync(utcNow);
    }

    private static Task ExpireTrackedOrderAsync(Order order)
    {
        if (order.OrderStatus != OrderStatus.AwaitingPayment) return Task.CompletedTask;
        if (order.OrderType == OrderType.TrayRental)
        {
            foreach (var rental in order.TrayRentals)
                if (rental.SoilTray is not null && rental.SoilTray.CurrentStatus == TrayStatus.Rented)
                    rental.SoilTray.CurrentStatus = TrayStatus.Available;
        }
        else if (order.OrderType == OrderType.SeedPacket)
        {
            foreach (var item in order.Items)
                if (item.Supply is not null) item.Supply.QuantityInStock += item.Quantity;
        }
        order.OrderStatus = OrderStatus.Expired;
        return Task.CompletedTask;
    }

    private IQueryable<Order> OrderQuery() => db.Orders.AsNoTracking()
        .Include(x => x.Customer)
        .Include(x => x.Items).ThenInclude(x => x.Supply)
        .Include(x => x.TrayRentals).ThenInclude(x => x.SoilTray);

    private async Task<OrderDetailsResponse> LoadDetailsAsync(int orderId)
    {
        var order = await OrderQuery().FirstOrDefaultAsync(x => x.OrderId == orderId)
            ?? throw new AppException(404, "Order not found.");
        return ToDto(order);
    }

    private static OrderDetailsResponse ToDto(Order order) => new()
    {
        OrderId = order.OrderId,
        OrderCode = order.OrderCode,
        CustomerId = order.CustomerId,
        CustomerName = order.Customer?.FullName ?? "",
        OrderType = order.OrderType,
        Status = order.OrderStatus,
        TotalAmount = order.TotalAmount,
        ShippingAddress = order.ShippingAddress,
        ShippingLatitude = order.ShippingLatitude,
        ShippingLongitude = order.ShippingLongitude,
        DeliveryDistanceKm = order.DeliveryDistanceKm,
        CreatedAt = order.CreatedAt,
        PaymentDueAt = order.ExpiresAt,
        TargetPlantingDate = order.TargetPlantingDate,
        TargetDeliveryDate = order.TargetDeliveryDate,
        IsRiskAccepted = order.IsRiskAccepted,
        IsReviewed = order.IsReviewed,
        IsAccepted = order.IsAccepted,
        Subtotal = order.Subtotal,
        DiscountPercent = order.DiscountPercent,
        DiscountAmount = order.DiscountAmount,
        Items = order.Items.Select(x => new OrderItemResponse
        {
            OrderItemId = x.OrderItemId,
            SupplyId = x.SupplyId,
            SupplyName = x.Supply?.SupplyName ?? "",
            ItemType = x.ItemType,
            Quantity = x.Quantity,
            UnitPrice = x.UnitPrice,
            Subtotal = x.Subtotal,
            TotalCycles = x.TotalCycles,
            CurrentCycle = x.CurrentCycle
        }).ToList(),
        Rentals = order.TrayRentals.Select(x => new TrayRentalLineResponse(x.RentalId, x.SoilTrayId,
            x.SoilTray?.TrayCode ?? "", x.StartDate, x.ExpectedHarvestDate, x.CropStatus,
            x.TotalCycles, x.CurrentCycle, x.ActualHarvestDate)).ToList()
    };

    private async Task<PagedResponse<object>> ListAsync(IQueryable<Order> query, QueryRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(x => x.OrderCode.Contains(request.Search));
        query = request.Sort?.ToLowerInvariant() switch
        {
            "createdat" => query.OrderBy(x => x.CreatedAt),
            "totalamount" => query.OrderBy(x => x.TotalAmount),
            "-totalamount" => query.OrderByDescending(x => x.TotalAmount),
            _ => query.OrderByDescending(x => x.CreatedAt)
        };
        var (page, size) = QueryHelper.Paging(request);
        var total = await query.CountAsync();
        var rows = await query.Skip((page - 1) * size).Take(size).ToListAsync();
        var items = rows.Select(x => QueryHelper.SelectFields(ToDto(x), request.Fields)).ToList();
        return new PagedResponse<object>(items, page, size, total);
    }

    private async Task<Supply?> FindAndLockSupplyAsync(int supplyId)
    {
        if (!db.Database.IsRelational()) return await db.Supplies.FirstOrDefaultAsync(x => x.SupplyId == supplyId);
        return await db.Supplies.FromSqlInterpolated($"SELECT * FROM Supplies WHERE SupplyId={supplyId} FOR UPDATE")
            .FirstOrDefaultAsync();
    }

    private async Task<IDbContextTransaction?> BeginTransactionAsync()
    {
        if (!db.Database.IsRelational()) return null;
        return await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
    }

    private static Task CommitAsync(IDbContextTransaction? transaction) =>
        transaction is null ? Task.CompletedTask : transaction.CommitAsync();

    private static string NewOrderCode(string prefix, DateTime utcNow) =>
        $"{prefix}{utcNow:yyyyMMddHHmmssfff}{Random.Shared.Next(10, 99)}";
}
