using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;

namespace SmartFarm.Services.Services;

public sealed class FarmConfigService(AppDbContext db)
{
    // Luôn làm việc với 1 bản ghi cố định; nếu DB chưa seed thì tự tạo mặc định.
    private async Task<FarmConfig> GetOrCreateAsync()
    {
        var config = await db.FarmConfigs.OrderBy(x => x.ConfigId).FirstOrDefaultAsync();
        if (config is null)
        {
            config = new FarmConfig { UpdatedAt = DateTime.UtcNow };
            db.FarmConfigs.Add(config);
            await db.SaveChangesAsync();
        }
        return config;
    }

    public async Task<FarmConfigResponse> GetAsync() => ToDto(await GetOrCreateAsync());

    // Thông tin công khai cho khách (không lộ tài khoản ngân hàng & ngưỡng ưu đãi nội bộ).
    public async Task<PublicFarmInfoResponse> PublicInfoAsync()
    {
        var c = await GetOrCreateAsync();
        return new PublicFarmInfoResponse(c.FarmName, c.MaxPreOrderDays, c.StandardTraySize, c.MaxDeliveryRadiusKm);
    }

    public async Task<FarmConfigResponse> UpdateAsync(UpdateFarmConfigRequest r)
    {
        if (r.StandardDiscountPercent is < 0 or > 100 || r.LoyalDiscountPercent is < 0 or > 100)
            throw new AppException(400, "Discount percent must be between 0 and 100.");
        var config = await GetOrCreateAsync();
        config.FarmName = r.FarmName.Trim();
        config.MaxPreOrderDays = r.MaxPreOrderDays;
        config.StandardTraySize = r.StandardTraySize.Trim();
        config.MaxDeliveryRadiusKm = r.MaxDeliveryRadiusKm;
        config.DiscountCycleThreshold = r.DiscountCycleThreshold;
        config.DiscountTrayThreshold = r.DiscountTrayThreshold;
        config.LoyalOrderThreshold = r.LoyalOrderThreshold;
        config.StandardDiscountPercent = r.StandardDiscountPercent;
        config.LoyalDiscountPercent = r.LoyalDiscountPercent;
        config.BankAccountNumber = r.BankAccountNumber?.Trim();
        config.BankName = r.BankName?.Trim();
        config.BankOwnerName = r.BankOwnerName?.Trim();
        // Toạ độ trang trại (điểm xuất phát tính khoảng cách giao hàng). Chỉ cập nhật khi được cung cấp.
        if (r.FarmLatitude.HasValue) config.FarmLatitude = r.FarmLatitude;
        if (r.FarmLongitude.HasValue) config.FarmLongitude = r.FarmLongitude;
        config.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return ToDto(config);
    }

    private static FarmConfigResponse ToDto(FarmConfig c) => new(c.ConfigId, c.FarmName, c.MaxPreOrderDays,
        c.StandardTraySize, c.MaxDeliveryRadiusKm, c.DiscountCycleThreshold, c.DiscountTrayThreshold,
        c.LoyalOrderThreshold, c.StandardDiscountPercent, c.LoyalDiscountPercent, c.BankAccountNumber,
        c.BankName, c.BankOwnerName, c.UpdatedAt, c.FarmLatitude, c.FarmLongitude);
}
