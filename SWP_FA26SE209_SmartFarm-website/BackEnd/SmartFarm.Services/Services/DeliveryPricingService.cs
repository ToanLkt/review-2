using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Services.Models;

namespace SmartFarm.Services.Services;

// Kết quả tính toán giao hàng cho một đơn: khoảng cách (km) và cờ vượt bán kính giao.
// IsOutOfRange = true khi khoảng cách > MaxDeliveryRadiusKm: lúc này khách phải tick đồng ý (IsAccepted) mới được tạo đơn.
public readonly record struct DeliveryQuote(double? DistanceKm, bool IsOutOfRange);

// Kết quả preview cho FE TRƯỚC khi tạo đơn: khoảng cách, bán kính giao tối đa, và có cần khách tick đồng ý không.
// DistanceKm null = chưa tính được (farm chưa có toạ độ / OSRM tắt); FE vẫn cho đặt, không chặn.
public record DeliveryPreviewResponse(double? DistanceKm, double MaxRadiusKm, bool IsOutOfRange, bool RequiresAcceptance);

// Dịch vụ dùng chung cho cả luồng mua gói hạt và thuê khay: tính khoảng cách giao hàng (OSRM)
// từ toạ độ trang trại tới toạ độ khách và kiểm tra bán kính giao.
public sealed class DeliveryPricingService(AppDbContext db, IRoutingService? routing = null)
{
    // Tính khoảng cách giao hàng. Toạ độ nhận hàng là BẮT BUỘC: thiếu toạ độ -> chặn tạo đơn (400).
    // Nếu farm chưa cấu hình toạ độ hoặc OSRM tạm lỗi/tắt, trả khoảng cách null, IsOutOfRange=false
    // (sự cố hạ tầng không chặn khách đặt hàng), nhưng khách vẫn phải khai báo điểm nhận hàng.
    // Khi khoảng cách > MaxDeliveryRadiusKm, đặt IsOutOfRange=true (service gọi tự quyết định có cho tạo đơn
    // dựa trên việc khách đã tick đồng ý hay chưa) chứ KHÔNG ném lỗi tại đây.
    public async Task<DeliveryQuote> QuoteAsync(double? shippingLat, double? shippingLng)
    {
        if (shippingLat is null || shippingLng is null)
            throw new AppException(400, "Shipping coordinates are required to create the order.");

        if (routing is null)
            return new DeliveryQuote(null, false);

        var farm = await db.FarmConfigs.AsNoTracking().OrderBy(x => x.ConfigId).FirstOrDefaultAsync();
        if (farm?.FarmLatitude is null || farm.FarmLongitude is null)
            return new DeliveryQuote(null, false);

        var distanceKm = await routing.GetDistanceKmAsync(
            farm.FarmLatitude.Value, farm.FarmLongitude.Value, shippingLat.Value, shippingLng.Value);
        if (distanceKm is null) return new DeliveryQuote(null, false);

        var isOutOfRange = farm.MaxDeliveryRadiusKm > 0 && distanceKm.Value > farm.MaxDeliveryRadiusKm;
        return new DeliveryQuote(distanceKm, isOutOfRange);
    }

    // Preview cho FE trước checkout: KHÔNG tạo order, chỉ tính khoảng cách + bán kính + cờ cần đồng ý.
    public async Task<DeliveryPreviewResponse> PreviewAsync(double? shippingLat, double? shippingLng)
    {
        var quote = await QuoteAsync(shippingLat, shippingLng);
        var farm = await db.FarmConfigs.AsNoTracking().OrderBy(x => x.ConfigId).FirstOrDefaultAsync();
        var maxRadius = farm?.MaxDeliveryRadiusKm ?? 0;
        return new DeliveryPreviewResponse(quote.DistanceKm, maxRadius, quote.IsOutOfRange, quote.IsOutOfRange);
    }
}
