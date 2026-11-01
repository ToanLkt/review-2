using System.Security.Claims;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;

namespace SmartFarm.Api.Controllers;

[ApiController,ApiVersion(1.0),Route("api/v{version:apiVersion}/staff/inventory"),Authorize(Roles=RoleNames.Staff+","+RoleNames.Admin)]
public class InventoryController(InventoryService service):ControllerBase
{
    private int UserId=>int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    [HttpGet] public async Task<IActionResult> Balances([FromQuery]QueryRequest query,[FromQuery]string? supplyType,[FromQuery]bool? lowStock)=>Ok(ApiResponse<object>.Ok(await service.BalancesAsync(query,supplyType,lowStock)));
    [HttpGet("{supplyId:int}")] public async Task<IActionResult> Balance(int supplyId)=>Ok(ApiResponse<object>.Ok(await service.BalanceAsync(supplyId)));
    [HttpPost("{supplyId:int}/receipts")] public async Task<IActionResult> Receive(int supplyId,InventoryAdjustmentRequest request)=>StatusCode(201,ApiResponse<object>.Ok(await service.ReceiveAsync(supplyId,UserId,request),"Stock receipt recorded"));
    [HttpPost("{supplyId:int}/usages")] public async Task<IActionResult> Use(int supplyId,InventoryAdjustmentRequest request)=>StatusCode(201,ApiResponse<object>.Ok(await service.UseAsync(supplyId,UserId,request),"Material usage recorded"));
    [HttpGet("movements")] public async Task<IActionResult> Movements([FromQuery]QueryRequest query,[FromQuery]int? supplyId,[FromQuery]string? type,[FromQuery]DateTime? from,[FromQuery]DateTime? to)=>Ok(ApiResponse<object>.Ok(await service.MovementsAsync(query,supplyId,type,from,to)));
    [HttpGet("reconciliation")] public async Task<IActionResult> Reconciliation([FromQuery]int? supplyId)=>Ok(ApiResponse<object>.Ok(await service.ReconcileAsync(supplyId)));
}
