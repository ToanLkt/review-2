using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;

namespace SmartFarm.Services.Services;

public class CultivationService(AppDbContext db,NotificationService? notifications=null)
{
    private static readonly string[] SupplyTypes=[SupplyType.Seed,SupplyType.SoilSubstrate,SupplyType.Packaging,SupplyType.Equipment];
    private static readonly string[] Stages=[GrowthStage.Germination,GrowthStage.Growing,GrowthStage.Harvest];
    private static readonly string[] CropStatuses=[CropStatus.WaitingPlanting,CropStatus.Planted,CropStatus.Germinating,CropStatus.Growing,CropStatus.ReadyToHarvest,CropStatus.Harvested,CropStatus.Failed];

    public async Task<List<SupplyResponse>> SuppliesAsync(string? type,bool? active)=>(await db.Supplies.AsNoTracking().Where(x=>(string.IsNullOrWhiteSpace(type)||x.SupplyType==type.ToUpper())&&(!active.HasValue||x.IsActive==active)).OrderBy(x=>x.SupplyName).ToListAsync()).Select(ToDto).ToList();
    public async Task<SupplyResponse> SupplyAsync(int id)=>ToDto(await FindSupplyAsync(id));
    public async Task<SupplyResponse> CreateSupplyAsync(SupplyRequest r){ValidateSupply(r);if(await db.Supplies.AnyAsync(x=>x.SupplyName==r.SupplyName.Trim()&&x.SupplyType==r.SupplyType.ToUpper()))throw new AppException(409,"Supply already exists.");var x=new Supply();Apply(x,r);db.Add(x);await db.SaveChangesAsync();return ToDto(x);}
    public async Task<SupplyResponse> UpdateSupplyAsync(int id,SupplyRequest r){ValidateSupply(r);var x=await FindSupplyAsync(id);if(await db.Supplies.AnyAsync(y=>y.SupplyId!=id&&y.SupplyName==r.SupplyName.Trim()&&y.SupplyType==r.SupplyType.ToUpper()))throw new AppException(409,"Supply already exists.");Apply(x,r);await db.SaveChangesAsync();return ToDto(x);}
    public async Task DeactivateSupplyAsync(int id){var x=await FindSupplyAsync(id);x.IsActive=false;await db.SaveChangesAsync();}

    public async Task<List<CropThresholdResponse>> ThresholdsAsync(int? supplyId)=>(await db.CropThresholds.AsNoTracking().Where(x=>!supplyId.HasValue||x.SupplyId==supplyId).OrderBy(x=>x.SupplyId).ThenBy(x=>x.Stage).ToListAsync()).Select(ToDto).ToList();
    public async Task<CropThresholdResponse> CreateThresholdAsync(CropThresholdRequest r){await FindSupplyAsync(r.SupplyId);ValidateThreshold(r);if(await db.CropThresholds.AnyAsync(x=>x.SupplyId==r.SupplyId&&x.Stage==r.Stage.ToUpper()))throw new AppException(409,"Threshold for this supply and stage already exists.");var x=new CropThreshold();Apply(x,r);db.Add(x);await db.SaveChangesAsync();return ToDto(x);}
    public async Task<CropThresholdResponse> UpdateThresholdAsync(int id,CropThresholdRequest r){var x=await db.CropThresholds.FindAsync(id)??throw new AppException(404,"Crop threshold not found.");await FindSupplyAsync(r.SupplyId);ValidateThreshold(r);if(await db.CropThresholds.AnyAsync(y=>y.ThresholdId!=id&&y.SupplyId==r.SupplyId&&y.Stage==r.Stage.ToUpper()))throw new AppException(409,"Threshold for this supply and stage already exists.");Apply(x,r);await db.SaveChangesAsync();return ToDto(x);}
    public async Task DeleteThresholdAsync(int id){var x=await db.CropThresholds.FindAsync(id)??throw new AppException(404,"Crop threshold not found.");db.Remove(x);await db.SaveChangesAsync();}

    public async Task<List<CareScheduleResponse>> SchedulesAsync(int? supplyId)=>(await db.CareSchedules.AsNoTracking().Where(x=>!supplyId.HasValue||x.SupplyId==supplyId).OrderBy(x=>x.DayIndex).ToListAsync()).Select(ToDto).ToList();
    public async Task<CareScheduleResponse> CreateScheduleAsync(CareScheduleRequest r){await FindSupplyAsync(r.SupplyId);ValidateStage(r.TargetStage);var x=new CareSchedule();Apply(x,r);db.Add(x);await db.SaveChangesAsync();return ToDto(x);}
    public async Task<CareScheduleResponse> UpdateScheduleAsync(int id,CareScheduleRequest r){var x=await db.CareSchedules.FindAsync(id)??throw new AppException(404,"Care schedule not found.");await FindSupplyAsync(r.SupplyId);ValidateStage(r.TargetStage);Apply(x,r);await db.SaveChangesAsync();return ToDto(x);}
    public async Task DeleteScheduleAsync(int id){var x=await db.CareSchedules.FindAsync(id)??throw new AppException(404,"Care schedule not found.");db.Remove(x);await db.SaveChangesAsync();}

    public async Task<List<GrowingCycleResponse>> CyclesAsync(string? status)=>(await db.TrayRentals.AsNoTracking().Where(x=>string.IsNullOrWhiteSpace(status)||x.CropStatus==status.ToUpper()).OrderByDescending(x=>x.StartDate).ToListAsync()).Select(ToCycleDto).ToList();
    public async Task<GrowingCycleResponse> StartCycleAsync(StartGrowingCycleRequest r){var tray=await db.SoilTrays.FindAsync(r.SoilTrayId)??throw new AppException(404,"Soil tray not found.");if(tray.CurrentStatus!=TrayStatus.Available)throw new AppException(409,"Soil tray is not available.");var supply=await FindSupplyAsync(r.SupplyId);if(supply.SupplyType!=SupplyType.Seed||!supply.IsActive)throw new AppException(400,"Growing cycle requires an active seed supply.");if(!await db.Users.AnyAsync(x=>x.UserId==r.CustomerId&&x.Role==RoleNames.Customer))throw new AppException(404,"Customer not found.");if(!await db.Orders.AnyAsync(x=>x.OrderId==r.OrderId&&x.CustomerId==r.CustomerId))throw new AppException(404,"Customer order not found.");var start=r.StartDate?.ToUniversalTime()??DateTime.UtcNow;var x=new TrayRental{CustomerId=r.CustomerId,SoilTrayId=r.SoilTrayId,SupplyId=r.SupplyId,OrderId=r.OrderId,StartDate=start,ExpectedHarvestDate=start.AddDays(supply.HarvestDays),CropStatus=CropStatus.Planted};db.Add(x);tray.CurrentStatus=TrayStatus.Rented;await db.SaveChangesAsync();return ToCycleDto(x);}
    public async Task<GrowingCycleResponse> UpdateCycleStatusAsync(int id,string status){var x=await db.TrayRentals.FindAsync(id)??throw new AppException(404,"Growing cycle not found.");var normalized=status.ToUpper();if(!CropStatuses.Contains(normalized))throw new AppException(400,"Invalid crop status.");x.CropStatus=normalized;await db.SaveChangesAsync();if(notifications is not null)await notifications.SendDomainAsync(x.CustomerId,"Cập nhật cây trồng",$"Chu kỳ {x.RentalId}: {normalized}.",NotificationTypes.GrowingCycle,x.RentalId,$"GROWING:{x.RentalId}:{normalized}");return ToCycleDto(x);}
    public async Task<GrowingCycleResponse> HarvestAsync(int id,HarvestRequest r){var x=await db.TrayRentals.Include(y=>y.SoilTray).FirstOrDefaultAsync(y=>y.RentalId==id)??throw new AppException(404,"Growing cycle not found.");x.ActualHarvestDate=r.ActualHarvestDate?.ToUniversalTime()??DateTime.UtcNow;x.CropStatus=CropStatus.Harvested;x.SoilTray!.CurrentStatus=TrayStatus.Maintenance;await db.SaveChangesAsync();if(notifications is not null)await notifications.SendDomainAsync(x.CustomerId,"Đã thu hoạch",$"Chu kỳ {x.RentalId} đã thu hoạch.",NotificationTypes.GrowingCycle,x.RentalId,$"GROWING:{x.RentalId}:HARVESTED");return ToCycleDto(x);}

    // Chuyển sang chu kỳ gieo mới (thủ công, sau khi đã thu hoạch). Yêu cầu CropStatus=HARVESTED và còn chu kỳ.
    public async Task<GrowingCycleResponse> NextCycleAsync(int id){
        var x=await db.TrayRentals.Include(y=>y.SoilTray).Include(y=>y.Supply).FirstOrDefaultAsync(y=>y.RentalId==id)??throw new AppException(404,"Growing cycle not found.");
        if(x.CropStatus!=CropStatus.Harvested)throw new AppException(409,"Current cycle must be harvested before starting a new one.");
        if(x.CurrentCycle>=x.TotalCycles)throw new AppException(409,"No remaining cycles for this tray.");
        // A1: chu kỳ hiện tại phải đã GIAO XONG (delivery DELIVERED) mới được bắt đầu chu kỳ kế.
        var currentDelivered=await db.Deliveries.AnyAsync(d=>d.OrderId==x.OrderId&&d.CycleNumber==x.CurrentCycle&&d.DeliveryStatus==DeliveryStatuses.Delivered);
        if(!currentDelivered)throw new AppException(409,"Current cycle must be delivered before starting a new one.");
        var now=DateTime.UtcNow;var harvestDays=x.Supply?.HarvestDays??0;
        x.CurrentCycle+=1;x.CropStatus=CropStatus.Planted;x.StartDate=now;x.ExpectedHarvestDate=now.AddDays(harvestDays);x.ActualHarvestDate=null;
        x.SoilTray!.CurrentStatus=TrayStatus.Rented;
        await db.SaveChangesAsync();
        if(notifications is not null)await notifications.SendDomainAsync(x.CustomerId,"Bắt đầu chu kỳ mới",$"Khay {x.SoilTrayId} chuyển sang chu kỳ {x.CurrentCycle}/{x.TotalCycles}.",NotificationTypes.GrowingCycle,x.RentalId,$"GROWING:{x.RentalId}:CYCLE:{x.CurrentCycle}");
        return ToCycleDto(x);
    }

    // Tự động kích hoạt các khay đang chờ gieo (WAITING_PLANTING) khi đã tới ngày trồng (StartDate <= now) -> PLANTED.
    // ĐIỀU KIỆN: đơn hàng phải đã CONFIRMED (đã thanh toán). Chưa thanh toán thì không được bắt đầu trồng.
    public async Task<int> ActivateDuePlantingsAsync(DateTime now)
    {
        var due=await db.TrayRentals.Where(x=>x.CropStatus==CropStatus.WaitingPlanting&&x.StartDate<=now&&x.Order!=null&&x.Order.OrderStatus==OrderStatus.Confirmed).ToListAsync();
        foreach(var x in due)
        {
            x.CropStatus=CropStatus.Planted;
            if(notifications is not null)await notifications.SendDomainAsync(x.CustomerId,"Bắt đầu gieo trồng",$"Khay {x.SoilTrayId} đã tới ngày trồng và được gieo.",NotificationTypes.GrowingCycle,x.RentalId,$"GROWING:{x.RentalId}:PLANTED");
        }
        if(due.Count>0)await db.SaveChangesAsync();
        return due.Count;
    }

    public async Task<int> GenerateTasksAsync(int rentalId){var rental=await db.TrayRentals.FindAsync(rentalId)??throw new AppException(404,"Growing cycle not found.");var schedules=await db.CareSchedules.AsNoTracking().Where(x=>x.SupplyId==rental.SupplyId).ToListAsync();var existing=await db.DailyTasks.Where(x=>x.RentalId==rentalId).Select(x=>new{x.TaskName,x.DueDate}).ToListAsync();var created=0;foreach(var s in schedules){var due=rental.StartDate.Date.AddDays(s.DayIndex);if(existing.Any(x=>x.TaskName==s.TaskName&&x.DueDate.Date==due))continue;db.DailyTasks.Add(new DailyTask{RentalId=rentalId,TaskName=s.TaskName,DueDate=due,Status=DailyTaskStatus.Pending});created++;}await db.SaveChangesAsync();return created;}
    public async Task<List<DailyTaskResponse>> TasksAsync(int? rentalId,string? status)=>(await db.DailyTasks.AsNoTracking().Where(x=>(!rentalId.HasValue||x.RentalId==rentalId)&&(string.IsNullOrWhiteSpace(status)||x.Status==status.ToUpper())).OrderBy(x=>x.DueDate).ToListAsync()).Select(ToDto).ToList();
    public async Task<DailyTaskResponse> AssignTaskAsync(int id,int? userId){var x=await db.DailyTasks.FindAsync(id)??throw new AppException(404,"Daily task not found.");if(userId.HasValue&&!await db.Users.AnyAsync(u=>u.UserId==userId&&u.Role==RoleNames.Staff&&u.IsActive))throw new AppException(404,"Active staff user not found.");x.AssignedUserId=userId;await db.SaveChangesAsync();return ToDto(x);}
    public async Task<DailyTaskResponse> CompleteTaskAsync(int id,CompleteTaskRequest r){var x=await db.DailyTasks.FindAsync(id)??throw new AppException(404,"Daily task not found.");var status=r.Status.ToUpper();if(status is not (DailyTaskStatus.Completed or DailyTaskStatus.Skipped))throw new AppException(400,"Task status must be COMPLETED or SKIPPED.");x.Status=status;x.Notes=r.Notes;x.CompletedAt=DateTime.UtcNow;await db.SaveChangesAsync();return ToDto(x);}

    // Helper nội bộ: trả entity Supply để validate/cập nhật. Không expose entity ra controller.
    private async Task<Supply> FindSupplyAsync(int id)=>await db.Supplies.FindAsync(id)??throw new AppException(404,"Supply not found.");

    private static GrowingCycleResponse ToCycleDto(TrayRental x)=>new(x.RentalId,x.SoilTrayId,x.SupplyId,x.CropStatus,x.StartDate,x.ExpectedHarvestDate,x.ActualHarvestDate,x.CurrentCycle,x.TotalCycles,x.CurrentCycle<x.TotalCycles);
    private static SupplyResponse ToDto(Supply x)=>new(x.SupplyId,x.SupplyName,x.SupplyType,x.Description,x.HarvestDays,x.ImageUrl,x.CostPrice,x.UnitPrice,x.RentalPrice,x.QuantityInStock,x.Unit,x.MinStockLevel,x.IsActive,x.RiskDescription,x.ExpectedYield);
    private static CropThresholdResponse ToDto(CropThreshold x)=>new(x.ThresholdId,x.SupplyId,x.Stage,x.MinSoilMoisture,x.MaxSoilMoisture,x.MinAirHumidity,x.MaxAirHumidity,x.MinTemperature,x.MaxTemperature,x.MinLightIntensity,x.MaxLightIntensity,x.LightHoursPerDay);
    private static CareScheduleResponse ToDto(CareSchedule x)=>new(x.ScheduleId,x.SupplyId,x.DayIndex,x.TaskName,x.TaskDescription,x.TargetStage);
    private static DailyTaskResponse ToDto(DailyTask x)=>new(x.TaskId,x.RentalId,x.AssignedUserId,x.TaskName,x.DueDate,x.Status,x.CompletedAt,x.Notes);

    private static void ValidateSupply(SupplyRequest r){if(!SupplyTypes.Contains(r.SupplyType.ToUpper()))throw new AppException(400,"Invalid supply type.");if(r.SupplyType.ToUpper()==SupplyType.Seed&&r.HarvestDays<=0)throw new AppException(400,"Seed harvest days must be positive.");}
    private static void Apply(Supply x,SupplyRequest r){x.SupplyName=r.SupplyName.Trim();x.SupplyType=r.SupplyType.ToUpper();x.Description=r.Description;x.HarvestDays=r.HarvestDays;x.ImageUrl=r.ImageUrl;x.CostPrice=r.CostPrice;x.UnitPrice=r.UnitPrice;x.RentalPrice=r.RentalPrice;x.QuantityInStock=r.QuantityInStock;x.Unit=r.Unit.Trim();x.MinStockLevel=r.MinStockLevel;x.IsActive=r.IsActive;}
    private static void ValidateStage(string value){if(!Stages.Contains(value.ToUpper()))throw new AppException(400,"Invalid growth stage.");}
    private static void ValidateThreshold(CropThresholdRequest r){ValidateStage(r.Stage);if(r.MinSoilMoisture>r.MaxSoilMoisture||r.MinAirHumidity>r.MaxAirHumidity||r.MinTemperature>r.MaxTemperature||r.MinLightIntensity>r.MaxLightIntensity)throw new AppException(400,"Each minimum threshold must be less than or equal to its maximum.");}
    private static void Apply(CropThreshold x,CropThresholdRequest r){x.SupplyId=r.SupplyId;x.Stage=r.Stage.ToUpper();x.MinSoilMoisture=r.MinSoilMoisture;x.MaxSoilMoisture=r.MaxSoilMoisture;x.MinAirHumidity=r.MinAirHumidity;x.MaxAirHumidity=r.MaxAirHumidity;x.MinTemperature=r.MinTemperature;x.MaxTemperature=r.MaxTemperature;x.MinLightIntensity=r.MinLightIntensity;x.MaxLightIntensity=r.MaxLightIntensity;x.LightHoursPerDay=r.LightHoursPerDay;}
    private static void Apply(CareSchedule x,CareScheduleRequest r){x.SupplyId=r.SupplyId;x.DayIndex=r.DayIndex;x.TaskName=r.TaskName.Trim();x.TaskDescription=r.TaskDescription;x.TargetStage=r.TargetStage.ToUpper();}
}
