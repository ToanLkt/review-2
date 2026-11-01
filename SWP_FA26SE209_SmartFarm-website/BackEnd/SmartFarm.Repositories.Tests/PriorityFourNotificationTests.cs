using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;
using Xunit;

namespace SmartFarm.Repositories.Tests;

public class PriorityFourNotificationTests
{
    private static AppDbContext Context()=>new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Staff_can_create_schedule_dispatch_and_user_can_read_notification()
    {
        await using var db=Context();var (customer,staff)=await SeedUsers(db);var service=new NotificationService(db);
        var created=await service.CreateDraftAsync(staff.UserId,new(customer.UserId,"Scheduled","Message",NotificationTypes.General,null,null));
        Assert.Equal(NotificationStatuses.Draft,created.Status);
        var scheduled=await service.ScheduleAsync(created.NotificationId,DateTime.UtcNow.AddMinutes(5));
        Assert.Equal(NotificationStatuses.Scheduled,scheduled.Status);
        Assert.Equal(1,await service.DispatchDueAsync(DateTime.UtcNow.AddMinutes(6)));
        var list=await service.ListAsync(customer.UserId,new QueryRequest(),false);
        Assert.Single(list.Items);
        var read=await service.MarkReadAsync(customer.UserId,created.NotificationId);
        Assert.True(read.IsRead);Assert.Equal(NotificationStatuses.Sent,read.Status);
    }

    [Fact]
    public async Task Domain_notification_and_firebase_token_are_idempotent()
    {
        await using var db=Context();var (customer,_)=await SeedUsers(db);var service=new NotificationService(db);
        var first=await service.SendDomainAsync(customer.UserId,"Paid","Done",NotificationTypes.Payment,12,"PAYMENT:12");
        var second=await service.SendDomainAsync(customer.UserId,"Paid","Done",NotificationTypes.Payment,12,"PAYMENT:12");
        Assert.Equal(first.NotificationId,second.NotificationId);Assert.Single(await db.Notifications.ToListAsync());
        var token1=await service.RegisterTokenAsync(customer.UserId,new("firebase-token","ios"));
        var token2=await service.RegisterTokenAsync(customer.UserId,new("firebase-token","android"));
        Assert.Equal(token1.DeviceTokenId,token2.DeviceTokenId);Assert.Equal("ANDROID",token2.Platform);
        Assert.Single(await db.FirebaseDeviceTokens.ToListAsync());
    }

    [Fact]
    public async Task Delivery_status_creates_only_one_notification_per_status()
    {
        await using var db=Context();var (customer,_)=await SeedUsers(db);
        var order=new Order{CustomerId=customer.UserId,Customer=customer,OrderCode="NOTIFY01",OrderType=OrderType.SeedPacket,OrderStatus=OrderStatus.Confirmed,ExpiresAt=DateTime.UtcNow.AddMinutes(5)};
        db.Add(order);await db.SaveChangesAsync();var notifications=new NotificationService(db);var deliveryService=new DeliveryService(db,notifications);
        var delivery=await deliveryService.CreateAsync(new(order.OrderId,null,"Receiver","0900000000","Address",null));
        await deliveryService.UpdateAsync(delivery.DeliveryId,new(DeliveryStatuses.Packaged,null,null,null));
        await deliveryService.UpdateAsync(delivery.DeliveryId,new(DeliveryStatuses.Packaged,null,null,null));
        Assert.Equal(2,await db.Notifications.CountAsync());
    }

    [Fact]
    public async Task Staff_can_edit_delete_drafts_and_manage_templates()
    {
        await using var db=Context();var(customer,staff)=await SeedUsers(db);var service=new NotificationService(db);
        var draft=await service.CreateDraftAsync(staff.UserId,new(customer.UserId,"Old","Message",NotificationTypes.General,null,null));var updated=await service.UpdateDraftAsync(draft.NotificationId,new(customer.UserId,"New","Updated",NotificationTypes.Order,7));Assert.Equal("New",updated.Title);
        await service.DeleteDraftAsync(draft.NotificationId);Assert.Empty(await db.Notifications.ToListAsync());
        var template=await service.CreateTemplateAsync(staff.UserId,new("order_confirmed","Order {code}","Confirmed",NotificationTypes.Order));Assert.Equal("ORDER_CONFIRMED",template.TemplateKey);
        var changed=await service.UpdateTemplateAsync(template.TemplateId,staff.UserId,new("order_confirmed","Updated {code}","Confirmed",NotificationTypes.Order));Assert.Equal("Updated {code}",changed.TitleTemplate);Assert.Single(await service.TemplatesAsync());
        await service.DeleteTemplateAsync(template.TemplateId);Assert.Empty(await db.NotificationTemplates.ToListAsync());
    }

    [Fact]
    public async Task Sent_notification_cannot_be_edited_or_deleted_and_token_can_be_deactivated()
    {
        await using var db=Context();var(customer,staff)=await SeedUsers(db);var service=new NotificationService(db);var sent=await service.SendDomainAsync(customer.UserId,"Sent","Body",NotificationTypes.General,1,"SENT:1");
        Assert.Equal(409,(await Assert.ThrowsAsync<SmartFarm.Services.AppException>(()=>service.UpdateDraftAsync(sent.NotificationId,new(customer.UserId,"X","Y",NotificationTypes.General,null)))).StatusCode);Assert.Equal(409,(await Assert.ThrowsAsync<SmartFarm.Services.AppException>(()=>service.DeleteDraftAsync(sent.NotificationId))).StatusCode);
        var token=await service.RegisterTokenAsync(customer.UserId,new("token-to-disable","ios"));await service.DeactivateTokenAsync(customer.UserId,token.DeviceTokenId);Assert.False((await db.FirebaseDeviceTokens.FindAsync(token.DeviceTokenId))!.IsActive);
    }

    [Fact]
    public async Task Broadcast_all_sends_to_every_active_user_now()
    {
        await using var db=Context();var(customer,staff)=await SeedUsers(db);
        db.Add(new User{Email="c2@test.local",FullName="C2",PasswordHash="x",Role=RoleNames.Customer});
        db.Add(new User{Email="off@test.local",FullName="Off",PasswordHash="x",Role=RoleNames.Customer,IsActive=false});
        await db.SaveChangesAsync();
        var service=new NotificationService(db);

        var result=await service.BroadcastAsync(staff.UserId,
            new("ALL",null,"Bảo trì","Hệ thống bảo trì 22h",NotificationTypes.General,null));

        Assert.Equal(3,result.Recipients); // customer + staff + c2, KHÔNG gồm user inactive
        Assert.Equal(NotificationStatuses.Sent,result.Status);
        Assert.Equal(3,await db.Notifications.CountAsync(x=>x.Status==NotificationStatuses.Sent));
    }

    [Fact]
    public async Task Broadcast_role_targets_only_that_role()
    {
        await using var db=Context();var(customer,staff)=await SeedUsers(db);
        db.Add(new User{Email="c2@test.local",FullName="C2",PasswordHash="x",Role=RoleNames.Customer});
        await db.SaveChangesAsync();
        var service=new NotificationService(db);

        var result=await service.BroadcastAsync(staff.UserId,
            new("ROLE",RoleNames.Customer,"Ưu đãi","Giảm giá","GENERAL",null));

        Assert.Equal(2,result.Recipients); // chỉ 2 customer
        Assert.Equal(RoleNames.Customer,result.Role);
    }

    [Fact]
    public async Task Broadcast_scheduled_creates_scheduled_notifications()
    {
        await using var db=Context();var(customer,staff)=await SeedUsers(db);
        var service=new NotificationService(db);

        var result=await service.BroadcastAsync(staff.UserId,
            new("ALL",null,"Sắp tới","Nội dung",NotificationTypes.General,DateTime.UtcNow.AddHours(1)));

        Assert.Equal(NotificationStatuses.Scheduled,result.Status);
        Assert.Equal(2,await db.Notifications.CountAsync(x=>x.Status==NotificationStatuses.Scheduled));
        Assert.Equal(0,await db.Notifications.CountAsync(x=>x.Status==NotificationStatuses.Sent));
    }

    [Fact]
    public async Task Broadcast_role_without_role_is_rejected()
    {
        await using var db=Context();var(_,staff)=await SeedUsers(db);
        var service=new NotificationService(db);

        var err=await Assert.ThrowsAsync<SmartFarm.Services.AppException>(()=>
            service.BroadcastAsync(staff.UserId,new("ROLE",null,"T","M",NotificationTypes.General,null)));
        Assert.Equal(400,err.StatusCode);
    }

    private static async Task<(User customer,User staff)> SeedUsers(AppDbContext db)
    {
        var customer=new User{Email="customer@test.local",FullName="Customer",PasswordHash="x",Role=RoleNames.Customer};
        var staff=new User{Email="staff@test.local",FullName="Staff",PasswordHash="x",Role=RoleNames.Staff};
        db.AddRange(customer,staff);await db.SaveChangesAsync();return(customer,staff);
    }
}
