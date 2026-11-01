using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;

namespace SmartFarm.Api.Controllers;

[ApiController,ApiVersion(1.0),Route("api/v{version:apiVersion}/admin/reports"),Authorize(Roles=RoleNames.Admin)]
public class ReportsController(ReportingService service):ControllerBase
{
    [HttpGet("revenue")] public async Task<IActionResult> Revenue([FromQuery]DateTime? from,[FromQuery]DateTime? to)=>Ok(ApiResponse<object>.Ok(await service.RevenueAsync(from,to)));
    [HttpGet("harvest")] public async Task<IActionResult> Harvest([FromQuery]DateTime? from,[FromQuery]DateTime? to)=>Ok(ApiResponse<object>.Ok(await service.HarvestAsync(from,to)));
    [HttpGet("inventory")] public async Task<IActionResult> Inventory()=>Ok(ApiResponse<object>.Ok(await service.InventoryAsync()));
}
