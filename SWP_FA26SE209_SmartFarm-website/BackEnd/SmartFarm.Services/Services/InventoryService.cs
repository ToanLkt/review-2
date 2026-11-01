using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;

namespace SmartFarm.Services.Services;

public sealed class InventoryService(AppDbContext db)
{
    private static readonly string[] ReservedStatuses=[OrderStatus.AwaitingPayment,OrderStatus.Confirmed,OrderStatus.Preparing];

    public async Task<PagedResponse<object>> BalancesAsync(QueryRequest request,string? supplyType,bool? lowStock)
    {
        var query=db.Supplies.AsNoTracking().Where(x=>x.IsActive);
        if(!string.IsNullOrWhiteSpace(supplyType)){var type=supplyType.Trim().ToUpperInvariant();if(!SupplyType.All.Contains(type))throw new AppException(400,"Invalid supply type.");query=query.Where(x=>x.SupplyType==type);}
        if(!string.IsNullOrWhiteSpace(request.Search))query=query.Where(x=>x.SupplyName.Contains(request.Search));
        var supplies=await query.OrderBy(x=>x.SupplyName).ToListAsync();var ids=supplies.Select(x=>x.SupplyId).ToList();var now=DateTime.UtcNow;
        var reserved=await db.OrderItems.AsNoTracking().Where(x=>ids.Contains(x.SupplyId)&&x.ItemType==OrderType.SeedPacket&&x.Order!=null&&ReservedStatuses.Contains(x.Order.OrderStatus)&&(x.Order.OrderStatus!=OrderStatus.AwaitingPayment||x.Order.ExpiresAt>now)).GroupBy(x=>x.SupplyId).Select(g=>new{SupplyId=g.Key,Quantity=g.Sum(x=>x.Quantity)}).ToDictionaryAsync(x=>x.SupplyId,x=>x.Quantity);
        var rows=supplies.Select(x=>{var held=reserved.GetValueOrDefault(x.SupplyId);var available=x.QuantityInStock;return new InventoryBalanceResponse(x.SupplyId,x.SupplyName,x.SupplyType,x.Unit,available+held,held,available,x.MinStockLevel,available<=x.MinStockLevel);}).Where(x=>!lowStock.HasValue||x.IsLowStock==lowStock).ToList();
        var(page,size)=QueryHelper.Paging(request);return new(rows.Skip((page-1)*size).Take(size).Cast<object>().ToList(),page,size,rows.Count);
    }

    public async Task<InventoryBalanceResponse> BalanceAsync(int supplyId)=>(await BalancesAsync(new QueryRequest(null,null,1,1000),null,null)).Items.Cast<InventoryBalanceResponse>().FirstOrDefault(x=>x.SupplyId==supplyId)??throw new AppException(404,"Supply not found.");

    public Task<MaterialMovementResponse> ReceiveAsync(int supplyId,int userId,InventoryAdjustmentRequest request)=>AdjustAsync(supplyId,userId,request,MaterialMovementTypes.Receipt,1);
    public Task<MaterialMovementResponse> UseAsync(int supplyId,int userId,InventoryAdjustmentRequest request)=>AdjustAsync(supplyId,userId,request,MaterialMovementTypes.ManualUsage,-1);

    private async Task<MaterialMovementResponse> AdjustAsync(int supplyId,int userId,InventoryAdjustmentRequest request,string type,int direction)
    {
        if(request.Quantity<=0)throw new AppException(400,"Quantity must be greater than zero.");if(string.IsNullOrWhiteSpace(request.Reason))throw new AppException(400,"Reason is required.");
        var supply=await db.Supplies.FindAsync(supplyId)??throw new AppException(404,"Supply not found.");if(!supply.IsActive)throw new AppException(409,"Inactive supply cannot be adjusted.");
        if(direction<0&&supply.QuantityInStock<request.Quantity)throw new AppException(409,"Insufficient available stock.",new{available=supply.QuantityInStock});
        supply.QuantityInStock+=direction*request.Quantity;var movement=new MaterialMovement{SupplyId=supplyId,MovementType=type,Quantity=direction*request.Quantity,BalanceAfter=supply.QuantityInStock,Reason=request.Reason.Trim(),CreatedByUserId=userId};db.Add(movement);await db.SaveChangesAsync();await RefreshLowStockAlertAsync(supplyId);return ToDto(movement,supply.SupplyName);
    }

    public async Task<PagedResponse<object>> MovementsAsync(QueryRequest request,int? supplyId,string? type,DateTime? from,DateTime? to)
    {
        if(from.HasValue&&to.HasValue&&from>to)throw new AppException(400,"From must be before to.");var query=db.MaterialMovements.AsNoTracking().Include(x=>x.Supply).AsQueryable();
        if(supplyId.HasValue)query=query.Where(x=>x.SupplyId==supplyId);if(!string.IsNullOrWhiteSpace(type)){var normalized=type.Trim().ToUpperInvariant();if(!MaterialMovementTypes.All.Contains(normalized))throw new AppException(400,"Invalid movement type.");query=query.Where(x=>x.MovementType==normalized);}if(from.HasValue)query=query.Where(x=>x.CreatedAt>=from.Value.ToUniversalTime());if(to.HasValue)query=query.Where(x=>x.CreatedAt<=to.Value.ToUniversalTime());
        var(page,size)=QueryHelper.Paging(request);var total=await query.CountAsync();var rows=await query.OrderByDescending(x=>x.CreatedAt).Skip((page-1)*size).Take(size).ToListAsync();return new(rows.Select(x=>(object)ToDto(x,x.Supply?.SupplyName??"")).ToList(),page,size,total);
    }
    public async Task RecordSaleAsync(int orderId)
    {
        var order=await db.Orders.Include(x=>x.Items).ThenInclude(x=>x.Supply).FirstOrDefaultAsync(x=>x.OrderId==orderId)??throw new AppException(404,"Order not found.");if(order.OrderType!=OrderType.SeedPacket)return;
        foreach(var item in order.Items){if(await db.MaterialMovements.AnyAsync(x=>x.OrderId==orderId&&x.SupplyId==item.SupplyId&&x.MovementType==MaterialMovementTypes.Sale))continue;db.Add(new MaterialMovement{SupplyId=item.SupplyId,OrderId=orderId,MovementType=MaterialMovementTypes.Sale,Quantity=-item.Quantity,BalanceAfter=item.Supply!.QuantityInStock,Reason=$"Xuất kho cho đơn {order.OrderCode}"});}await db.SaveChangesAsync();foreach(var supplyId in order.Items.Select(x=>x.SupplyId).Distinct())await RefreshLowStockAlertAsync(supplyId);
    }
    public async Task RefreshLowStockAlertAsync(int supplyId)
    {
        var supply=await db.Supplies.FindAsync(supplyId)??throw new AppException(404,"Supply not found.");var active=await db.SystemAlerts.FirstOrDefaultAsync(x=>x.SupplyId==supplyId&&x.AlertType=="LOW_STOCK"&&!x.IsResolved);if(supply.QuantityInStock<=supply.MinStockLevel){var message=$"Tồn khả dụng {supply.SupplyName} còn {supply.QuantityInStock} {supply.Unit}, ngưỡng {supply.MinStockLevel}.";if(active is null)db.Add(new SystemAlert{SupplyId=supplyId,AlertType="LOW_STOCK",Severity="WARNING",Message=message});else{active.Message=message;active.CreatedAt=DateTime.UtcNow;}}else if(active is not null)active.IsResolved=true;await db.SaveChangesAsync();
    }
    public async Task<List<InventoryReconciliationResponse>> ReconcileAsync(int? supplyId)
    {
        // Mô hình tồn kho: QuantityInStock được TRỪ ngay khi đặt đơn SEED_PACKET (reservation),
        // còn movement SALE chỉ là BÚT TOÁN GHI SỔ "đã bán" (không trừ tồn lần hai). Vì vậy khi đối
        // soát phải LOẠI SALE khỏi công thức, chỉ cộng RECEIPT (+) và MANUAL_USAGE (-); nếu tính cả
        // SALE sẽ trừ hai lần và luôn báo lệch sai.
        var supplies=await db.Supplies.AsNoTracking().Where(x=>!supplyId.HasValue||x.SupplyId==supplyId).OrderBy(x=>x.SupplyName).ToListAsync();
        var result=new List<InventoryReconciliationResponse>();
        foreach(var supply in supplies)
        {
            var movements=await db.MaterialMovements.AsNoTracking().Where(x=>x.SupplyId==supply.SupplyId).OrderBy(x=>x.MovementId).ToListAsync();
            if(movements.Count==0){result.Add(new(supply.SupplyId,supply.SupplyName,supply.QuantityInStock,null,0,supply.QuantityInStock,0,true,"NO_MOVEMENTS"));continue;}
            var stockMovements=movements.Where(x=>x.MovementType!=MaterialMovementTypes.Sale).ToList();
            // Opening = số dư trước biến động ảnh hưởng tồn đầu tiên (bỏ qua SALE). Nếu chỉ có SALE
            // thì không có biến động nào ảnh hưởng tồn qua công thức này -> opening = tồn hiện tại.
            var opening=stockMovements.Count>0?stockMovements[0].BalanceAfter-stockMovements[0].Quantity:supply.QuantityInStock;
            var net=stockMovements.Sum(x=>x.Quantity);
            var expected=opening+net;
            var difference=supply.QuantityInStock-expected;
            result.Add(new(supply.SupplyId,supply.SupplyName,supply.QuantityInStock,opening,net,expected,difference,difference==0,difference==0?"RECONCILED":"MISMATCH"));
        }
        return result;
    }
    private static MaterialMovementResponse ToDto(MaterialMovement x,string name)=>new(x.MovementId,x.SupplyId,name,x.MovementType,x.Quantity,x.BalanceAfter,x.Reason,x.OrderId,x.CreatedByUserId,x.CreatedAt);
}
