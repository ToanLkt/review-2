namespace SmartFarm.Services.Models;

public record RevenueReportResponse(DateTime? From,DateTime? To,decimal TotalRevenue,int SuccessfulPayments,int TotalOrders,IReadOnlyDictionary<string,decimal> RevenueByOrderType,IReadOnlyDictionary<string,int> OrdersByStatus);
public record HarvestReportResponse(DateTime? From,DateTime? To,int TotalCycles,int HarvestedCycles,int FailedCycles,double CompletionRate,IReadOnlyList<HarvestSupplySummary> BySupply);
public record HarvestSupplySummary(int SupplyId,string SupplyName,int TotalCycles,int HarvestedCycles);
public record InventoryReportResponse(int TotalSupplies,int LowStockSupplies,int TotalOnHand,int TotalReserved,int TotalAvailable,IReadOnlyDictionary<string,int> AvailableBySupplyType);
