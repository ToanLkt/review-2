using System.Security.Claims;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;

namespace SmartFarm.Api.Controllers;

[ApiController]
[ApiVersion(1.0)]
[Route("api/v{version:apiVersion}/auth")]
[Produces("application/json", "application/xml")]
public class AuthController(IAuthService service) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> Register([FromBody] RegisterRequest request)
    {
        var user = await service.RegisterAsync(request);
        return StatusCode(201, ApiResponse<UserResponse>.Ok(user, "Account registered successfully"));
    }

    [HttpPost("confirm-email")]
    public async Task<ActionResult<ApiResponse<object>>> ConfirmEmail([FromBody] ConfirmEmailRequest request)
    {
        await service.ConfirmEmailAsync(request);
        return Ok(ApiResponse<object>.Ok(new { }, "Email confirmed successfully"));
    }

    [HttpPost("resend-confirm-email")]
    public async Task<ActionResult<ApiResponse<object>>> ResendConfirmEmail([FromBody] ResendConfirmEmailRequest request)
    {
        await service.ResendConfirmEmailAsync(request);
        return Accepted(ApiResponse<object>.Ok(new { }, "If the email is unconfirmed, a new link has been sent."));
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login(
        [FromBody] LoginRequest request, [FromHeader(Name = "X-Request-Id")] string? requestId)
        => Ok(ApiResponse<LoginResponse>.Ok(await service.LoginAsync(request), "Login successful"));

    [HttpPost("refresh-token")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Refresh([FromBody] RefreshTokenRequest request)
        => Ok(ApiResponse<LoginResponse>.Ok(await service.RefreshAsync(request), "Token refreshed"));

    [Authorize]
    [HttpPost("logout")]
    public async Task<ActionResult<ApiResponse<object>>> Logout([FromBody] RefreshTokenRequest? request)
    {
        await service.LogoutAsync(UserId, request?.RefreshToken);
        return Ok(ApiResponse<object>.Ok(new { }, "Logout successful"));
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ApiResponse<object>>> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        await service.ForgotPasswordAsync(request);
        return Accepted(ApiResponse<object>.Ok(new { }, "If the email exists, a reset link has been sent."));
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult<ApiResponse<object>>> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        await service.ResetPasswordAsync(request);
        return Ok(ApiResponse<object>.Ok(new { }, "Password reset successfully"));
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var session = await service.ChangePasswordAsync(UserId, request);
        return Ok(ApiResponse<LoginResponse>.Ok(session, "Password changed successfully"));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> Me()
        => Ok(ApiResponse<UserResponse>.Ok(await service.GetProfileAsync(UserId)));

    [Authorize]
    [HttpPut("me")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> UpdateProfile([FromBody] UpdateProfileRequest request)
        => Ok(ApiResponse<UserResponse>.Ok(await service.UpdateProfileAsync(UserId, request), "Profile updated"));
}
