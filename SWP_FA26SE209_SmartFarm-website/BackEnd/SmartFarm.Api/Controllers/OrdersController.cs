using System.Security.Claims;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;

namespace SmartFarm.Api.Controllers;

[ApiController, ApiVersion(1.0)]
[Route("api/v{version:apiVersion}/orders")]
[Authorize(Roles = RoleNames.Customer)]
[Produces("application/json", "application/xml")]
public class OrdersController(IOrderService service) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("seed-packets")]
    public async Task<ActionResult<ApiResponse<OrderDetailsResponse>>> CreateSeedPacket(
        [FromBody] CreateSeedPacketOrderRequest request)
    {
        var order = await service.CreateSeedPacketAsync(UserId, request);
        return StatusCode(201, ApiResponse<OrderDetailsResponse>.Ok(order, "Seed packet order created"));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResponse<object>>>> List([FromQuery] QueryRequest query) =>
        Ok(ApiResponse<PagedResponse<object>>.Ok(await service.ListCustomerAsync(UserId, query)));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<OrderDetailsResponse>>> Detail(int id) =>
        Ok(ApiResponse<OrderDetailsResponse>.Ok(await service.GetCustomerAsync(UserId, id)));
}

[ApiController, ApiVersion(1.0)]
[Route("api/v{version:apiVersion}/staff/orders")]
[Authorize(Roles = $"{RoleNames.Staff},{RoleNames.Admin}")]
[Produces("application/json", "application/xml")]
public class StaffOrdersController(IOrderService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResponse<object>>>> List(
        [FromQuery] QueryRequest query, [FromQuery] string? orderType, [FromQuery] string? status) =>
        Ok(ApiResponse<PagedResponse<object>>.Ok(await service.ListStaffAsync(query, orderType, status)));

    [HttpGet("rentals")]
    public async Task<ActionResult<ApiResponse<PagedResponse<object>>>> Rentals(
        [FromQuery] QueryRequest query, [FromQuery] string? status) =>
        Ok(ApiResponse<PagedResponse<object>>.Ok(await service.ListStaffAsync(query, OrderType.TrayRental, status)));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<OrderDetailsResponse>>> Detail(int id) =>
        Ok(ApiResponse<OrderDetailsResponse>.Ok(await service.GetStaffAsync(id)));

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<ApiResponse<OrderDetailsResponse>>> Transition(
        int id, [FromBody] UpdateOrderStatusRequest request) =>
        Ok(ApiResponse<OrderDetailsResponse>.Ok(await service.TransitionAsync(id, request.Status), "Order status updated"));
}
