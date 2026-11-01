using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;
using Xunit;

namespace SmartFarm.Repositories.Tests;

public class FarmConfigServiceTests
{
    private static AppDbContext Context() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Get_creates_default_config_when_missing()
    {
        await using var db = Context();
        var service = new FarmConfigService(db);

        var config = await service.GetAsync();

        Assert.Equal(1, await db.FarmConfigs.CountAsync());
        Assert.Equal("SmartFarm", config.FarmName);
        Assert.Equal(7, config.MaxPreOrderDays);
    }

    [Fact]
    public async Task Update_persists_values_and_keeps_single_record()
    {
        await using var db = Context();
        var service = new FarmConfigService(db);
        await service.GetAsync(); // tạo bản ghi mặc định

        var updated = await service.UpdateAsync(new UpdateFarmConfigRequest(
            "Trang trại A", 45, "40x30x5 cm", 15.0f, 2, 4, 6, 12.5m, 20.0m,
            "99988877", "MBBank", "NGUYEN VAN A"));

        Assert.Equal("Trang trại A", updated.FarmName);
        Assert.Equal(45, updated.MaxPreOrderDays);
        Assert.Equal("40x30x5 cm", updated.StandardTraySize);
        Assert.Equal(20.0m, updated.LoyalDiscountPercent);
        Assert.NotNull(updated.UpdatedAt);
        Assert.Equal(1, await db.FarmConfigs.CountAsync()); // vẫn chỉ 1 bản ghi
    }

    [Fact]
    public async Task Public_info_hides_bank_and_discount_fields()
    {
        await using var db = Context();
        var service = new FarmConfigService(db);
        await service.UpdateAsync(new UpdateFarmConfigRequest(
            "Farm Z", 20, "32x24x4 cm", 10.0f, 3, 3, 5, 10m, 15m, "123", "VCB", "OWNER"));

        var info = await service.PublicInfoAsync();

        Assert.Equal("Farm Z", info.FarmName);
        Assert.Equal(20, info.MaxPreOrderDays);
        Assert.Equal("32x24x4 cm", info.StandardTraySize);
        // PublicFarmInfoResponse không có trường ngân hàng/giảm giá -> đảm bảo không lộ (compile-time).
    }
}
