using System.ComponentModel.DataAnnotations;

namespace SmartFarm.Services.Models;

public record FarmZoneRequest([Required,MaxLength(100)]string ZoneName,[MaxLength(255)]string? LocationDescription,[Range(1,int.MaxValue)]int TotalCapacity,bool IsActive=true);
public record FarmRackRequest([Range(1,int.MaxValue)]int ZoneId,[Required,MaxLength(50)]string RackCode,[Range(1,100)]int TotalTiers,[Range(1,1000)]int MaxTraysPerTier);
public record SoilTrayRequest([Range(1,int.MaxValue)]int RackId,[Required,MaxLength(50)]string TrayCode,[Range(1,100)]int TierIndex,[Required] string CurrentStatus);
public record TrayStatusRequest([Required]string Status);
public record TrayLocationRequest([Range(1,int.MaxValue)]int RackId,[Range(1,100)]int TierIndex);

public record SupplyRequest([Required,MaxLength(100)]string SupplyName,[Required]string SupplyType,string? Description,[Range(0,10000)]int HarvestDays,string? ImageUrl,[Range(0,double.MaxValue)]decimal CostPrice,[Range(0,double.MaxValue)]decimal UnitPrice,[Range(0,double.MaxValue)]decimal RentalPrice,[Range(0,int.MaxValue)]int QuantityInStock,[Required,MaxLength(30)]string Unit,[Range(0,int.MaxValue)]int MinStockLevel,bool IsActive=true);
public record CropThresholdRequest([Range(1,int.MaxValue)]int SupplyId,[Required]string Stage,float MinSoilMoisture,float MaxSoilMoisture,float MinAirHumidity,float MaxAirHumidity,float MinTemperature,float MaxTemperature,float MinLightIntensity,float MaxLightIntensity,[Range(0,24)]int LightHoursPerDay);
public record CareScheduleRequest([Range(1,int.MaxValue)]int SupplyId,[Range(0,1000)]int DayIndex,[Required,MaxLength(150)]string TaskName,string? TaskDescription,[Required]string TargetStage);

public record StartGrowingCycleRequest([Range(1,int.MaxValue)]int CustomerId,[Range(1,int.MaxValue)]int SoilTrayId,[Range(1,int.MaxValue)]int SupplyId,[Range(1,int.MaxValue)]int OrderId,DateTime? StartDate);
public record CropStatusRequest([Required]string Status);
public record HarvestRequest(DateTime? ActualHarvestDate);
public record AssignTaskRequest(int? AssignedUserId);
public record CompleteTaskRequest([Required]string Status,[MaxLength(500)]string? Notes);

// Kết quả chu kỳ trồng: kèm thông tin chu kỳ hiện tại/tổng và còn chu kỳ kế tiếp không (cho FE hiện nút "Bắt đầu chu kỳ mới").
public record GrowingCycleResponse(int RentalId, int SoilTrayId, int SupplyId, string CropStatus,
    DateTime StartDate, DateTime ExpectedHarvestDate, DateTime? ActualHarvestDate,
    int CurrentCycle, int TotalCycles, bool HasNextCycle);

// ---- Response DTO (tránh trả entity thô gây vòng lặp navigation / lộ field cho FE) ----
public record FarmZoneResponse(int ZoneId, string ZoneName, string? LocationDescription, int TotalCapacity, bool IsActive);
public record FarmRackResponse(int RackId, int ZoneId, string? ZoneName, string RackCode, int TotalTiers, int MaxTraysPerTier);
public record SoilTrayResponse(int SoilTrayId, int RackId, string? RackCode, string TrayCode, int TierIndex, string CurrentStatus);
public record SupplyResponse(int SupplyId, string SupplyName, string SupplyType, string? Description, int HarvestDays, string? ImageUrl, decimal CostPrice, decimal UnitPrice, decimal RentalPrice, int QuantityInStock, string Unit, int MinStockLevel, bool IsActive, string? RiskDescription, string? ExpectedYield);
public record CropThresholdResponse(int ThresholdId, int SupplyId, string Stage, float? MinSoilMoisture, float? MaxSoilMoisture, float MinAirHumidity, float MaxAirHumidity, float MinTemperature, float MaxTemperature, float MinLightIntensity, float MaxLightIntensity, int LightHoursPerDay);
public record CareScheduleResponse(int ScheduleId, int SupplyId, int DayIndex, string TaskName, string? TaskDescription, string TargetStage);
public record DailyTaskResponse(int TaskId, int RentalId, int? AssignedUserId, string TaskName, DateTime DueDate, string Status, DateTime? CompletedAt, string? Notes);
