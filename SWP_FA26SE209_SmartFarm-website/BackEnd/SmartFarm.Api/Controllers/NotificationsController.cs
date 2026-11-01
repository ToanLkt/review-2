using System.Security.Claims;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;

namespace SmartFarm.Api.Controllers;

[ApiController,ApiVersion(1.0),Route("api/v{version:apiVersion}/notifications"),Authorize]
public class NotificationsController(NotificationService service):ControllerBase
{
    private int UserId=>int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    [HttpGet] public async Task<ActionResult<ApiResponse<PagedResponse<object>>>> List([FromQuery]QueryRequest query,[FromQuery]bool? isRead)=>
        Ok(ApiResponse<PagedResponse<object>>.Ok(await service.ListAsync(UserId,query,isRead)));
    [HttpPatch("{id:int}/read")] public async Task<ActionResult<ApiResponse<NotificationResponse>>> Read(int id)=>
        Ok(ApiResponse<NotificationResponse>.Ok(await service.MarkReadAsync(UserId,id)));
    [HttpPost("device-tokens")] public async Task<ActionResult<ApiResponse<DeviceTokenResponse>>> Register([FromBody]RegisterDeviceTokenRequest request)=>
        Ok(ApiResponse<DeviceTokenResponse>.Ok(await service.RegisterTokenAsync(UserId,request)));
    [HttpDelete("device-tokens/{id:int}")] public async Task<IActionResult> DeactivateToken(int id){await service.DeactivateTokenAsync(UserId,id);return Ok(ApiResponse<object>.Ok(new{},"Device token deactivated"));}
}

[ApiController,ApiVersion(1.0),Route("api/v{version:apiVersion}/staff/notifications"),Authorize(Roles=$"{RoleNames.Staff},{RoleNames.Admin}")]
public class StaffNotificationsController(NotificationService service):ControllerBase
{
    private int UserId=>int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    [HttpGet] public async Task<IActionResult> List([FromQuery]QueryRequest query,[FromQuery]string? status,[FromQuery]int? userId)=>Ok(ApiResponse<object>.Ok(await service.ListStaffAsync(query,status,userId)));
    [HttpPost] public async Task<ActionResult<ApiResponse<NotificationResponse>>> Create([FromBody]CreateNotificationRequest request)=>
        StatusCode(201,ApiResponse<NotificationResponse>.Ok(await service.CreateDraftAsync(UserId,request),"Notification created"));
    [HttpPost("broadcast")] public async Task<ActionResult<ApiResponse<BroadcastResultResponse>>> Broadcast([FromBody]BroadcastNotificationRequest request)=>
        StatusCode(201,ApiResponse<BroadcastResultResponse>.Ok(await service.BroadcastAsync(UserId,request),"Broadcast created"));
    [HttpPost("{id:int}/send")] public async Task<ActionResult<ApiResponse<NotificationResponse>>> Send(int id)=>
        Ok(ApiResponse<NotificationResponse>.Ok(await service.SendNowAsync(id)));
    [HttpPut("{id:int}/schedule")] public async Task<ActionResult<ApiResponse<NotificationResponse>>> Schedule(int id,[FromBody]ScheduleNotificationRequest request)=>
        Ok(ApiResponse<NotificationResponse>.Ok(await service.ScheduleAsync(id,request.ScheduledAt)));
    [HttpPut("{id:int}")] public async Task<IActionResult> Update(int id,UpdateNotificationDraftRequest request)=>Ok(ApiResponse<object>.Ok(await service.UpdateDraftAsync(id,request)));
    [HttpDelete("{id:int}")] public async Task<IActionResult> Delete(int id){await service.DeleteDraftAsync(id);return Ok(ApiResponse<object>.Ok(new{},"Notification draft deleted"));}
    [HttpGet("templates")] public async Task<IActionResult> Templates()=>Ok(ApiResponse<object>.Ok(await service.TemplatesAsync()));
    [HttpPost("templates")] public async Task<IActionResult> CreateTemplate(NotificationTemplateRequest request)=>StatusCode(201,ApiResponse<object>.Ok(await service.CreateTemplateAsync(UserId,request),"Notification template created"));
    [HttpPut("templates/{id:int}")] public async Task<IActionResult> UpdateTemplate(int id,NotificationTemplateRequest request)=>Ok(ApiResponse<object>.Ok(await service.UpdateTemplateAsync(id,UserId,request)));
    [HttpDelete("templates/{id:int}")] public async Task<IActionResult> DeleteTemplate(int id){await service.DeleteTemplateAsync(id);return Ok(ApiResponse<object>.Ok(new{},"Notification template deleted"));}
}
