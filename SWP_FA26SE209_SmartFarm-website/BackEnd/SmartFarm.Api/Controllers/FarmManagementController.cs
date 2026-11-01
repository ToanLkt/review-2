using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;

namespace SmartFarm.Api.Controllers;

[ApiController,ApiVersion(1.0),Route("api/v{version:apiVersion}/admin/farm")]
[Authorize(Roles=RoleNames.Admin)]
public class FarmManagementController(FarmInfrastructureService service):ControllerBase
{
    [HttpGet("zones")] public async Task<IActionResult> Zones()=>Ok(ApiResponse<object>.Ok(await service.ZonesAsync()));
    [HttpGet("zones/{id:int}")] public async Task<IActionResult> Zone(int id)=>Ok(ApiResponse<object>.Ok(await service.ZoneAsync(id)));
    [HttpPost("zones")] public async Task<IActionResult> CreateZone(FarmZoneRequest r)=>StatusCode(201,ApiResponse<object>.Ok(await service.CreateZoneAsync(r)));
    [HttpPut("zones/{id:int}")] public async Task<IActionResult> UpdateZone(int id,FarmZoneRequest r)=>Ok(ApiResponse<object>.Ok(await service.UpdateZoneAsync(id,r)));
    [HttpDelete("zones/{id:int}")] public async Task<IActionResult> DeactivateZone(int id){await service.DeactivateZoneAsync(id);return Ok(ApiResponse<object>.Ok(new {},"Farm zone deactivated"));}
    [HttpGet("racks")] public async Task<IActionResult> Racks([FromQuery]int? zoneId)=>Ok(ApiResponse<object>.Ok(await service.RacksAsync(zoneId)));
    [HttpPost("racks")] public async Task<IActionResult> CreateRack(FarmRackRequest r)=>StatusCode(201,ApiResponse<object>.Ok(await service.CreateRackAsync(r)));
    [HttpPut("racks/{id:int}")] public async Task<IActionResult> UpdateRack(int id,FarmRackRequest r)=>Ok(ApiResponse<object>.Ok(await service.UpdateRackAsync(id,r)));
    [HttpDelete("racks/{id:int}")] public async Task<IActionResult> DeleteRack(int id){await service.DeleteRackAsync(id);return Ok(ApiResponse<object>.Ok(new {},"Rack deleted"));}
    [HttpGet("trays")] public async Task<IActionResult> Trays([FromQuery]int? rackId,[FromQuery]string? status)=>Ok(ApiResponse<object>.Ok(await service.TraysAsync(rackId,status)));
    [HttpPost("trays")] public async Task<IActionResult> CreateTray(SoilTrayRequest r)=>StatusCode(201,ApiResponse<object>.Ok(await service.CreateTrayAsync(r)));
    [HttpPut("trays/{id:int}")] public async Task<IActionResult> UpdateTray(int id,SoilTrayRequest r)=>Ok(ApiResponse<object>.Ok(await service.UpdateTrayAsync(id,r)));
    [HttpPut("trays/{id:int}/status")] public async Task<IActionResult> TrayStatus(int id,TrayStatusRequest r)=>Ok(ApiResponse<object>.Ok(await service.UpdateTrayStatusAsync(id,r.Status)));
    [HttpPut("trays/{id:int}/location")] public async Task<IActionResult> MoveTray(int id,TrayLocationRequest r)=>Ok(ApiResponse<object>.Ok(await service.MoveTrayAsync(id,r)));
    [HttpDelete("trays/{id:int}")] public async Task<IActionResult> DeleteTray(int id){await service.DeleteTrayAsync(id);return Ok(ApiResponse<object>.Ok(new {},"Tray deleted"));}
}

[ApiController,ApiVersion(1.0),Route("api/v{version:apiVersion}/staff/farm")]
[Authorize(Roles=RoleNames.Staff)]
public class StaffFarmController(FarmInfrastructureService service):ControllerBase
{
    [HttpGet("zones")] public async Task<IActionResult> Zones()=>Ok(ApiResponse<object>.Ok(await service.ZonesAsync()));
    [HttpGet("racks")] public async Task<IActionResult> Racks([FromQuery]int? zoneId)=>Ok(ApiResponse<object>.Ok(await service.RacksAsync(zoneId)));
    [HttpGet("trays")] public async Task<IActionResult> Trays([FromQuery]int? rackId,[FromQuery]string? status)=>Ok(ApiResponse<object>.Ok(await service.TraysAsync(rackId,status)));
    [HttpPost("trays")] public async Task<IActionResult> CreateTray(SoilTrayRequest r)=>StatusCode(201,ApiResponse<object>.Ok(await service.CreateTrayAsync(r)));
    [HttpPut("trays/{id:int}/status")] public async Task<IActionResult> TrayStatus(int id,TrayStatusRequest r)=>Ok(ApiResponse<object>.Ok(await service.UpdateTrayStatusAsync(id,r.Status)));
}
