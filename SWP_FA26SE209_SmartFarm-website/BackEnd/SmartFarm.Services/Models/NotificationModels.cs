using System.ComponentModel.DataAnnotations;

namespace SmartFarm.Services.Models;

public record CreateNotificationRequest([Range(1,int.MaxValue)] int UserId,
    [Required,MaxLength(150)] string Title,[Required,MaxLength(2000)] string Message,
    [Required,MaxLength(30)] string Type,int? ReferenceId,DateTime? ScheduledAt);
public record ScheduleNotificationRequest(DateTime ScheduledAt);
public record UpdateNotificationDraftRequest([Range(1,int.MaxValue)] int UserId,[Required,MaxLength(150)] string Title,[Required,MaxLength(2000)] string Message,[Required,MaxLength(30)] string Type,int? ReferenceId);
public record NotificationTemplateRequest([Required,MaxLength(80)] string TemplateKey,[Required,MaxLength(150)] string TitleTemplate,[Required,MaxLength(2000)] string MessageTemplate,[Required,MaxLength(30)] string Type,bool IsActive=true);
public record NotificationTemplateResponse(int TemplateId,string TemplateKey,string TitleTemplate,string MessageTemplate,string Type,bool IsActive,DateTime UpdatedAt,int? UpdatedByUserId);
public record RegisterDeviceTokenRequest([Required,MaxLength(512)] string Token,[Required,MaxLength(20)] string Platform);
public record NotificationResponse(int NotificationId,int UserId,string Title,string Message,string Type,int? ReferenceId,
    bool IsRead,string Status,DateTime? ScheduledAt,DateTime? SentAt,DateTime CreatedAt);
public record DeviceTokenResponse(int DeviceTokenId,string Platform,bool IsActive,DateTime RegisteredAt);

// Broadcast: gửi thông báo cho nhiều user cùng lúc. Target ALL (toàn bộ user active) hoặc ROLE (theo 1 role).
public record BroadcastNotificationRequest(
    [Required,MaxLength(10)] string Target,           // "ALL" | "ROLE"
    [MaxLength(20)] string? Role,                       // bắt buộc khi Target = ROLE
    [Required,MaxLength(150)] string Title,
    [Required,MaxLength(2000)] string Message,
    [Required,MaxLength(30)] string Type,
    DateTime? ScheduledAt);                             // null = gửi ngay; có giá trị = lên lịch
public record BroadcastResultResponse(string Target,string? Role,int Recipients,string Status,DateTime? ScheduledAt);
