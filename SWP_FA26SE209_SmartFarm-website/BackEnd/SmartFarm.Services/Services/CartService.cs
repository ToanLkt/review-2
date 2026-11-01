using System.Data;
using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;

namespace SmartFarm.Services.Services;

public interface ICartService
{
    Task<CartResponse> GetAsync(int customerId);
    Task<CartResponse> AddItemAsync(int customerId, AddCartItemRequest request);
    Task<CartResponse> UpdateItemAsync(int customerId, int cartItemId, UpdateCartItemRequest request);
    Task<CartResponse> RemoveItemAsync(int customerId, int cartItemId);
    Task<CartResponse> ClearAsync(int customerId);
    Task<OrderResponse> CheckoutAsync(int customerId, CheckoutCartRequest request);
}

/// <summary>
/// Giỏ hàng thuê khay: mỗi dòng = 1 khay + 1 loại hạt. Giỏ chỉ chứa dòng thuê khay, tách riêng
/// khỏi luồng mua hạt (SEED_PACKET). Giỏ CHỈ lưu lựa chọn + giá tạm tính; khay chỉ bị khóa
/// (transaction Serializable + FOR UPDATE) khi CHECKOUT. Tổng tiền = tiền thuê (theo chu kỳ) trừ ưu đãi.
/// </summary>
public sealed class CartService(AppDbContext db, NotificationService? notifications = null, IRoutingService? routing = null) : ICartService
{
    private const int PaymentWindowMinutes = 30;
    private readonly DeliveryPricingService _deliveryPricing = new(db, routing);

    public async Task<CartResponse> GetAsync(int customerId)
    {
        var cart = await LoadCartAsync(customerId);
        return await BuildResponseAsync(cart);
    }

    public async Task<CartResponse> AddItemAsync(int customerId, AddCartItemRequest request)
    {
        var seed = await db.Supplies.FirstOrDefaultAsync(s =>
                       s.SupplyId == request.SeedVarietyId && s.IsActive && s.SupplyType == SupplyType.Seed)
                   ?? throw new AppException(404, "Seed variety not found.");
        if (request.FarmAreaId.HasValue &&
            !await db.FarmZones.AnyAsync(z => z.ZoneId == request.FarmAreaId && z.IsActive))
            throw new AppException(404, "Farm area not found.");

        // Chặn đặt ngày trồng quá số ngày tối đa cấu hình.
        if (request.TargetPlantingDate.HasValue)
        {
            var maxDays = (await db.FarmConfigs.AsNoTracking().OrderBy(c => c.ConfigId).FirstOrDefaultAsync())?.MaxPreOrderDays ?? 7;
            if (request.TargetPlantingDate.Value.ToUniversalTime().Date > DateTime.UtcNow.Date.AddDays(maxDays))
                throw new AppException(409, $"Planting date cannot be more than {maxDays} days in advance.");
        }

        var cart = await LoadCartOrCreateAsync(customerId);
        cart.Items.Add(new CartItem
        {
            SeedVarietyId = seed.SupplyId,
            FarmAreaId = request.FarmAreaId,
            TotalCycles = Math.Max(1, request.TotalCycles),
            TargetPlantingDate = request.TargetPlantingDate?.ToUniversalTime(),
            AddedAt = DateTime.UtcNow
        });
        cart.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return await GetAsync(customerId);
    }

    public async Task<CartResponse> UpdateItemAsync(int customerId, int cartItemId, UpdateCartItemRequest request)
    {
        var cart = await LoadCartAsync(customerId);
        var item = cart.Items.FirstOrDefault(i => i.CartItemId == cartItemId)
                   ?? throw new AppException(404, "Cart item not found.");

        if (request.TargetPlantingDate.HasValue)
        {
            var maxDays = (await db.FarmConfigs.AsNoTracking().OrderBy(c => c.ConfigId).FirstOrDefaultAsync())?.MaxPreOrderDays ?? 7;
            if (request.TargetPlantingDate.Value.ToUniversalTime().Date > DateTime.UtcNow.Date.AddDays(maxDays))
                throw new AppException(409, $"Planting date cannot be more than {maxDays} days in advance.");
            item.TargetPlantingDate = request.TargetPlantingDate.Value.ToUniversalTime();
        }

        item.TotalCycles = Math.Max(1, request.TotalCycles);
        cart.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return await BuildResponseAsync(cart);
    }

    public async Task<CartResponse> RemoveItemAsync(int customerId, int cartItemId)
    {
        var cart = await LoadCartAsync(customerId);
        var item = cart.Items.FirstOrDefault(i => i.CartItemId == cartItemId)
                   ?? throw new AppException(404, "Cart item not found.");
        db.CartItems.Remove(item);
        cart.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return await GetAsync(customerId);
    }

    public async Task<CartResponse> ClearAsync(int customerId)
    {
        var cart = await LoadCartAsync(customerId);
        if (cart.Items.Count > 0)
        {
            db.CartItems.RemoveRange(cart.Items);
            cart.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }
        return await GetAsync(customerId);
    }

    public async Task<OrderResponse> CheckoutAsync(int customerId, CheckoutCartRequest request)
    {
        var cart = await db.Carts.Include(c => c.Items).ThenInclude(i => i.SeedVariety)
                       .FirstOrDefaultAsync(c => c.CustomerId == customerId)
                   ?? throw new AppException(400, "Cart is empty.");
        if (cart.Items.Count == 0) throw new AppException(400, "Cart is empty.");

        List<CartItem> targetItems;
        if (request.CartItemIds is { Count: > 0 })
        {
            var requestedIds = request.CartItemIds.Distinct().ToHashSet();
            targetItems = cart.Items.Where(i => requestedIds.Contains(i.CartItemId)).ToList();
            if (targetItems.Count != requestedIds.Count)
                throw new AppException(400, "One or more selected items were not found in cart.");
        }
        else
        {
            targetItems = cart.Items.ToList();
        }
        if (targetItems.Count == 0) throw new AppException(400, "Cart is empty.");

        // Tính khoảng cách + phí giao hàng TRƯỚC khi mở transaction (tránh giữ lock khay trong lúc gọi OSRM).
        var delivery = await _deliveryPricing.QuoteAsync(request.ShippingLatitude, request.ShippingLongitude);
        // Ngoài bán kính giao: chỉ cho tạo đơn khi khách đã tick đồng ý. Không tick -> chặn, giữ nguyên giỏ.
        if (delivery.IsOutOfRange && !request.IsAccepted)
            throw new AppException(422, "Delivery address is outside the farm's delivery radius. Customer acceptance is required.",
                new { distanceKm = delivery.DistanceKm, requiresAcceptance = true });
        var isAccepted = delivery.IsOutOfRange && request.IsAccepted;

        await using var transaction = await BeginTransactionAsync();
        var now = DateTime.UtcNow;

        // Khóa đủ khay cho từng dòng (mỗi dòng 1 khay). Loại trừ khay đã chọn để không cấp trùng.
        var chosen = new List<(CartItem item, SoilTray tray, Supply seed)>();
        var usedTrayIds = new List<int>();
        foreach (var item in targetItems)
        {
            var seed = item.SeedVariety
                       ?? await db.Supplies.FirstOrDefaultAsync(s => s.SupplyId == item.SeedVarietyId)
                       ?? throw new AppException(404, "Seed variety not found.");
            var tray = await LockOneAvailableTrayAsync(item.FarmAreaId, usedTrayIds)
                       ?? throw new AppException(409, "Not enough available trays for the cart.",
                           new { cartItemId = item.CartItemId });
            usedTrayIds.Add(tray.SoilTrayId);
            chosen.Add((item, tray, seed));
        }

        // Giá thuê nhân theo số chu kỳ của từng khay.
        var subtotal = chosen.Sum(c => c.item.TotalCycles * c.seed.RentalPrice);
        // Ưu đãi: giảm theo số khay (DiscountTrayThreshold), số chu kỳ cao nhất của một khay (DiscountCycleThreshold),
        // hoặc khách thân thiết (LoyalOrderThreshold). Lấy mức CAO NHẤT đủ điều kiện (không cộng dồn) trên tiền thuê.
        var maxCycles = chosen.Max(c => c.item.TotalCycles);
        var discountPercent = await ResolveDiscountPercentAsync(customerId, chosen.Count, maxCycles);
        var discountAmount = Math.Round(subtotal * discountPercent / 100m, 2);
        // Tổng = tiền thuê - ưu đãi (không tính phí giao hàng).
        var total = subtotal - discountAmount;

        var order = new Order
        {
            OrderCode = $"TR{now:yyyyMMddHHmmss}{Random.Shared.Next(100, 999)}",
            CustomerId = customerId,
            OrderType = OrderType.TrayRental,
            OrderStatus = OrderStatus.AwaitingPayment,
            TotalAmount = total,
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(PaymentWindowMinutes),
            Subtotal = subtotal,
            DiscountPercent = discountPercent, DiscountAmount = discountAmount,
            // Địa chỉ nhận hàng + toạ độ + khoảng cách + phí giao (nhập ngay tại checkout).
            ShippingAddress = string.IsNullOrWhiteSpace(request.ShippingAddress) ? null : request.ShippingAddress.Trim(),
            ShippingLatitude = request.ShippingLatitude,
            ShippingLongitude = request.ShippingLongitude,
            DeliveryDistanceKm = delivery.DistanceKm,
            // Khách xác nhận đồng ý rủi ro ngay tại bước checkout (giống luồng thuê trực tiếp).
            IsRiskAccepted = request.IsRiskAccepted,
            // Đồng ý nhận giao ngoài bán kính (chỉ true khi thực sự ngoài bán kính và khách đã tick).
            IsAccepted = isAccepted,
            // Order.TargetPlantingDate = ngày trồng sớm nhất trong các khay (ngày chính xác nằm ở từng TrayRental).
            TargetPlantingDate = chosen.Select(c => c.item.TargetPlantingDate).Where(d => d.HasValue).Min()
        };
        foreach (var (item, tray, seed) in chosen)
        {
            tray.CurrentStatus = TrayStatus.Rented;
            var cycles = Math.Max(1, item.TotalCycles);
            // Ngày trồng theo từng khay. Chu kỳ luôn khởi tạo WAITING_PLANTING: chưa thanh toán thì
            // KHÔNG được bắt đầu trồng. Việc chuyển sang PLANTED chỉ xảy ra sau khi đơn đã CONFIRMED
            // (ngay khi thanh toán nếu đã tới ngày trồng, hoặc do worker khi tới ngày).
            var plantAt = item.TargetPlantingDate?.ToUniversalTime() ?? now;
            var cropStatus = CropStatus.WaitingPlanting;
            order.Items.Add(new OrderItem
            {
                ItemType = OrderType.TrayRental,
                SupplyId = seed.SupplyId,
                Quantity = 1,
                UnitPrice = seed.RentalPrice,
                Subtotal = seed.RentalPrice * cycles,
                TotalCycles = cycles,
                CurrentCycle = 1
            });
            order.TrayRentals.Add(new TrayRental
            {
                CustomerId = customerId, SoilTrayId = tray.SoilTrayId, SoilTray = tray, SupplyId = seed.SupplyId,
                StartDate = plantAt, ExpectedHarvestDate = plantAt.AddDays(seed.HarvestDays), CropStatus = cropStatus,
                TotalCycles = cycles, CurrentCycle = 1
            });
        }
        db.Orders.Add(order);
        db.CartItems.RemoveRange(targetItems);
        cart.UpdatedAt = now;
        await db.SaveChangesAsync();
        await CommitAsync(transaction);

        if (notifications is not null)
            await notifications.SendDomainAsync(customerId, "Đơn thuê khay đã được tạo",
                $"Đơn {order.OrderCode} đang chờ thanh toán.", NotificationTypes.Order, order.OrderId,
                $"ORDER:{order.OrderId}:CREATED");

        return ToOrderDto(order);
    }

    // ---- Helpers ----

    private async Task<Cart> LoadCartAsync(int customerId) =>
        await db.Carts.Include(c => c.Items).ThenInclude(i => i.SeedVariety)
            .Include(c => c.Items).ThenInclude(i => i.FarmArea)
            .FirstOrDefaultAsync(c => c.CustomerId == customerId)
        ?? new Cart { CustomerId = customerId };

    private async Task<Cart> LoadCartOrCreateAsync(int customerId)
    {
        var cart = await db.Carts.Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.CustomerId == customerId);
        if (cart is null)
        {
            cart = new Cart { CustomerId = customerId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            db.Carts.Add(cart);
        }
        return cart;
    }

    private async Task<CartResponse> BuildResponseAsync(Cart cart)
    {
        var items = cart.Items.OrderBy(i => i.AddedAt).Select(i =>
        {
            var rentalPrice = i.SeedVariety?.RentalPrice ?? 0m;
            var cycles = Math.Max(1, i.TotalCycles);
            return new CartItemResponse
            {
                CartItemId = i.CartItemId,
                SeedVarietyId = i.SeedVarietyId,
                SeedVarietyName = i.SeedVariety?.SupplyName ?? "",
                FarmAreaId = i.FarmAreaId,
                FarmAreaName = i.FarmArea?.ZoneName,
                Quantity = 1,
                TotalCycles = cycles,
                TargetPlantingDate = i.TargetPlantingDate,
                RentalPrice = rentalPrice,
                LineTotal = rentalPrice * cycles,
                AddedAt = i.AddedAt
            };
        }).ToList();

        var subtotal = items.Sum(x => x.RentalPrice * x.TotalCycles);
        // Xem trước ưu đãi (giống công thức lúc checkout) để FE hiển thị số tiền giảm dự kiến.
        var maxCycles = items.Count > 0 ? items.Max(x => x.TotalCycles) : 1;
        var discountPercent = items.Count > 0 ? await ResolveDiscountPercentAsync(cart.CustomerId, items.Count, maxCycles) : 0m;
        var discountAmount = Math.Round(subtotal * discountPercent / 100m, 2);
        return new CartResponse
        {
            CartId = cart.CartId,
            Items = items,
            ItemCount = items.Count,
            Subtotal = subtotal,
            DiscountPercent = discountPercent,
            DiscountAmount = discountAmount,
            Total = subtotal - discountAmount
        };
    }

    // Xác định % giảm giá dựa trên cấu hình trang trại: số khay đạt ngưỡng -> giảm tiêu chuẩn;
    // khách thân thiết (đủ số đơn COMPLETED) -> giảm ưu đãi. Lấy mức cao nhất đủ điều kiện.
    private async Task<decimal> ResolveDiscountPercentAsync(int customerId, int trayCount, int cycles)
    {
        var config = await db.FarmConfigs.AsNoTracking().OrderBy(c => c.ConfigId).FirstOrDefaultAsync();
        if (config is null) return 0m;
        decimal percent = 0m;
        if (cycles >= config.DiscountCycleThreshold)
            percent = Math.Max(percent, config.StandardDiscountPercent);
        if (trayCount >= config.DiscountTrayThreshold)
            percent = Math.Max(percent, config.StandardDiscountPercent);
        var completedOrders = await db.Orders.AsNoTracking()
            .CountAsync(o => o.CustomerId == customerId && o.OrderStatus == OrderStatus.Completed);
        if (completedOrders >= config.LoyalOrderThreshold)
            percent = Math.Max(percent, config.LoyalDiscountPercent);
        return percent;
    }

    private async Task<SoilTray?> LockOneAvailableTrayAsync(int? farmAreaId, IReadOnlyCollection<int> exclude)
    {
        if (!db.Database.IsRelational())
        {
            var q = db.SoilTrays.Where(t => t.CurrentStatus == TrayStatus.Available && !exclude.Contains(t.SoilTrayId));
            if (farmAreaId.HasValue) q = q.Where(t => t.Rack!.ZoneId == farmAreaId);
            return await q.OrderBy(t => t.SoilTrayId).FirstOrDefaultAsync();
        }
        // exclude chỉ chứa int (SoilTrayId đã cấp trong phiên checkout này) nên nội suy CSV là an toàn.
        var excludeCsv = exclude.Count == 0 ? "0" : string.Join(",", exclude);
        var sql = farmAreaId.HasValue
            ? $"SELECT st.* FROM SoilTrays st JOIN FarmRacks fr ON fr.RackId=st.RackId WHERE st.CurrentStatus={{0}} AND fr.ZoneId={{1}} AND st.SoilTrayId NOT IN ({excludeCsv}) ORDER BY st.SoilTrayId LIMIT 1 FOR UPDATE"
            : $"SELECT * FROM SoilTrays WHERE CurrentStatus={{0}} AND SoilTrayId NOT IN ({excludeCsv}) ORDER BY SoilTrayId LIMIT 1 FOR UPDATE";
        var query = farmAreaId.HasValue
            ? db.SoilTrays.FromSqlRaw(sql, TrayStatus.Available, farmAreaId.Value)
            : db.SoilTrays.FromSqlRaw(sql, TrayStatus.Available);
        return await query.FirstOrDefaultAsync();
    }

    private async Task<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction?> BeginTransactionAsync()
        => db.Database.IsRelational() ? await db.Database.BeginTransactionAsync(IsolationLevel.Serializable) : null;

    private static Task CommitAsync(Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? t)
        => t is null ? Task.CompletedTask : t.CommitAsync();

    private static OrderResponse ToOrderDto(Order order) => new(order.OrderId, order.OrderCode,
        order.OrderType, order.OrderStatus, order.TotalAmount, order.CreatedAt, order.ExpiresAt,
        order.TrayRentals.Select(r => new TrayRentalLineResponse(r.RentalId, r.SoilTrayId,
            r.SoilTray?.TrayCode ?? "", r.StartDate, r.ExpectedHarvestDate, r.CropStatus,
            r.TotalCycles, r.CurrentCycle, r.ActualHarvestDate)).ToList())
    {
        TargetPlantingDate = order.TargetPlantingDate, TargetDeliveryDate = order.TargetDeliveryDate,
        IsRiskAccepted = order.IsRiskAccepted, IsReviewed = order.IsReviewed,
        IsAccepted = order.IsAccepted,
        Subtotal = order.Subtotal,
        DiscountPercent = order.DiscountPercent, DiscountAmount = order.DiscountAmount,
        ShippingAddress = order.ShippingAddress,
        ShippingLatitude = order.ShippingLatitude, ShippingLongitude = order.ShippingLongitude,
        DeliveryDistanceKm = order.DeliveryDistanceKm
    };
}
