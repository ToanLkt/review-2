using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;

namespace SmartFarm.Services.Services;

public sealed class NotificationService(AppDbContext db)
{
    public async Task<PagedResponse<object>> ListStaffAsync(QueryRequest request,string? status,int? userId)
    {
        var query=db.Notifications.AsNoTracking().AsQueryable();if(!string.IsNullOrWhiteSpace(status)){var value=status.Trim().ToUpperInvariant();if(value is not (NotificationStatuses.Draft or NotificationStatuses.Scheduled or NotificationStatuses.Sent))throw new AppException(400,"Invalid notification status.");query=query.Where(x=>x.Status==value);}if(userId.HasValue)query=query.Where(x=>x.UserId==userId);if(!string.IsNullOrWhiteSpace(request.Search))query=query.Where(x=>x.Title.Contains(request.Search)||x.Message.Contains(request.Search));var(page,size)=QueryHelper.Paging(request);var total=await query.CountAsync();var rows=await query.OrderByDescending(x=>x.CreatedAt).Skip((page-1)*size).Take(size).ToListAsync();return new(rows.Select(x=>(object)ToDto(x)).ToList(),page,size,total);
    }
    public async Task<PagedResponse<object>> ListAsync(int userId, QueryRequest request, bool? isRead)
    {
        var query=db.Notifications.AsNoTracking().Where(x=>x.UserId==userId&&x.Status==NotificationStatuses.Sent);
        if(isRead.HasValue) query=query.Where(x=>x.IsRead==isRead.Value);
        var (page,size)=QueryHelper.Paging(request);var total=await query.CountAsync();
        var rows=await query.OrderByDescending(x=>x.SentAt??x.CreatedAt).Skip((page-1)*size).Take(size).ToListAsync();
        return new(rows.Select(x=>(object)ToDto(x)).ToList(),page,size,total);
    }

    public async Task<NotificationResponse> MarkReadAsync(int userId,int id)
    {
        var item=await db.Notifications.FirstOrDefaultAsync(x=>x.NotificationId==id&&x.UserId==userId&&x.Status==NotificationStatuses.Sent)
            ??throw new AppException(404,"Notification not found.");
        item.IsRead=true;await db.SaveChangesAsync();return ToDto(item);
    }

    public async Task<NotificationResponse> CreateDraftAsync(int staffId,CreateNotificationRequest request)
    {
        if(!await db.Users.AnyAsync(x=>x.UserId==request.UserId&&x.IsActive))throw new AppException(404,"User not found.");
        var scheduled=request.ScheduledAt?.ToUniversalTime();
        var item=new Notification{UserId=request.UserId,Title=request.Title.Trim(),Message=request.Message.Trim(),
            NotificationType=NormalizeType(request.Type),ReferenceId=request.ReferenceId,CreatedByUserId=staffId,
            Status=scheduled.HasValue?NotificationStatuses.Scheduled:NotificationStatuses.Draft,ScheduledAt=scheduled};
        db.Add(item);await db.SaveChangesAsync();return ToDto(item);
    }

    public async Task<NotificationResponse> SendNowAsync(int id)
    {
        var item=await db.Notifications.FirstOrDefaultAsync(x=>x.NotificationId==id)??throw new AppException(404,"Notification not found.");
        if(item.Status==NotificationStatuses.Sent)return ToDto(item);
        item.Status=NotificationStatuses.Sent;item.SentAt=DateTime.UtcNow;item.ScheduledAt=null;
        await db.SaveChangesAsync();return ToDto(item);
    }

    public async Task<NotificationResponse> UpdateDraftAsync(int id,UpdateNotificationDraftRequest request)
    {
        var item=await db.Notifications.FirstOrDefaultAsync(x=>x.NotificationId==id)??throw new AppException(404,"Notification not found.");if(item.Status==NotificationStatuses.Sent)throw new AppException(409,"Sent notification cannot be edited.");if(!await db.Users.AnyAsync(x=>x.UserId==request.UserId&&x.IsActive))throw new AppException(404,"User not found.");item.UserId=request.UserId;item.Title=request.Title.Trim();item.Message=request.Message.Trim();item.NotificationType=NormalizeType(request.Type);item.ReferenceId=request.ReferenceId;await db.SaveChangesAsync();return ToDto(item);
    }

    public async Task DeleteDraftAsync(int id)
    {
        var item=await db.Notifications.FirstOrDefaultAsync(x=>x.NotificationId==id)??throw new AppException(404,"Notification not found.");if(item.Status==NotificationStatuses.Sent)throw new AppException(409,"Sent notification cannot be deleted.");db.Remove(item);await db.SaveChangesAsync();
    }

    public async Task<NotificationResponse> ScheduleAsync(int id,DateTime scheduledAt)
    {
        var item=await db.Notifications.FirstOrDefaultAsync(x=>x.NotificationId==id)??throw new AppException(404,"Notification not found.");
        if(item.Status==NotificationStatuses.Sent)throw new AppException(409,"Sent notification cannot be scheduled.");
        var utc=scheduledAt.ToUniversalTime();if(utc<=DateTime.UtcNow)throw new AppException(400,"Scheduled time must be in the future.");
        item.Status=NotificationStatuses.Scheduled;item.ScheduledAt=utc;await db.SaveChangesAsync();return ToDto(item);
    }

    public async Task<int> DispatchDueAsync(DateTime utcNow)
    {
        var due=await db.Notifications.Where(x=>x.Status==NotificationStatuses.Scheduled&&x.ScheduledAt<=utcNow).ToListAsync();
        foreach(var item in due){item.Status=NotificationStatuses.Sent;item.SentAt=utcNow;}
        if(due.Count>0)await db.SaveChangesAsync();return due.Count;
    }

    /// <summary>
    /// Gửi thông báo hàng loạt cho toàn bộ user (ALL) hoặc theo role (ROLE). Nếu có ScheduledAt thì
    /// tạo ở trạng thái SCHEDULED (worker gửi sau), ngược lại SENT ngay. Mỗi user một bản ghi với
    /// IdempotencyKey duy nhất theo batch để không tạo trùng.
    /// </summary>
    public async Task<BroadcastResultResponse> BroadcastAsync(int staffId,BroadcastNotificationRequest request)
    {
        var target=request.Target.Trim().ToUpperInvariant();
        if(target is not ("ALL" or "ROLE"))throw new AppException(400,"Target must be ALL or ROLE.");
        var type=NormalizeType(request.Type);
        var scheduled=request.ScheduledAt?.ToUniversalTime();
        if(scheduled.HasValue&&scheduled<=DateTime.UtcNow)throw new AppException(400,"Scheduled time must be in the future.");

        var users=db.Users.AsNoTracking().Where(x=>x.IsActive);
        string? role=null;
        if(target=="ROLE")
        {
            role=request.Role?.Trim().ToUpperInvariant();
            if(string.IsNullOrWhiteSpace(role)||!RoleNames.All.Contains(role))throw new AppException(400,"A valid role is required for ROLE target.");
            users=users.Where(x=>x.Role==role);
        }
        var userIds=await users.Select(x=>x.UserId).ToListAsync();
        if(userIds.Count==0)throw new AppException(404,"No active recipients found for the target.");

        var batchId=Guid.NewGuid().ToString("N");
        var now=DateTime.UtcNow;
        var status=scheduled.HasValue?NotificationStatuses.Scheduled:NotificationStatuses.Sent;
        foreach(var uid in userIds)
            db.Add(new Notification{UserId=uid,Title=request.Title.Trim(),Message=request.Message.Trim(),
                NotificationType=type,CreatedByUserId=staffId,Status=status,
                ScheduledAt=scheduled,SentAt=scheduled.HasValue?null:now,IdempotencyKey=$"BROADCAST:{batchId}:{uid}"});
        await db.SaveChangesAsync();
        return new(target,role,userIds.Count,status,scheduled);
    }

    public async Task<NotificationResponse> SendDomainAsync(int userId,string title,string message,string type,int referenceId,string key)
    {
        var existing=await db.Notifications.AsNoTracking().FirstOrDefaultAsync(x=>x.IdempotencyKey==key);
        if(existing is not null)return ToDto(existing);
        var item=new Notification{UserId=userId,Title=title,Message=message,NotificationType=NormalizeType(type),ReferenceId=referenceId,
            Status=NotificationStatuses.Sent,SentAt=DateTime.UtcNow,IdempotencyKey=key};
        db.Add(item);
        try
        {
            await db.SaveChangesAsync();
            return ToDto(item);
        }
        catch(DbUpdateException)
        {
            // Hai sự kiện nghiệp vụ cùng IdempotencyKey đến gần đồng thời; unique index chặn bản ghi
            // thứ hai. Trả về bản ghi đã tồn tại (idempotent) thay vì ném 500.
            db.Entry(item).State=EntityState.Detached;
            var saved=await db.Notifications.AsNoTracking().FirstOrDefaultAsync(x=>x.IdempotencyKey==key);
            if(saved is null)throw; // lỗi khác, không phải trùng khóa
            return ToDto(saved);
        }
    }

    public async Task<DeviceTokenResponse> RegisterTokenAsync(int userId,RegisterDeviceTokenRequest request)
    {
        var token=request.Token.Trim();var item=await db.FirebaseDeviceTokens.FirstOrDefaultAsync(x=>x.Token==token);
        if(item is null){item=new FirebaseDeviceToken{UserId=userId,Token=token,Platform=request.Platform.Trim().ToUpperInvariant()};db.Add(item);}
        else{item.UserId=userId;item.Platform=request.Platform.Trim().ToUpperInvariant();item.IsActive=true;item.UpdatedAt=DateTime.UtcNow;}
        await db.SaveChangesAsync();return new(item.FirebaseDeviceTokenId,item.Platform,item.IsActive,item.RegisteredAt);
    }

    public async Task DeactivateTokenAsync(int userId,int id)
    {
        var item=await db.FirebaseDeviceTokens.FirstOrDefaultAsync(x=>x.FirebaseDeviceTokenId==id&&x.UserId==userId)??throw new AppException(404,"Device token not found.");item.IsActive=false;item.UpdatedAt=DateTime.UtcNow;await db.SaveChangesAsync();
    }

    public async Task<List<NotificationTemplateResponse>> TemplatesAsync()=> (await db.NotificationTemplates.AsNoTracking().OrderBy(x=>x.TemplateKey).ToListAsync()).Select(ToDto).ToList();
    public async Task<NotificationTemplateResponse> CreateTemplateAsync(int staffId,NotificationTemplateRequest request)
    {
        var key=request.TemplateKey.Trim().ToUpperInvariant();if(await db.NotificationTemplates.AnyAsync(x=>x.TemplateKey==key))throw new AppException(409,"Notification template key already exists.");var item=new NotificationTemplate{TemplateKey=key,UpdatedByUserId=staffId};Apply(item,request);db.Add(item);await db.SaveChangesAsync();return ToDto(item);
    }
    public async Task<NotificationTemplateResponse> UpdateTemplateAsync(int id,int staffId,NotificationTemplateRequest request)
    {
        var item=await db.NotificationTemplates.FindAsync(id)??throw new AppException(404,"Notification template not found.");var key=request.TemplateKey.Trim().ToUpperInvariant();if(await db.NotificationTemplates.AnyAsync(x=>x.NotificationTemplateId!=id&&x.TemplateKey==key))throw new AppException(409,"Notification template key already exists.");item.TemplateKey=key;item.UpdatedByUserId=staffId;Apply(item,request);await db.SaveChangesAsync();return ToDto(item);
    }
    public async Task DeleteTemplateAsync(int id){var item=await db.NotificationTemplates.FindAsync(id)??throw new AppException(404,"Notification template not found.");db.Remove(item);await db.SaveChangesAsync();}
    private static void Apply(NotificationTemplate item,NotificationTemplateRequest request){item.TitleTemplate=request.TitleTemplate.Trim();item.MessageTemplate=request.MessageTemplate.Trim();item.NotificationType=NormalizeType(request.Type);item.IsActive=request.IsActive;item.UpdatedAt=DateTime.UtcNow;}
    private static NotificationTemplateResponse ToDto(NotificationTemplate x)=>new(x.NotificationTemplateId,x.TemplateKey,x.TitleTemplate,x.MessageTemplate,x.NotificationType,x.IsActive,x.UpdatedAt,x.UpdatedByUserId);

    private static string NormalizeType(string type)
    {
        var value=type.Trim().ToUpperInvariant();
        if(value is not (NotificationTypes.Order or NotificationTypes.Payment or NotificationTypes.Delivery or NotificationTypes.GrowingCycle or NotificationTypes.General))
            throw new AppException(400,"Invalid notification type.");
        return value;
    }
    private static NotificationResponse ToDto(Notification x)=>new(x.NotificationId,x.UserId,x.Title,x.Message,x.NotificationType,
        x.ReferenceId,x.IsRead,x.Status,x.ScheduledAt,x.SentAt,x.CreatedAt);
}
