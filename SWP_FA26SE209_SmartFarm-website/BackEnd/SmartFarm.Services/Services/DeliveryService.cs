using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;

namespace SmartFarm.Services.Services;

public sealed class DeliveryService(
    AppDbContext db,
    NotificationService? notifications = null,
    InventoryService? inventory = null,
    DeliveryPricingService? deliveryPricing = null)
{
    private static readonly Dictionary<string, string> Next = new(StringComparer.OrdinalIgnoreCase)
    {
        [DeliveryStatuses.Pending] = DeliveryStatuses.Packaged,
        [DeliveryStatuses.Packaged] = DeliveryStatuses.Shipping,
        [DeliveryStatuses.Shipping] = DeliveryStatuses.Delivered
    };

    public async Task<DeliveryResponse> CreateAsync(CreateDeliveryRequest request)
    {
        var order = await db.Orders.Include(x=>x.TrayRentals).FirstOrDefaultAsync(x => x.OrderId == request.OrderId)
            ?? throw new AppException(404, "Order not found.");
        if (order.OrderStatus != OrderStatus.Confirmed)
            throw new AppException(409, "Only confirmed orders can enter delivery.");

        // Mỗi chu kỳ một delivery. Với đơn thuê khay: lấy chu kỳ hiện tại từ TrayRental để gắn CycleNumber,
        // và chỉ cho tạo giao khi cây đã thu hoạch (HARVESTED) của chu kỳ đó.
        var cycleNumber = 1;
        if (order.OrderType == OrderType.TrayRental)
        {
            TrayRental rental;
            if (request.RentalId.HasValue)
                rental = order.TrayRentals.FirstOrDefault(x => x.RentalId == request.RentalId)
                    ?? throw new AppException(400, "Rental does not belong to the order.");
            else
                rental = order.TrayRentals.OrderBy(x => x.RentalId).FirstOrDefault()
                    ?? throw new AppException(409, "Order has no rental to deliver.");
            if (rental.CropStatus != CropStatus.Harvested)
                throw new AppException(409, "Current cycle must be harvested before delivery.");
            cycleNumber = rental.CurrentCycle;
            request = request with { RentalId = rental.RentalId };
        }
        else if (request.RentalId.HasValue && !order.TrayRentals.Any(x => x.RentalId == request.RentalId))
            throw new AppException(400, "Rental does not belong to the order.");

        if (await db.Deliveries.AnyAsync(x => x.OrderId == request.OrderId && x.CycleNumber == cycleNumber))
            throw new AppException(409, "Delivery already exists for this cycle.");

        var delivery = new Delivery
        {
            OrderId=request.OrderId, RentalId=request.RentalId, CycleNumber=cycleNumber, RecipientName=request.RecipientName.Trim(),
            RecipientPhone=request.RecipientPhone.Trim(),
            // Đồng bộ địa chỉ: bỏ trống -> lấy địa chỉ giao của Order (nguồn sự thật). Có nhập -> dùng địa chỉ mới.
            ShippingAddress=string.IsNullOrWhiteSpace(request.ShippingAddress)?(order.ShippingAddress??"").Trim():request.ShippingAddress.Trim(),
            Notes=request.Notes
        };
        order.OrderStatus = OrderStatus.Preparing; db.Deliveries.Add(delivery); await db.SaveChangesAsync();
        if(notifications is not null)await notifications.SendDomainAsync(order.CustomerId,"Đơn hàng đang chuẩn bị",
            $"Đơn {order.OrderCode} chu kỳ {cycleNumber} đang được chuẩn bị giao.",NotificationTypes.Delivery,delivery.DeliveryId,$"DELIVERY:{delivery.DeliveryId}:PENDING");
        return await GetAsync(delivery.DeliveryId);
    }

    public async Task<PagedResponse<object>> ListAsync(QueryRequest request, string? status)
    {
        var query = Query();
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.DeliveryStatus == status.Trim().ToUpperInvariant());
        if (!string.IsNullOrWhiteSpace(request.Search)) query = query.Where(x => x.Order!.OrderCode.Contains(request.Search) || (x.TrackingCode ?? "").Contains(request.Search));
        var (page,size)=QueryHelper.Paging(request); var total=await query.CountAsync();
        var rows=await query.OrderByDescending(x=>x.DeliveryId).Skip((page-1)*size).Take(size).ToListAsync();
        return new(rows.Select(x=>(object)ToDto(x)).ToList(),page,size,total);
    }

    public async Task<DeliveryResponse> GetAsync(int id)
    {
        var delivery=await Query().FirstOrDefaultAsync(x=>x.DeliveryId==id) ?? throw new AppException(404,"Delivery not found.");
        return ToDto(delivery);
    }

    public async Task<PagedResponse<object>> ListCustomerAsync(int customerId,QueryRequest request)
    {
        var query=Query().Where(x=>x.Order!.CustomerId==customerId);var(page,size)=QueryHelper.Paging(request);var total=await query.CountAsync();var rows=await query.OrderByDescending(x=>x.DeliveryId).Skip((page-1)*size).Take(size).ToListAsync();return new(rows.Select(x=>(object)ToDto(x)).ToList(),page,size,total);
    }

    public async Task<DeliveryResponse> GetCustomerAsync(int customerId,int id)
    {
        var item=await Query().FirstOrDefaultAsync(x=>x.DeliveryId==id&&x.Order!.CustomerId==customerId)??throw new AppException(404,"Delivery not found.");return ToDto(item);
    }

    public async Task<DeliveryResponse> ScheduleCustomerAsync(int customerId, int orderId, ScheduleDeliveryRequest request)
    {
        Delivery? item = null;
        if (request.DeliveryId.HasValue)
        {
            item = await db.Deliveries.Include(x => x.Order).FirstOrDefaultAsync(x => x.DeliveryId == request.DeliveryId.Value);
            if (item is null) throw new AppException(404, "Delivery not found.");
            if (orderId > 0 && item.OrderId != orderId) throw new AppException(400, "Delivery does not belong to the specified order.");
            orderId = item.OrderId;
        }

        var order = item?.Order ?? await db.Orders.Include(x => x.TrayRentals).FirstOrDefaultAsync(x => x.OrderId == orderId && x.CustomerId == customerId)
            ?? throw new AppException(404, "Order not found.");

        if (order.CustomerId != customerId)
            throw new AppException(404, "Order not found.");

        if (order.OrderStatus is not (OrderStatus.Confirmed or OrderStatus.Preparing))
            throw new AppException(409, "Only confirmed or preparing orders can schedule delivery.");

        var scheduled = request.ScheduledDeliveryAt.ToUniversalTime();
        if (scheduled <= DateTime.UtcNow)
            throw new AppException(400, "Scheduled delivery time must be in the future.");

        if (order.OrderType == OrderType.TrayRental && order.TrayRentals.Count > 0)
        {
            var harvest = order.TrayRentals.Select(x => x.ActualHarvestDate ?? x.ExpectedHarvestDate).Max();
            if (scheduled < harvest || scheduled > harvest.AddDays(2))
                throw new AppException(400, "Rental delivery must be scheduled from harvest date through two days after harvest.");
        }

        if (item is null)
        {
            if (request.CycleNumber.HasValue)
            {
                item = await db.Deliveries.FirstOrDefaultAsync(x => x.OrderId == orderId && x.CycleNumber == request.CycleNumber.Value);
            }

            if (item is null)
            {
                item = await db.Deliveries
                    .Where(x => x.OrderId == orderId && x.DeliveryStatus != DeliveryStatuses.Delivered)
                    .OrderBy(x => x.CycleNumber)
                    .FirstOrDefaultAsync();
            }

            if (item is null)
            {
                item = await db.Deliveries.FirstOrDefaultAsync(x => x.OrderId == orderId);
            }

            if (item is null)
            {
                item = new Delivery
                {
                    OrderId = orderId,
                    RentalId = order.TrayRentals.Select(x => (int?)x.RentalId).FirstOrDefault(),
                    DeliveryStatus = DeliveryStatuses.Pending
                };
                db.Add(item);
                order.OrderStatus = OrderStatus.Preparing;
            }
        }

        if (item.DeliveryStatus is DeliveryStatuses.Shipping or DeliveryStatuses.Delivered)
            throw new AppException(409, "Delivery can no longer be rescheduled.");

        // Nếu khách cập nhật toạ độ giao hàng: tính lại khoảng cách OSRM, kiểm tra bán kính giao và đồng bộ với Order.
        if (request.ShippingLatitude.HasValue && request.ShippingLongitude.HasValue)
        {
            if (deliveryPricing is not null)
            {
                var quote = await deliveryPricing.QuoteAsync(request.ShippingLatitude, request.ShippingLongitude);
                if (quote.IsOutOfRange && !request.IsAccepted)
                    throw new AppException(422, "Delivery address is outside the farm's delivery radius. Customer acceptance is required.",
                        new { distanceKm = quote.DistanceKm, requiresAcceptance = true });

                order.ShippingLatitude = request.ShippingLatitude;
                order.ShippingLongitude = request.ShippingLongitude;
                order.DeliveryDistanceKm = quote.DistanceKm;
                order.IsAccepted = quote.IsOutOfRange && request.IsAccepted;
            }
            else
            {
                order.ShippingLatitude = request.ShippingLatitude;
                order.ShippingLongitude = request.ShippingLongitude;
            }
        }

        if (!string.IsNullOrWhiteSpace(request.ShippingAddress))
        {
            var trimmedAddress = request.ShippingAddress.Trim();
            item.ShippingAddress = trimmedAddress;
            order.ShippingAddress = trimmedAddress;
        }
        else if (string.IsNullOrWhiteSpace(item.ShippingAddress))
        {
            item.ShippingAddress = (order.ShippingAddress ?? "").Trim();
        }

        item.RecipientName = request.RecipientName.Trim();
        item.RecipientPhone = request.RecipientPhone.Trim();
        item.ScheduledDeliveryAt = scheduled;
        item.Notes = request.Notes?.Trim();

        await db.SaveChangesAsync();
        return await GetCustomerAsync(customerId, item.DeliveryId);
    }

    public async Task<DeliveryResponse> AssignAsync(int id, int shipperId)
    {
        var delivery=await db.Deliveries.FirstOrDefaultAsync(x=>x.DeliveryId==id) ?? throw new AppException(404,"Delivery not found.");
        // Không gán shipper cho delivery đã kết thúc (đã giao xong hoặc đã thất bại).
        if(delivery.DeliveryStatus is DeliveryStatuses.Delivered or DeliveryStatuses.Failed)
            throw new AppException(409,"Cannot assign shipper to a completed or failed delivery.");
        var shipper=await db.Users.FirstOrDefaultAsync(x=>x.UserId==shipperId && x.IsActive && x.Role==RoleNames.Staff)
            ?? throw new AppException(404,"Active staff shipper not found.");
        delivery.ShipperId=shipper.UserId; await db.SaveChangesAsync(); return await GetAsync(id);
    }

    public async Task<DeliveryResponse> UpdateAsync(int id, UpdateDeliveryRequest request)
    {
        var delivery=await db.Deliveries.Include(x=>x.Order).Include(x=>x.Rental).FirstOrDefaultAsync(x=>x.DeliveryId==id)
            ?? throw new AppException(404,"Delivery not found.");
        var target=request.Status.Trim().ToUpperInvariant();

        // Mở transaction để việc chuyển SHIPPING và ghi bút toán SALE là ATOMIC (I6): nếu ghi SALE
        // lỗi thì trạng thái SHIPPING cũng không được commit.
        await using var tx = db.Database.IsRelational()
            ? await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable) : null;

        var movedToShipping=false;
        if (!string.Equals(delivery.DeliveryStatus,target,StringComparison.OrdinalIgnoreCase))
        {
            var allowed=Next.TryGetValue(delivery.DeliveryStatus,out var next) && next==target;
            // Phương án A cho FAILED: cho phép chuyển FAILED trước khi giao thành công; GIỮ NGUYÊN
            // trạng thái đơn và KHÔNG đảo kho (staff xử lý thủ công).
            var failure=target==DeliveryStatuses.Failed && delivery.DeliveryStatus!=DeliveryStatuses.Delivered;
            if (!allowed && !failure) throw new AppException(409,$"Invalid delivery transition: {delivery.DeliveryStatus} -> {target}.");
            delivery.DeliveryStatus=target;
            if (target==DeliveryStatuses.Shipping) { delivery.ShippedAt=DateTime.UtcNow; delivery.Order!.OrderStatus=OrderStatus.Delivering; movedToShipping=true; }
            if (target==DeliveryStatuses.Delivered)
            {
                delivery.DeliveredAt=DateTime.UtcNow;
                // A1: nếu còn chu kỳ (chu kỳ hiện tại < tổng), KHÔNG hoàn thành đơn mà đưa về CONFIRMED
                // để staff bắt đầu chu kỳ kế (next-cycle) rồi tạo delivery mới. Chỉ COMPLETED ở chu kỳ cuối.
                var rental = delivery.Rental;
                var hasMoreCycles = rental is not null && rental.CurrentCycle < rental.TotalCycles;
                delivery.Order!.OrderStatus = hasMoreCycles ? OrderStatus.Confirmed : OrderStatus.Completed;
            }
        }
        if (request.TrackingCode is not null) delivery.TrackingCode=request.TrackingCode.Trim();
        if (request.ActualWeightKg.HasValue) delivery.ActualWeightKg=request.ActualWeightKg;
        if (request.Notes is not null) delivery.Notes=request.Notes.Trim();
        await db.SaveChangesAsync();
        // Ghi SALE trong CÙNG transaction với việc chuyển SHIPPING.
        if(movedToShipping&&inventory is not null)await inventory.RecordSaleAsync(delivery.OrderId);
        if(tx is not null)await tx.CommitAsync();

        if(notifications is not null&&delivery.Order is not null)await notifications.SendDomainAsync(delivery.Order.CustomerId,
            "Cập nhật giao hàng",$"Đơn {delivery.Order.OrderCode}: {delivery.DeliveryStatus}.",NotificationTypes.Delivery,
            delivery.DeliveryId,$"DELIVERY:{delivery.DeliveryId}:{delivery.DeliveryStatus}");
        return await GetAsync(id);
    }

    private IQueryable<Delivery> Query()=>db.Deliveries.AsNoTracking().Include(x=>x.Order).Include(x=>x.Shipper);
    private static DeliveryResponse ToDto(Delivery x)=>new()
    {
        DeliveryId=x.DeliveryId,OrderId=x.OrderId,OrderCode=x.Order?.OrderCode??"",RentalId=x.RentalId,CycleNumber=x.CycleNumber,
        ShipperId=x.ShipperId,ShipperName=x.Shipper?.FullName,RecipientName=x.RecipientName,RecipientPhone=x.RecipientPhone,
        ShippingAddress=x.ShippingAddress,ScheduledDeliveryAt=x.ScheduledDeliveryAt,TrackingCode=x.TrackingCode,ActualWeightKg=x.ActualWeightKg,Status=x.DeliveryStatus,
        ShippedAt=x.ShippedAt,DeliveredAt=x.DeliveredAt,Notes=x.Notes
    };
}
