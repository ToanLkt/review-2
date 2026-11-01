using System.Security.Claims;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;

namespace SmartFarm.Api.Controllers;

/// <summary>
/// Customer xem ảnh camera của khay mình thuê. Chỉ trả ảnh thuộc rental do chính customer sở hữu.
/// </summary>
[ApiController, ApiVersion(1.0)]
[Route("api/v{version:apiVersion}/rentals/{rentalId:int}/camera")]
[Authorize(Roles = RoleNames.Customer)]
[Produces("application/json", "application/xml")]
public class RentalCameraController(IoTManagementService service) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Ảnh mới nhất của khay đang thuê.</summary>
    [HttpGet("latest")]
    public async Task<ActionResult<ApiResponse<CameraSnapshotResponse>>> Latest(int rentalId)
        => Ok(ApiResponse<CameraSnapshotResponse>.Ok(await service.LatestSnapshotForCustomerAsync(UserId, rentalId)));

    /// <summary>Lịch sử ảnh của khay đang thuê (mới nhất trước).</summary>
    [HttpGet("history")]
    public async Task<ActionResult<ApiResponse<PagedResponse<object>>>> History(int rentalId, [FromQuery] QueryRequest query)
        => Ok(ApiResponse<PagedResponse<object>>.Ok(await service.SnapshotsForCustomerAsync(UserId, rentalId, query)));
}
