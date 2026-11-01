using System.Security.Claims;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;

namespace SmartFarm.Api.Controllers;

[ApiController, ApiVersion(1.0)]
[Route("api/v{version:apiVersion}/reviews")]
[Produces("application/json")]
public class ReviewsController(ReviewService service) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // Khách gửi đánh giá cho một đơn đã hoàn thành của mình.
    [Authorize(Roles = RoleNames.Customer), HttpPost("orders/{orderId:int}")]
    public async Task<ActionResult<ApiResponse<ReviewResponse>>> Create(int orderId, [FromBody] CreateReviewRequest request) =>
        StatusCode(201, ApiResponse<ReviewResponse>.Ok(await service.CreateAsync(UserId, orderId, request), "Review submitted"));

    // Danh sách đánh giá trang trại + điểm trung bình (công khai).
    [AllowAnonymous, HttpGet]
    public async Task<ActionResult<ApiResponse<FarmRatingsResponse>>> Ratings([FromQuery] QueryRequest query) =>
        Ok(ApiResponse<FarmRatingsResponse>.Ok(await service.RatingsAsync(query)));
}
