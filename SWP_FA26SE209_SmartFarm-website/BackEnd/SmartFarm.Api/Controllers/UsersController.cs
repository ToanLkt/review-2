using System.Security.Claims;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;

namespace SmartFarm.Api.Controllers;

[ApiController, ApiVersion(1.0)]
[Route("api/v{version:apiVersion}/admin/users")]
[Authorize(Roles = RoleNames.Admin)]
[Produces("application/json", "application/xml")]
public class UsersController(IUserService service) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResponse<object>>>> List(
        [FromQuery] QueryRequest query, [FromQuery] string? role, [FromQuery] bool? isActive)
        => Ok(ApiResponse<PagedResponse<object>>.Ok(await service.ListAsync(query, role, isActive)));

    [HttpGet("{id:int}", Name = "GetUserById")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> Detail([FromRoute] int id)
        => Ok(ApiResponse<UserResponse>.Ok(await service.DetailAsync(id)));

    [HttpPost("staff")]
    public async Task<IActionResult> CreateStaff(CreateStaffAccountRequest request)=>StatusCode(201,ApiResponse<object>.Ok(await service.CreateStaffAsync(request),"Staff account created"));

    [HttpPut("{id:int}/profile")]
    public async Task<IActionResult> UpdateProfile(int id,AdminUpdateUserRequest request)=>Ok(ApiResponse<object>.Ok(await service.UpdateProfileAsync(id,request),"User profile updated"));

    [HttpPut("{id:int}/role")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> UpdateRole(int id, [FromBody] UpdateUserRoleRequest request)
        => Ok(ApiResponse<UserResponse>.Ok(await service.UpdateRoleAsync(UserId, id, request), "Role updated"));

    [HttpPut("{id:int}/status")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> UpdateStatus(int id, [FromBody] UpdateUserStatusRequest request)
        => Ok(ApiResponse<UserResponse>.Ok(await service.UpdateStatusAsync(UserId, id, request), "Account status updated"));
}

[ApiController, ApiVersion(1.0)]
[Route("api/v{version:apiVersion}/admin/roles")]
[Authorize(Roles = RoleNames.Admin)]
[Produces("application/json", "application/xml")]
public class RolesController(IUserService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<object>>>> List()
        => Ok(ApiResponse<IReadOnlyList<object>>.Ok(await service.RolesAsync()));
}
