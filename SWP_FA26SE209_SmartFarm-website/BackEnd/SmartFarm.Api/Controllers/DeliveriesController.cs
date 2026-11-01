using System.Security.Claims;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;

namespace SmartFarm.Api.Controllers;

[ApiController,ApiVersion(1.0),Route("api/v{version:apiVersion}/deliveries"),Authorize(Roles=RoleNames.Customer)]
public class CustomerDeliveriesController(DeliveryService service):ControllerBase
{
    private int UserId=>int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    [HttpGet] public async Task<IActionResult> List([FromQuery]QueryRequest query)=>Ok(ApiResponse<object>.Ok(await service.ListCustomerAsync(UserId,query)));
    [HttpGet("{id:int}")] public async Task<IActionResult> Detail(int id)=>Ok(ApiResponse<object>.Ok(await service.GetCustomerAsync(UserId,id)));
    [HttpPut("orders/{orderId:int}/schedule")] public async Task<IActionResult> Schedule(int orderId,ScheduleDeliveryRequest request)=>Ok(ApiResponse<object>.Ok(await service.ScheduleCustomerAsync(UserId,orderId,request),"Delivery scheduled"));
    [HttpPut("{id:int}/schedule")] public async Task<IActionResult> ScheduleById(int id,ScheduleDeliveryRequest request)=>Ok(ApiResponse<object>.Ok(await service.ScheduleCustomerAsync(UserId,0,request with { DeliveryId = id }),"Delivery scheduled"));
}

[ApiController,ApiVersion(1.0)]
[Route("api/v{version:apiVersion}/staff/deliveries")]
[Authorize(Roles=$"{RoleNames.Staff},{RoleNames.Admin}")]
public class DeliveriesController(DeliveryService service):ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<ApiResponse<DeliveryResponse>>> Create([FromBody] CreateDeliveryRequest request)=>
        StatusCode(201,ApiResponse<DeliveryResponse>.Ok(await service.CreateAsync(request),"Delivery created"));
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResponse<object>>>> List([FromQuery] QueryRequest query,[FromQuery]string? status)=>
        Ok(ApiResponse<PagedResponse<object>>.Ok(await service.ListAsync(query,status)));
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<DeliveryResponse>>> Detail(int id)=>Ok(ApiResponse<DeliveryResponse>.Ok(await service.GetAsync(id)));
    [HttpPut("{id:int}/shipper")]
    public async Task<ActionResult<ApiResponse<DeliveryResponse>>> Assign(int id,[FromBody] AssignShipperRequest request)=>
        Ok(ApiResponse<DeliveryResponse>.Ok(await service.AssignAsync(id,request.ShipperId)));
    [HttpPatch("{id:int}")]
    public async Task<ActionResult<ApiResponse<DeliveryResponse>>> Update(int id,[FromBody] UpdateDeliveryRequest request)=>
        Ok(ApiResponse<DeliveryResponse>.Ok(await service.UpdateAsync(id,request)));
}
