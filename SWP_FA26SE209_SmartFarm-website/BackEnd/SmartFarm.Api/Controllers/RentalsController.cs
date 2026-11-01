using System.Security.Claims;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;

namespace SmartFarm.Api.Controllers;

[ApiController, ApiVersion(1.0)]
[Route("api/v{version:apiVersion}/rentals")]
[Authorize(Roles = RoleNames.Customer)]
[Produces("application/json", "application/xml")]
public class RentalsController(IRentalService service) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    public async Task<ActionResult<ApiResponse<OrderResponse>>> Create([FromBody] CreateTrayRentalRequest request)
    {
        var order = await service.CreateAsync(UserId, request);
        return StatusCode(201, ApiResponse<OrderResponse>.Ok(order, "Rental order created"));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResponse<object>>>> List([FromQuery] QueryRequest query)
        => Ok(ApiResponse<PagedResponse<object>>.Ok(await service.ListAsync(UserId, query)));

    [HttpGet("{id:int}", Name = "GetRentalById")]
    public async Task<ActionResult<ApiResponse<OrderResponse>>> Detail(int id)
        => Ok(ApiResponse<OrderResponse>.Ok(await service.DetailAsync(UserId, id)));
}
