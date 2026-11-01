using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;

namespace SmartFarm.Services.Services;

public sealed class ReportingService(AppDbContext db,InventoryService inventory)
{
    public async Task<RevenueReportResponse> RevenueAsync(DateTime? from,DateTime? to)
    {
        ValidateRange(from,to);var payments=db.Payments.AsNoTracking().Include(x=>x.Order).Where(x=>x.PaymentStatus==PaymentStatuses.Success&&x.PaidAt.HasValue);if(from.HasValue)payments=payments.Where(x=>x.PaidAt>=from.Value.ToUniversalTime());if(to.HasValue)payments=payments.Where(x=>x.PaidAt<=to.Value.ToUniversalTime());var rows=await payments.ToListAsync();
        var orders=db.Orders.AsNoTracking().AsQueryable();if(from.HasValue)orders=orders.Where(x=>x.CreatedAt>=from.Value.ToUniversalTime());if(to.HasValue)orders=orders.Where(x=>x.CreatedAt<=to.Value.ToUniversalTime());var orderRows=await orders.ToListAsync();return new(from?.ToUniversalTime(),to?.ToUniversalTime(),rows.Sum(x=>x.AmountPaid),rows.Count,orderRows.Count,rows.GroupBy(x=>x.Order?.OrderType??"UNKNOWN").ToDictionary(g=>g.Key,g=>g.Sum(x=>x.AmountPaid)),orderRows.GroupBy(x=>x.OrderStatus).ToDictionary(g=>g.Key,g=>g.Count()));
    }
    public async Task<HarvestReportResponse> HarvestAsync(DateTime? from,DateTime? to)
    {
        ValidateRange(from,to);var query=db.TrayRentals.AsNoTracking().Include(x=>x.Supply).AsQueryable();if(from.HasValue)query=query.Where(x=>x.StartDate>=from.Value.ToUniversalTime());if(to.HasValue)query=query.Where(x=>x.StartDate<=to.Value.ToUniversalTime());var rows=await query.ToListAsync();var harvested=rows.Count(x=>x.CropStatus==CropStatus.Harvested);return new(from?.ToUniversalTime(),to?.ToUniversalTime(),rows.Count,harvested,rows.Count(x=>x.CropStatus==CropStatus.Failed),rows.Count==0?0:Math.Round(harvested*100d/rows.Count,2),rows.GroupBy(x=>new{x.SupplyId,Name=x.Supply?.SupplyName??""}).Select(g=>new HarvestSupplySummary(g.Key.SupplyId,g.Key.Name,g.Count(),g.Count(x=>x.CropStatus==CropStatus.Harvested))).OrderBy(x=>x.SupplyName).ToList());
    }
    public async Task<InventoryReportResponse> InventoryAsync()
    {
        var result=await inventory.BalancesAsync(new QueryRequest(null,null,1,200),null,null);var rows=result.Items.Cast<InventoryBalanceResponse>().ToList();return new(rows.Count,rows.Count(x=>x.IsLowStock),rows.Sum(x=>x.OnHand),rows.Sum(x=>x.Reserved),rows.Sum(x=>x.Available),rows.GroupBy(x=>x.SupplyType).ToDictionary(g=>g.Key,g=>g.Sum(x=>x.Available)));
    }
    private static void ValidateRange(DateTime? from,DateTime? to){if(from.HasValue&&to.HasValue&&from>to)throw new AppException(400,"From must be before to.");}
}
