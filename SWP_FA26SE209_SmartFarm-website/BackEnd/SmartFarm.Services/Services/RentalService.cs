using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;

namespace SmartFarm.Services.Services;

public interface IRentalService
{
    Task<OrderResponse> CreateAsync(int userId, CreateTrayRentalRequest request);
    Task<PagedResponse<object>> ListAsync(int userId, QueryRequest request);
    Task<OrderResponse> DetailAsync(int userId, int id);
}

public sealed class RentalService(IUnitOfWork unit, IOrderService orders, DeliveryPricingService? deliveryPricing = null) : IRentalService
{
    private const int PaymentWindowMinutes = 30;

    // % giảm giá theo cấu hình: đủ số chu kỳ, đủ số khay, hoặc khách thân thiết. Lấy mức cao nhất đủ điều kiện.
    private async Task<decimal> ResolveDiscountPercentAsync(int customerId, int trayCount, int cycles)
    {
        var config = await unit.FarmConfigs.Query(false).OrderBy(c => c.ConfigId).FirstOrDefaultAsync();
        if (config is null) return 0m;
        decimal percent = 0m;
        if (cycles >= config.DiscountCycleThreshold)
            percent = Math.Max(percent, config.StandardDiscountPercent);
        if (trayCount >= config.DiscountTrayThreshold)
            percent = Math.Max(percent, config.StandardDiscountPercent);
        var completedOrders = await unit.Orders.Query(false)
            .CountAsync(o => o.CustomerId == customerId && o.OrderStatus == OrderStatus.Completed);
        if (completedOrders >= config.LoyalOrderThreshold)
            percent = Math.Max(percent, config.LoyalDiscountPercent);
        return percent;
    }

    private static OrderResponse ToDto(Order order) => new(order.OrderId, order.OrderCode,
        order.OrderType, order.OrderStatus, order.TotalAmount, order.CreatedAt, order.ExpiresAt,
        order.TrayRentals.Select(r => new TrayRentalLineResponse(r.RentalId, r.SoilTrayId,
            r.SoilTray?.TrayCode ?? "", r.StartDate, r.ExpectedHarvestDate, r.CropStatus,
            r.TotalCycles, r.CurrentCycle, r.ActualHarvestDate)).ToList())
    {
        TargetPlantingDate = order.TargetPlantingDate, TargetDeliveryDate = order.TargetDeliveryDate,
        IsRiskAccepted = order.IsRiskAccepted, IsReviewed = order.IsReviewed,
        Subtotal = order.Subtotal,
        DiscountPercent = order.DiscountPercent, DiscountAmount = order.DiscountAmount,
        ShippingAddress = order.ShippingAddress,
        ShippingLatitude = order.ShippingLatitude,
        ShippingLongitude = order.ShippingLongitude,
        DeliveryDistanceKm = order.DeliveryDistanceKm,
        IsAccepted = order.IsAccepted
    };

    public async Task<OrderResponse> CreateAsync(int userId, CreateTrayRentalRequest request)
    {
        var seed = await unit.Supplies.Query().FirstOrDefaultAsync(s => s.SupplyId == request.SeedVarietyId && s.IsActive && s.SupplyType == SupplyType.Seed)
            ?? throw new AppException(404, "Seed variety not found.");
        if (request.FarmAreaId.HasValue && !await unit.FarmZones.Query(false).AnyAsync(z => z.ZoneId == request.FarmAreaId && z.IsActive))
            throw new AppException(404, "Farm area not found.");
        // Chặn đặt trước quá số ngày tối đa cấu hình (TASK: MaxPreOrderDays).
        if (request.TargetPlantingDate.HasValue)
        {
            var maxDays = (await unit.FarmConfigs.Query(false).OrderBy(c => c.ConfigId).FirstOrDefaultAsync())?.MaxPreOrderDays ?? 30;
            if (request.TargetPlantingDate.Value.ToUniversalTime().Date > DateTime.UtcNow.Date.AddDays(maxDays))
                throw new AppException(409, $"Planting date cannot be more than {maxDays} days in advance.");
        }

        // Tính khoảng cách + kiểm tra bán kính giao TRƯỚC khi mở transaction (tránh giữ lock DB trong lúc gọi OSRM).
        DeliveryQuote delivery = default;
        if (deliveryPricing is not null)
        {
            delivery = await deliveryPricing.QuoteAsync(request.ShippingLatitude, request.ShippingLongitude);
            if (delivery.IsOutOfRange && !request.IsAccepted)
                throw new AppException(422, "Delivery address is outside the farm's delivery radius. Customer acceptance is required.",
                    new { distanceKm = delivery.DistanceKm, requiresAcceptance = true });
        }
        else if (request.ShippingLatitude is null || request.ShippingLongitude is null)
        {
            throw new AppException(400, "Shipping coordinates are required to create the order.");
        }
        var isAccepted = delivery.IsOutOfRange && request.IsAccepted;

        await using var transaction = await unit.BeginSerializableTransactionAsync();
        var trays = await unit.LockAvailableTraysAsync(request.Quantity, request.FarmAreaId);
        if (trays.Count < request.Quantity)
            throw new AppException(409, $"Only {trays.Count} tray(s) available.", new { available = trays.Count });

        var now = DateTime.UtcNow;
        var cycles = Math.Max(1, request.TotalCycles);
        // Ngày trồng theo khách chọn (nếu có). Chu kỳ luôn khởi tạo WAITING_PLANTING: chưa thanh toán
        // thì KHÔNG được bắt đầu trồng. Chuyển sang PLANTED chỉ sau khi đơn đã CONFIRMED (ngay khi
        // thanh toán nếu đã tới ngày trồng, hoặc do worker khi tới ngày).
        var plantAt = request.TargetPlantingDate?.ToUniversalTime() ?? now;
        var cropStatus = CropStatus.WaitingPlanting;
        // Giá thuê nhân theo số chu kỳ (mỗi đợt trồng).
        var subtotal = seed.RentalPrice * request.Quantity * cycles;
        // Ưu đãi: giảm theo số chu kỳ (DiscountCycleThreshold), số khay (DiscountTrayThreshold) hoặc khách thân thiết.
        // Lấy mức cao nhất đủ điều kiện (không cộng dồn), áp lên tiền thuê (subtotal).
        var discountPercent = await ResolveDiscountPercentAsync(userId, request.Quantity, cycles);
        var discountAmount = Math.Round(subtotal * discountPercent / 100m, 2);
        var total = subtotal - discountAmount;
        var order = new Order
        {
            OrderCode = $"TR{now:yyyyMMddHHmmss}{Random.Shared.Next(100, 999)}",
            CustomerId = userId, OrderType = OrderType.TrayRental, OrderStatus = OrderStatus.AwaitingPayment,
            TotalAmount = total, Subtotal = subtotal,
            DiscountPercent = discountPercent, DiscountAmount = discountAmount,
            CreatedAt = now, ExpiresAt = now.AddMinutes(PaymentWindowMinutes),
            TargetPlantingDate = request.TargetPlantingDate?.ToUniversalTime(),
            TargetDeliveryDate = request.TargetDeliveryDate?.ToUniversalTime(),
            IsRiskAccepted = request.IsRiskAccepted,
            ShippingAddress = string.IsNullOrWhiteSpace(request.ShippingAddress) ? null : request.ShippingAddress.Trim(),
            ShippingLatitude = request.ShippingLatitude,
            ShippingLongitude = request.ShippingLongitude,
            DeliveryDistanceKm = delivery.DistanceKm,
            IsAccepted = isAccepted
        };
        // Chuẩn hóa 1 OrderItem = 1 khay: mỗi khay một dòng item (Quantity=1), lưu số chu kỳ đã chọn.
        foreach (var tray in trays)
        {
            tray.CurrentStatus = TrayStatus.Rented;
            order.Items.Add(new OrderItem
            {
                ItemType = OrderType.TrayRental, SupplyId = seed.SupplyId,
                Quantity = 1, UnitPrice = seed.RentalPrice, Subtotal = seed.RentalPrice * cycles,
                TotalCycles = cycles, CurrentCycle = 1
            });
            order.TrayRentals.Add(new TrayRental
            {
                CustomerId=userId, SoilTrayId = tray.SoilTrayId, SoilTray = tray, SupplyId = seed.SupplyId,
                StartDate = plantAt, ExpectedHarvestDate = plantAt.AddDays(seed.HarvestDays), CropStatus = cropStatus,
                TotalCycles = cycles, CurrentCycle = 1
            });
        }
        unit.Orders.Add(order);
        await unit.SaveChangesAsync();
        if (transaction is not null)
            await transaction.CommitAsync();
        return ToDto(order);
    }

    public async Task<PagedResponse<object>> ListAsync(int userId, QueryRequest request)
    {
        await orders.ExpireAwaitingPaymentAsync(DateTime.UtcNow);
        var query = unit.Orders.Query(false).Where(o => o.CustomerId == userId && o.OrderType == OrderType.TrayRental)
            .Include(o => o.TrayRentals).ThenInclude(r => r.SoilTray).AsQueryable();
        if (!string.IsNullOrWhiteSpace(request.Search)) query = query.Where(o => o.OrderCode.Contains(request.Search));
        query = request.Sort?.ToLowerInvariant() switch
        {
            "createdat" => query.OrderBy(o => o.CreatedAt),
            "totalamount" => query.OrderBy(o => o.TotalAmount),
            "-totalamount" => query.OrderByDescending(o => o.TotalAmount),
            _ => query.OrderByDescending(o => o.CreatedAt)
        };
        var (page, size) = QueryHelper.Paging(request); var total = await query.CountAsync();
        var rows = await query.Skip((page - 1) * size).Take(size).ToListAsync();
        var items = rows.Select(o => QueryHelper.SelectFields(ToDto(o), request.Fields)).ToList();
        return new(items, page, size, total);
    }

    public async Task<OrderResponse> DetailAsync(int userId, int id)
    {
        await orders.ExpireAwaitingPaymentAsync(DateTime.UtcNow);
        var order = await unit.Orders.Query(false).Include(o => o.TrayRentals).ThenInclude(r => r.SoilTray)
            .FirstOrDefaultAsync(o => o.OrderId == id && o.CustomerId == userId && o.OrderType == OrderType.TrayRental)
            ?? throw new AppException(404, "Rental order not found.");
        return ToDto(order);
    }
}
