using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;

namespace SmartFarm.Services.Services;

public class FarmInfrastructureService(AppDbContext db)
{
    private static readonly string[] TrayStatuses=[TrayStatus.Available,TrayStatus.Rented,TrayStatus.Maintenance,TrayStatus.Inactive];

    public async Task<List<object>> ZonesAsync() => await db.FarmZones.AsNoTracking().OrderBy(x=>x.ZoneName)
        .Select(x=>(object)new{x.ZoneId,x.ZoneName,x.LocationDescription,x.TotalCapacity,x.IsActive,RackCount=x.FarmRacks.Count,TrayCount=x.FarmRacks.SelectMany(r=>r.SoilTrays).Count(),AvailableTrays=x.FarmRacks.SelectMany(r=>r.SoilTrays).Count(t=>t.CurrentStatus==TrayStatus.Available)}).ToListAsync();
    public async Task<FarmZoneResponse> ZoneAsync(int id)=>ToDto(await FindZoneAsync(id));
    public async Task<FarmZoneResponse> CreateZoneAsync(FarmZoneRequest r){if(await db.FarmZones.AnyAsync(x=>x.ZoneName==r.ZoneName.Trim()))throw new AppException(409,"Zone name already exists.");var x=new FarmZone{ZoneName=r.ZoneName.Trim(),LocationDescription=r.LocationDescription,TotalCapacity=r.TotalCapacity,IsActive=r.IsActive};db.Add(x);await db.SaveChangesAsync();return ToDto(x);}
    public async Task<FarmZoneResponse> UpdateZoneAsync(int id,FarmZoneRequest r){var x=await FindZoneAsync(id);if(await db.FarmZones.AnyAsync(z=>z.ZoneId!=id&&z.ZoneName==r.ZoneName.Trim()))throw new AppException(409,"Zone name already exists.");var trays=await db.SoilTrays.CountAsync(t=>t.Rack!.ZoneId==id);if(r.TotalCapacity<trays)throw new AppException(400,"Total capacity cannot be lower than the current tray count.");x.ZoneName=r.ZoneName.Trim();x.LocationDescription=r.LocationDescription;x.TotalCapacity=r.TotalCapacity;x.IsActive=r.IsActive;await db.SaveChangesAsync();return ToDto(x);}
    public async Task DeactivateZoneAsync(int id){var x=await FindZoneAsync(id);if(await db.SoilTrays.AnyAsync(t=>t.Rack!.ZoneId==id&&t.CurrentStatus==TrayStatus.Rented))throw new AppException(409,"A zone with rented trays cannot be deactivated.");x.IsActive=false;await db.SaveChangesAsync();}

    public async Task<List<FarmRackResponse>> RacksAsync(int? zoneId)=>(await db.FarmRacks.AsNoTracking().Include(x=>x.Zone).Where(x=>!zoneId.HasValue||x.ZoneId==zoneId).OrderBy(x=>x.RackCode).ToListAsync()).Select(ToDto).ToList();
    public async Task<FarmRackResponse> CreateRackAsync(FarmRackRequest r){var zone=await FindZoneAsync(r.ZoneId);if(!zone.IsActive)throw new AppException(409,"Farm zone is inactive.");if(await db.FarmRacks.AnyAsync(x=>x.RackCode==r.RackCode.Trim()))throw new AppException(409,"Rack code already exists.");var x=new FarmRack{ZoneId=r.ZoneId,RackCode=r.RackCode.Trim(),TotalTiers=r.TotalTiers,MaxTraysPerTier=r.MaxTraysPerTier};db.Add(x);await db.SaveChangesAsync();x.Zone=zone;return ToDto(x);}
    public async Task<FarmRackResponse> UpdateRackAsync(int id,FarmRackRequest r){var x=await FindRackAsync(id);var zone=await FindZoneAsync(r.ZoneId);if(await db.FarmRacks.AnyAsync(y=>y.RackId!=id&&y.RackCode==r.RackCode.Trim()))throw new AppException(409,"Rack code already exists.");var trays=await db.SoilTrays.Where(t=>t.RackId==id).ToListAsync();if(trays.Any(t=>t.TierIndex>r.TotalTiers)||trays.Count>r.TotalTiers*r.MaxTraysPerTier)throw new AppException(400,"Rack dimensions are smaller than its current tray layout.");x.ZoneId=r.ZoneId;x.RackCode=r.RackCode.Trim();x.TotalTiers=r.TotalTiers;x.MaxTraysPerTier=r.MaxTraysPerTier;await db.SaveChangesAsync();x.Zone=zone;return ToDto(x);}
    public async Task DeleteRackAsync(int id){var x=await FindRackAsync(id);if(await db.SoilTrays.AnyAsync(t=>t.RackId==id))throw new AppException(409,"Rack still contains trays.");db.Remove(x);await db.SaveChangesAsync();}

    public async Task<List<SoilTrayResponse>> TraysAsync(int? rackId,string? status)=>(await db.SoilTrays.AsNoTracking().Include(x=>x.Rack).Where(x=>(!rackId.HasValue||x.RackId==rackId)&&(string.IsNullOrWhiteSpace(status)||x.CurrentStatus==status.ToUpper())).OrderBy(x=>x.TrayCode).ToListAsync()).Select(ToDto).ToList();
    public async Task<SoilTrayResponse> CreateTrayAsync(SoilTrayRequest r){ValidateTrayStatus(r.CurrentStatus);await ValidateRackSlot(r.RackId,r.TierIndex,null);if(await db.SoilTrays.AnyAsync(x=>x.TrayCode==r.TrayCode.Trim()))throw new AppException(409,"Tray code already exists.");var x=new SoilTray{RackId=r.RackId,TrayCode=r.TrayCode.Trim(),TierIndex=r.TierIndex,CurrentStatus=r.CurrentStatus.ToUpper()};db.Add(x);await db.SaveChangesAsync();return ToDto(x);}
    public async Task<SoilTrayResponse> UpdateTrayAsync(int id,SoilTrayRequest r){var x=await FindTrayAsync(id);ValidateTrayStatus(r.CurrentStatus);await ValidateRackSlot(r.RackId,r.TierIndex,id);if(await db.SoilTrays.AnyAsync(y=>y.SoilTrayId!=id&&y.TrayCode==r.TrayCode.Trim()))throw new AppException(409,"Tray code already exists.");if(x.CurrentStatus==TrayStatus.Rented&&r.CurrentStatus.ToUpper()!=TrayStatus.Rented)throw new AppException(409,"Use the rental workflow to release a rented tray.");x.RackId=r.RackId;x.TrayCode=r.TrayCode.Trim();x.TierIndex=r.TierIndex;x.CurrentStatus=r.CurrentStatus.ToUpper();await db.SaveChangesAsync();return ToDto(x);}
    public async Task<SoilTrayResponse> UpdateTrayStatusAsync(int id,string status){var x=await FindTrayAsync(id);ValidateTrayStatus(status);if(x.CurrentStatus==TrayStatus.Rented&&status.ToUpper()!=TrayStatus.Rented)throw new AppException(409,"Use the rental workflow to release a rented tray.");x.CurrentStatus=status.ToUpper();await db.SaveChangesAsync();return ToDto(x);}
    public async Task<SoilTrayResponse> MoveTrayAsync(int id,TrayLocationRequest r){var x=await FindTrayAsync(id);if(x.CurrentStatus==TrayStatus.Rented)throw new AppException(409,"A rented tray cannot be moved.");await ValidateRackSlot(r.RackId,r.TierIndex,id);x.RackId=r.RackId;x.TierIndex=r.TierIndex;await db.SaveChangesAsync();return ToDto(x);}
    public async Task DeleteTrayAsync(int id){var x=await FindTrayAsync(id);if(x.CurrentStatus==TrayStatus.Rented||await db.TrayRentals.AnyAsync(r=>r.SoilTrayId==id))throw new AppException(409,"Tray has rental history and cannot be deleted.");db.Remove(x);await db.SaveChangesAsync();}

    // Helper nội bộ: trả entity để validate/cập nhật. Không expose entity ra controller.
    private async Task<FarmZone> FindZoneAsync(int id)=>await db.FarmZones.FindAsync(id)??throw new AppException(404,"Farm zone not found.");
    private async Task<FarmRack> FindRackAsync(int id)=>await db.FarmRacks.FindAsync(id)??throw new AppException(404,"Farm rack not found.");
    private async Task<SoilTray> FindTrayAsync(int id)=>await db.SoilTrays.FindAsync(id)??throw new AppException(404,"Soil tray not found.");

    private static FarmZoneResponse ToDto(FarmZone x)=>new(x.ZoneId,x.ZoneName,x.LocationDescription,x.TotalCapacity,x.IsActive);
    private static FarmRackResponse ToDto(FarmRack x)=>new(x.RackId,x.ZoneId,x.Zone?.ZoneName,x.RackCode,x.TotalTiers,x.MaxTraysPerTier);
    private static SoilTrayResponse ToDto(SoilTray x)=>new(x.SoilTrayId,x.RackId,x.Rack?.RackCode,x.TrayCode,x.TierIndex,x.CurrentStatus);

    private static void ValidateTrayStatus(string value){if(!TrayStatuses.Contains(value.ToUpper()))throw new AppException(400,"Invalid tray status.");}
    private async Task ValidateRackSlot(int rackId,int tier,int? trayId){var rack=await FindRackAsync(rackId);if(tier<1||tier>rack.TotalTiers)throw new AppException(400,"Tier index exceeds rack configuration.");var used=await db.SoilTrays.CountAsync(x=>x.RackId==rackId&&x.TierIndex==tier&&x.SoilTrayId!=trayId);if(used>=rack.MaxTraysPerTier)throw new AppException(409,"Rack tier is at full capacity.");var zoneCount=await db.SoilTrays.CountAsync(x=>x.Rack!.ZoneId==rack.ZoneId&&x.SoilTrayId!=trayId);var zone=await FindZoneAsync(rack.ZoneId);if(zoneCount>=zone.TotalCapacity)throw new AppException(409,"Farm zone is at full capacity.");}
}
