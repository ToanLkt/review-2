using System.Security.Claims;
using System.Text;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;

namespace SmartFarm.Api.Controllers;

[ApiController, ApiVersion(1.0)]
[Route("api/v{version:apiVersion}/payments")]
[Produces("application/json")]
public class PaymentsController(PaymentService service) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [Authorize(Roles=RoleNames.Customer), HttpPost("orders/{orderId:int}")]
    public async Task<ActionResult<ApiResponse<PaymentInstructionsResponse>>> Create(int orderId) =>
        Ok(ApiResponse<PaymentInstructionsResponse>.Ok(await service.CreateAsync(UserId,orderId)));

    [Authorize(Roles=RoleNames.Customer), HttpGet("orders/{orderId:int}")]
    public async Task<ActionResult<ApiResponse<PaymentStatusResponse>>> Status(int orderId) =>
        Ok(ApiResponse<PaymentStatusResponse>.Ok(await service.StatusAsync(UserId,orderId)));

    // Lịch sử thanh toán của chính khách.
    [Authorize(Roles=RoleNames.Customer), HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResponse<object>>>> History([FromQuery] QueryRequest query) =>
        Ok(ApiResponse<PagedResponse<object>>.Ok(await service.HistoryAsync(UserId,query)));

    [AllowAnonymous, HttpPost("sepay/webhook")]
    public async Task<ActionResult<ApiResponse<WebhookResultResponse>>> SePayWebhook()
    {
        using var reader=new StreamReader(Request.Body,Encoding.UTF8);
        var raw=await reader.ReadToEndAsync();
        var result=await service.HandleWebhookAsync(raw,Request.Headers["X-SePay-Signature"].ToString(),Request.Headers["X-SePay-Timestamp"].ToString());
        return Ok(ApiResponse<WebhookResultResponse>.Ok(result));
    }
}

[ApiController, ApiVersion(1.0)]
[Route("api/v{version:apiVersion}/staff/payments")]
[Authorize(Roles=$"{RoleNames.Staff},{RoleNames.Admin}")]
public class StaffPaymentsController(PaymentService service) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    [HttpGet("exceptions")]
    public async Task<ActionResult<ApiResponse<PagedResponse<object>>>> Exceptions([FromQuery] QueryRequest query)=>
        Ok(ApiResponse<PagedResponse<object>>.Ok(await service.ExceptionsAsync(query)));
    [HttpPut("{id:long}/note")]
    public async Task<ActionResult<ApiResponse<PaymentExceptionResponse>>> Note(long id,[FromBody] PaymentExceptionNoteRequest request)=>
        Ok(ApiResponse<PaymentExceptionResponse>.Ok(await service.NoteAsync(id,UserId,request.Note)));
    [HttpGet("report")]
    public async Task<ActionResult<ApiResponse<PaymentReportResponse>>> Report([FromQuery] DateTime? from,[FromQuery] DateTime? to)=>
        Ok(ApiResponse<PaymentReportResponse>.Ok(await service.ReportAsync(from,to)));
}
