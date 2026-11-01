using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;

namespace SmartFarm.Api.Controllers;

[ApiController,ApiVersion(1.0),Route("api/v{version:apiVersion}/staff/cultivation")]
[Authorize(Roles=RoleNames.Staff+","+RoleNames.Admin)]
public class CultivationController(CultivationService service):ControllerBase
{
    [HttpGet("supplies")] public async Task<IActionResult> Supplies([FromQuery]string? type,[FromQuery]bool? active)=>Ok(ApiResponse<object>.Ok(await service.SuppliesAsync(type,active)));
    [HttpGet("supplies/{id:int}")] public async Task<IActionResult> Supply(int id)=>Ok(ApiResponse<object>.Ok(await service.SupplyAsync(id)));
    [HttpPost("supplies")] public async Task<IActionResult> CreateSupply(SupplyRequest r)=>StatusCode(201,ApiResponse<object>.Ok(await service.CreateSupplyAsync(r)));
    [HttpPut("supplies/{id:int}")] public async Task<IActionResult> UpdateSupply(int id,SupplyRequest r)=>Ok(ApiResponse<object>.Ok(await service.UpdateSupplyAsync(id,r)));
    [HttpDelete("supplies/{id:int}")] public async Task<IActionResult> DeactivateSupply(int id){await service.DeactivateSupplyAsync(id);return Ok(ApiResponse<object>.Ok(new {},"Supply deactivated"));}
    [HttpGet("thresholds")] public async Task<IActionResult> Thresholds([FromQuery]int? supplyId)=>Ok(ApiResponse<object>.Ok(await service.ThresholdsAsync(supplyId)));
    [HttpPost("thresholds")] public async Task<IActionResult> CreateThreshold(CropThresholdRequest r)=>StatusCode(201,ApiResponse<object>.Ok(await service.CreateThresholdAsync(r)));
    [HttpPut("thresholds/{id:int}")] public async Task<IActionResult> UpdateThreshold(int id,CropThresholdRequest r)=>Ok(ApiResponse<object>.Ok(await service.UpdateThresholdAsync(id,r)));
    [HttpDelete("thresholds/{id:int}")] public async Task<IActionResult> DeleteThreshold(int id){await service.DeleteThresholdAsync(id);return Ok(ApiResponse<object>.Ok(new {},"Threshold deleted"));}
    [HttpGet("care-schedules")] public async Task<IActionResult> Schedules([FromQuery]int? supplyId)=>Ok(ApiResponse<object>.Ok(await service.SchedulesAsync(supplyId)));
    [HttpPost("care-schedules")] public async Task<IActionResult> CreateSchedule(CareScheduleRequest r)=>StatusCode(201,ApiResponse<object>.Ok(await service.CreateScheduleAsync(r)));
    [HttpPut("care-schedules/{id:int}")] public async Task<IActionResult> UpdateSchedule(int id,CareScheduleRequest r)=>Ok(ApiResponse<object>.Ok(await service.UpdateScheduleAsync(id,r)));
    [HttpDelete("care-schedules/{id:int}")] public async Task<IActionResult> DeleteSchedule(int id){await service.DeleteScheduleAsync(id);return Ok(ApiResponse<object>.Ok(new {},"Schedule deleted"));}
    [HttpGet("cycles")] public async Task<IActionResult> Cycles([FromQuery]string? status)=>Ok(ApiResponse<object>.Ok(await service.CyclesAsync(status)));
    [HttpPost("cycles")] public async Task<IActionResult> StartCycle(StartGrowingCycleRequest r)=>StatusCode(201,ApiResponse<object>.Ok(await service.StartCycleAsync(r)));
    [HttpPut("cycles/{id:int}/status")] public async Task<IActionResult> CycleStatus(int id,CropStatusRequest r)=>Ok(ApiResponse<object>.Ok(await service.UpdateCycleStatusAsync(id,r.Status)));
    [HttpPut("cycles/{id:int}/harvest")] public async Task<IActionResult> Harvest(int id,HarvestRequest r)=>Ok(ApiResponse<object>.Ok(await service.HarvestAsync(id,r)));
    [HttpPost("cycles/{id:int}/next-cycle")] public async Task<IActionResult> NextCycle(int id)=>Ok(ApiResponse<object>.Ok(await service.NextCycleAsync(id),"Started next growing cycle"));
    [HttpPost("cycles/{id:int}/tasks/generate")] public async Task<IActionResult> GenerateTasks(int id)=>Ok(ApiResponse<object>.Ok(new{created=await service.GenerateTasksAsync(id)}));
    [HttpGet("tasks")] public async Task<IActionResult> Tasks([FromQuery]int? rentalId,[FromQuery]string? status)=>Ok(ApiResponse<object>.Ok(await service.TasksAsync(rentalId,status)));
    [HttpPut("tasks/{id:int}/assignee")] public async Task<IActionResult> AssignTask(int id,AssignTaskRequest r)=>Ok(ApiResponse<object>.Ok(await service.AssignTaskAsync(id,r.AssignedUserId)));
    [HttpPut("tasks/{id:int}/complete")] public async Task<IActionResult> CompleteTask(int id,CompleteTaskRequest r)=>Ok(ApiResponse<object>.Ok(await service.CompleteTaskAsync(id,r)));
}
