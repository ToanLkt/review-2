namespace SmartFarm.Services.Models;

public record InventoryAdjustmentRequest(int Quantity,string Reason);
public record InventoryBalanceResponse(int SupplyId,string SupplyName,string SupplyType,string Unit,int OnHand,int Reserved,int Available,int MinStockLevel,bool IsLowStock);
public record MaterialMovementResponse(long MovementId,int SupplyId,string SupplyName,string MovementType,int Quantity,int BalanceAfter,string Reason,int? OrderId,int? CreatedByUserId,DateTime CreatedAt);
public record InventoryReconciliationResponse(int SupplyId,string SupplyName,int CurrentAvailable,int? OpeningBalance,int MovementNet,int ExpectedAvailable,int Difference,bool IsReconciled,string Status);
