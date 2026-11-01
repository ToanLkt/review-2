using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;

namespace SmartFarm.Services.Services;

public interface ICatalogService
{
    Task<PagedResponse<object>> SeedVarietiesAsync(QueryRequest request);
    Task<SeedVarietyResponse> SeedVarietyAsync(int id);
    Task<PagedResponse<object>> AvailableTraysAsync(QueryRequest request, int? farmAreaId);
    Task<int> AvailableTrayCountAsync(int? farmAreaId);
    Task<List<object>> FarmAreasAsync();
}

public sealed class CatalogService(IUnitOfWork unit) : ICatalogService
{
    public async Task<PagedResponse<object>> SeedVarietiesAsync(QueryRequest request)
    {
        var query = unit.Supplies.Query(false).Where(s => s.IsActive && s.SupplyType == SupplyType.Seed);
        if (!string.IsNullOrWhiteSpace(request.Search)) query = query.Where(s => s.SupplyName.Contains(request.Search));
        query = request.Sort?.ToLowerInvariant() switch
        {
            "name" => query.OrderBy(s => s.SupplyName), "-name" => query.OrderByDescending(s => s.SupplyName),
            "price" => query.OrderBy(s => s.RentalPrice), "-price" => query.OrderByDescending(s => s.RentalPrice),
            _ => query.OrderBy(s => s.SupplyId)
        };
        var (page, size) = QueryHelper.Paging(request); var total = await query.CountAsync();
        var rows = await query.Skip((page - 1) * size).Take(size).ToListAsync();
        var traySize = await StandardTraySizeAsync();
        var items = rows.Select(s => QueryHelper.SelectFields(new SeedVarietyResponse(s.SupplyId, s.SupplyName,
            s.Description, s.HarvestDays, s.RentalPrice, s.RiskDescription, s.ExpectedYield, traySize, s.UnitPrice), request.Fields)).ToList();
        return new(items, page, size, total);
    }

    public async Task<SeedVarietyResponse> SeedVarietyAsync(int id)
    {
        var s = await unit.Supplies.Query(false).FirstOrDefaultAsync(x => x.SupplyId == id && x.IsActive && x.SupplyType == SupplyType.Seed)
            ?? throw new AppException(404, "Seed variety not found.");
        return new(s.SupplyId, s.SupplyName, s.Description, s.HarvestDays, s.RentalPrice,
            s.RiskDescription, s.ExpectedYield, await StandardTraySizeAsync(), s.UnitPrice);
    }

    // Kích thước khay chuẩn lấy từ cấu hình trang trại để hiển thị kèm giống cho khách.
    private async Task<string?> StandardTraySizeAsync() =>
        (await unit.FarmConfigs.Query(false).OrderBy(c => c.ConfigId).FirstOrDefaultAsync())?.StandardTraySize;

    public async Task<PagedResponse<object>> AvailableTraysAsync(QueryRequest request, int? farmAreaId)
    {
        var query = unit.SoilTrays.Query(false).Include(t => t.Rack).ThenInclude(r => r!.Zone)
            .Where(t => t.CurrentStatus == TrayStatus.Available);
        if (farmAreaId.HasValue) query = query.Where(t => t.Rack!.ZoneId == farmAreaId);
        if (!string.IsNullOrWhiteSpace(request.Search)) query = query.Where(t => t.TrayCode.Contains(request.Search));
        query = request.Sort == "-code" ? query.OrderByDescending(t => t.TrayCode) : query.OrderBy(t => t.TrayCode);
        var (page, size) = QueryHelper.Paging(request); var total = await query.CountAsync();
        var rows = await query.Skip((page - 1) * size).Take(size).ToListAsync();
        var expandArea = request.Expand?.Split(',').Contains("farmArea", StringComparer.OrdinalIgnoreCase) == true;
        var items = rows.Select(t => QueryHelper.SelectFields(new
        {
            t.SoilTrayId, Code=t.TrayCode, Status = t.CurrentStatus, FarmAreaId=t.Rack!.ZoneId,
            FarmArea = expandArea ? new { FarmAreaId=t.Rack.ZoneId, Name=t.Rack.Zone!.ZoneName, Description=t.Rack.Zone.LocationDescription } : null
        }, request.Fields)).ToList();
        return new(items, page, size, total);
    }

    public Task<int> AvailableTrayCountAsync(int? farmAreaId)
    {
        var query = unit.SoilTrays.Query(false).Where(t => t.CurrentStatus == TrayStatus.Available);
        if (farmAreaId.HasValue) query = query.Where(t => t.Rack!.ZoneId == farmAreaId);
        return query.CountAsync();
    }

    // Danh sách khu vực trồng cho Customer: chỉ zone đang hoạt động, kèm thống kê sức chứa/khay trống.
    public async Task<List<object>> FarmAreasAsync() => await unit.FarmZones.Query(false)
        .Where(z => z.IsActive).OrderBy(z => z.ZoneName)
        .Select(z => (object)new
        {
            FarmAreaId = z.ZoneId,
            Name = z.ZoneName,
            Description = z.LocationDescription,
            TotalCapacity = z.TotalCapacity,
            TotalTrays = z.FarmRacks.SelectMany(r => r.SoilTrays).Count(),
            AvailableTrays = z.FarmRacks.SelectMany(r => r.SoilTrays).Count(t => t.CurrentStatus == TrayStatus.Available)
        }).ToListAsync();
}
