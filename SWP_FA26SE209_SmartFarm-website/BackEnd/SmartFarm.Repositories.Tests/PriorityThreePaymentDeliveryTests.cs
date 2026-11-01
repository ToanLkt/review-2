using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;
using Xunit;

namespace SmartFarm.Repositories.Tests;

public class PriorityThreePaymentDeliveryTests
{
    private static AppDbContext Context()=>new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private static readonly SePayOptions Options=new(){WebhookSecret="test-secret",BankName="Test Bank",BankAccountNumber="123",AccountName="SMART FARM"};

    [Fact]
    public async Task Valid_webhook_confirms_order_and_duplicate_is_ignored()
    {
        await using var db=Context(); var (customer,order)=await SeedOrder(db,"PAY001",100);
        var service=new PaymentService(db,Options); await service.CreateAsync(customer.UserId,order.OrderId);
        var raw=Payload(1001,"PAY001",100); var timestamp=DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();

        var first=await service.HandleWebhookAsync(raw,Sign(raw,timestamp),timestamp);
        var second=await service.HandleWebhookAsync(raw,Sign(raw,timestamp),timestamp);

        Assert.Equal(PaymentExceptionTypes.None,first.Result); Assert.True(second.Duplicate);
        Assert.Equal(OrderStatus.Confirmed,(await db.Orders.FindAsync(order.OrderId))!.OrderStatus);
        Assert.Single(await db.PaymentWebhookEvents.ToListAsync());
    }

    [Fact]
    public async Task Successful_payment_activates_due_tray_rental_cycle()
    {
        await using var db=Context();
        var (customer,order,due,future)=await SeedTrayRentalOrder(db,"PAYTR1",100);
        var service=new PaymentService(db,Options); await service.CreateAsync(customer.UserId,order.OrderId);
        var raw=Payload(2001,"PAYTR1",100); var timestamp=DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();

        var result=await service.HandleWebhookAsync(raw,Sign(raw,timestamp),timestamp);

        Assert.Equal(PaymentExceptionTypes.None,result.Result);
        Assert.Equal(OrderStatus.Confirmed,(await db.Orders.FindAsync(order.OrderId))!.OrderStatus);
        // Khay đã tới ngày trồng -> PLANTED ngay khi thanh toán (không chờ worker).
        Assert.Equal(CropStatus.Planted,(await db.TrayRentals.FindAsync(due.RentalId))!.CropStatus);
        // Khay có ngày trồng tương lai -> vẫn WAITING_PLANTING, chờ worker kích hoạt sau.
        Assert.Equal(CropStatus.WaitingPlanting,(await db.TrayRentals.FindAsync(future.RentalId))!.CropStatus);
    }

    [Fact]
    public async Task Failed_payment_does_not_activate_tray_rental_cycle()
    {
        await using var db=Context();
        var (customer,order,due,_)=await SeedTrayRentalOrder(db,"PAYTR2",100);
        var service=new PaymentService(db,Options); await service.CreateAsync(customer.UserId,order.OrderId);
        var raw=Payload(2002,"PAYTR2",80); var timestamp=DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(); // trả thiếu

        var result=await service.HandleWebhookAsync(raw,Sign(raw,timestamp),timestamp);

        Assert.Equal(PaymentExceptionTypes.Underpaid,result.Result);
        Assert.Equal(OrderStatus.AwaitingPayment,(await db.Orders.FindAsync(order.OrderId))!.OrderStatus);
        // Thanh toán chưa hợp lệ -> không được bắt đầu trồng.
        Assert.Equal(CropStatus.WaitingPlanting,(await db.TrayRentals.FindAsync(due.RentalId))!.CropStatus);
    }

    [Fact]
    public async Task Underpayment_is_recorded_without_confirming_order()
    {
        await using var db=Context(); var (customer,order)=await SeedOrder(db,"PAY002",100);
        var service=new PaymentService(db,Options); await service.CreateAsync(customer.UserId,order.OrderId);
        var raw=Payload(1002,"PAY002",80); var timestamp=DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var result=await service.HandleWebhookAsync(raw,Sign(raw,timestamp),timestamp);
        Assert.Equal(PaymentExceptionTypes.Underpaid,result.Result);
        Assert.Equal(OrderStatus.AwaitingPayment,(await db.Orders.FindAsync(order.OrderId))!.OrderStatus);
        Assert.Equal(PaymentStatuses.Failed,(await db.Payments.SingleAsync()).PaymentStatus);
    }

    [Fact]
    public async Task Payment_code_is_extracted_from_content_when_SePay_code_is_null()
    {
        await using var db=Context(); var (customer,order)=await SeedOrder(db,"SP2026092304092593021",100);
        var service=new PaymentService(db,Options); await service.CreateAsync(customer.UserId,order.OrderId);
        var raw=Payload(1004,order.OrderCode,100).Replace(
            $"\"code\":\"{order.OrderCode}\",\"content\":\"{order.OrderCode}\"",
            $"\"code\":null,\"content\":\"bank transfer {order.OrderCode}\"");
        var timestamp=DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();

        var result=await service.HandleWebhookAsync(raw,Sign(raw,timestamp),timestamp);

        Assert.Equal(PaymentExceptionTypes.None,result.Result);
        Assert.Equal(OrderStatus.Confirmed,(await db.Orders.FindAsync(order.OrderId))!.OrderStatus);
        Assert.Equal(order.OrderCode,(await db.PaymentWebhookEvents.SingleAsync()).PaymentCode);
    }

    [Fact]
    public async Task Invalid_webhook_signature_is_rejected()
    {
        await using var db=Context(); var service=new PaymentService(db,Options);
        var timestamp=DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var error=await Assert.ThrowsAsync<AppException>(()=>service.HandleWebhookAsync(Payload(1003,"NONE",1),"sha256=bad",timestamp));
        Assert.Equal(401,error.StatusCode);
    }

    [Fact]
    public async Task Signed_SePay_test_webhook_is_accepted_without_persisting_transaction()
    {
        await using var db=Context(); var service=new PaymentService(db,Options);
        var raw=Payload(0,"SEPAYTEST",10000); var timestamp=DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();

        var result=await service.HandleWebhookAsync(raw,Sign(raw,timestamp),timestamp);

        Assert.Equal("TEST",result.Result);
        Assert.Empty(await db.PaymentWebhookEvents.ToListAsync());
    }

    [Fact]
    public async Task Later_mismatched_transaction_does_not_downgrade_successful_payment()
    {
        await using var db=Context();var (customer,order)=await SeedOrder(db,"PAY005",100);
        var service=new PaymentService(db,Options);await service.CreateAsync(customer.UserId,order.OrderId);
        var timestamp=DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var paid=Payload(1005,order.OrderCode,100);
        await service.HandleWebhookAsync(paid,Sign(paid,timestamp),timestamp);
        var extra=Payload(1006,order.OrderCode,100);
        var result=await service.HandleWebhookAsync(extra,Sign(extra,timestamp),timestamp);

        Assert.Equal(PaymentExceptionTypes.OrderStateMismatch,result.Result);
        var payment=await db.Payments.SingleAsync();
        Assert.Equal(PaymentStatuses.Success,payment.PaymentStatus);
        Assert.Equal("REF1005",payment.TransactionCode);
    }

    [Fact]
    public async Task Empty_exception_note_and_invalid_report_range_are_rejected()
    {
        await using var db=Context();var service=new PaymentService(db,Options);
        var noteError=await Assert.ThrowsAsync<AppException>(()=>service.NoteAsync(1,1,"   "));
        var reportError=await Assert.ThrowsAsync<AppException>(()=>service.ReportAsync(DateTime.UtcNow,DateTime.UtcNow.AddDays(-1)));
        Assert.Equal(400,noteError.StatusCode);Assert.Equal(400,reportError.StatusCode);
    }

    [Fact]
    public async Task Delivery_flow_updates_order_and_timestamps()
    {
        await using var db=Context(); var (_,order)=await SeedOrder(db,"DEL001",100,OrderStatus.Confirmed);
        var shipper=new User{Email="shipper@test.local",FullName="Staff Shipper",PasswordHash="x",Role=RoleNames.Staff};
        db.Add(shipper);await db.SaveChangesAsync(); var service=new DeliveryService(db);
        var delivery=await service.CreateAsync(new CreateDeliveryRequest(order.OrderId,null,"Receiver","0901234567","Address",null));
        await service.AssignAsync(delivery.DeliveryId,shipper.UserId);
        await service.UpdateAsync(delivery.DeliveryId,new UpdateDeliveryRequest(DeliveryStatuses.Packaged,"TRACK01",1.5f,null));
        await service.UpdateAsync(delivery.DeliveryId,new UpdateDeliveryRequest(DeliveryStatuses.Shipping,null,null,null));
        var delivered=await service.UpdateAsync(delivery.DeliveryId,new UpdateDeliveryRequest(DeliveryStatuses.Delivered,null,null,null));
        Assert.NotNull(delivered.ShippedAt);Assert.NotNull(delivered.DeliveredAt);
        Assert.Equal(OrderStatus.Completed,(await db.Orders.FindAsync(order.OrderId))!.OrderStatus);
    }

    [Fact]
    public async Task Customer_can_schedule_owned_order_but_not_another_customers_order()
    {
        await using var db=Context();var owner=new User{Email="delivery-owner@test.local",FullName="Owner",PasswordHash="x"};var other=new User{Email="delivery-other@test.local",FullName="Other",PasswordHash="x"};
        var order=new Order{Customer=owner,OrderCode="DEL-CUSTOMER",OrderType=OrderType.SeedPacket,OrderStatus=OrderStatus.Confirmed,ExpiresAt=DateTime.UtcNow.AddDays(1)};db.AddRange(owner,other,order);await db.SaveChangesAsync();var service=new DeliveryService(db);
        var scheduled=await service.ScheduleCustomerAsync(owner.UserId,order.OrderId,new("Owner","0901234567","Address",DateTime.UtcNow.AddDays(1),null));Assert.NotNull(scheduled.ScheduledDeliveryAt);Assert.Equal(OrderStatus.Preparing,order.OrderStatus);
        var updated=await service.ScheduleCustomerAsync(owner.UserId,order.OrderId,new("Owner","0901234567","New address",DateTime.UtcNow.AddDays(2),null));Assert.Equal(scheduled.DeliveryId,updated.DeliveryId);Assert.Equal("New address",updated.ShippingAddress);
        var error=await Assert.ThrowsAsync<AppException>(()=>service.ScheduleCustomerAsync(other.UserId,order.OrderId,new("Other","0901234567","X",DateTime.UtcNow.AddDays(1),null)));Assert.Equal(404,error.StatusCode);
    }

    [Fact]
    public async Task Cannot_assign_shipper_to_failed_or_delivered_delivery()
    {
        await using var db=Context(); var (_,order)=await SeedOrder(db,"DEL-ASSIGN",100,OrderStatus.Delivering);
        var shipper=new User{Email="shipper2@test.local",FullName="Shipper",PasswordHash="x",Role=RoleNames.Staff};
        var delivery=new Delivery{Order=order,RecipientName="R",RecipientPhone="0900000000",ShippingAddress="A",DeliveryStatus=DeliveryStatuses.Failed};
        db.AddRange(shipper,delivery);await db.SaveChangesAsync();
        var service=new DeliveryService(db);

        var err=await Assert.ThrowsAsync<AppException>(()=>service.AssignAsync(delivery.DeliveryId,shipper.UserId));
        Assert.Equal(409,err.StatusCode);
    }

    [Fact]
    public async Task Tray_rental_payment_requires_risk_acceptance()
    {
        await using var db=Context();
        var user=new User{Email="risk@test.local",FullName="Customer Risk",PasswordHash="x"};
        // Đơn thuê khay chưa tích đồng ý rủi ro -> không cho tạo thanh toán.
        var order=new Order{Customer=user,OrderCode="RISK01",OrderType=OrderType.TrayRental,OrderStatus=OrderStatus.AwaitingPayment,TotalAmount=100,ExpiresAt=DateTime.UtcNow.AddMinutes(20),IsRiskAccepted=false};
        db.Add(order);await db.SaveChangesAsync();
        var service=new PaymentService(db,Options);

        var blocked=await Assert.ThrowsAsync<AppException>(()=>service.CreateAsync(user.UserId,order.OrderId));
        Assert.Equal(409,blocked.StatusCode);

        // Sau khi khách tích đồng ý rủi ro -> tạo thanh toán thành công.
        order.IsRiskAccepted=true;await db.SaveChangesAsync();
        var ok=await service.CreateAsync(user.UserId,order.OrderId);
        Assert.Equal(order.OrderId,ok.OrderId);
    }

    [Fact]
    public async Task Expiring_order_also_marks_pending_payment_expired()
    {
        await using var db=Context();
        var user=new User{Email="exp@test.local",FullName="C",PasswordHash="x",Role=RoleNames.Customer};
        var order=new Order{Customer=user,OrderCode="EXP01",OrderType=OrderType.SeedPacket,OrderStatus=OrderStatus.AwaitingPayment,TotalAmount=100,CreatedAt=DateTime.UtcNow.AddHours(-1),ExpiresAt=DateTime.UtcNow.AddMinutes(-1)};
        db.Add(order);await db.SaveChangesAsync();
        db.Payments.Add(new Payment{OrderId=order.OrderId,PaymentStatus=PaymentStatuses.Pending});
        await db.SaveChangesAsync();
        var orders=new OrderService(db);

        var expired=await orders.ExpireAwaitingPaymentAsync(DateTime.UtcNow);

        Assert.Equal(1,expired);
        Assert.Equal(OrderStatus.Expired,(await db.Orders.FindAsync(order.OrderId))!.OrderStatus);
        var payment=await db.Payments.FirstAsync(p=>p.OrderId==order.OrderId);
        Assert.Equal(PaymentStatuses.Expired,payment.PaymentStatus); // payment khong con treo PENDING
    }

    private static async Task<(User,Order)> SeedOrder(AppDbContext db,string code,decimal amount,string status=OrderStatus.AwaitingPayment)
    {
        var user=new User{Email=$"{code}@test.local",FullName="Customer Test",PasswordHash="x"};
        var order=new Order{Customer=user,OrderCode=code,OrderType=OrderType.SeedPacket,OrderStatus=status,TotalAmount=amount,ExpiresAt=DateTime.UtcNow.AddMinutes(20)};
        db.Add(order);await db.SaveChangesAsync();return(user,order);
    }

    // Tạo đơn thuê khay AWAITING_PAYMENT với 2 TrayRental đều WAITING_PLANTING: một khay đã tới ngày
    // trồng (StartDate quá khứ) và một khay có ngày trồng ở tương lai. Dùng để kiểm tra kích hoạt khi thanh toán.
    private static async Task<(User,Order,TrayRental due,TrayRental future)> SeedTrayRentalOrder(AppDbContext db,string code,decimal amount)
    {
        var user=new User{Email=$"{code}@test.local",FullName="Customer Test",PasswordHash="x",Role=RoleNames.Customer};
        var zone=new FarmZone{ZoneName="Z",TotalCapacity=4};
        var rack=new FarmRack{Zone=zone,RackCode="R1",TotalTiers=1,MaxTraysPerTier=4};
        var tray1=new SoilTray{Rack=rack,TrayCode="T1",TierIndex=1,CurrentStatus=TrayStatus.Rented};
        var tray2=new SoilTray{Rack=rack,TrayCode="T2",TierIndex=1,CurrentStatus=TrayStatus.Rented};
        var supply=new Supply{SupplyName="Seed",SupplyType=SupplyType.Seed,HarvestDays=10,Unit="goi"};
        var order=new Order{Customer=user,OrderCode=code,OrderType=OrderType.TrayRental,OrderStatus=OrderStatus.AwaitingPayment,TotalAmount=amount,IsRiskAccepted=true,ExpiresAt=DateTime.UtcNow.AddMinutes(20)};
        var due=new TrayRental{Customer=user,SoilTray=tray1,Supply=supply,Order=order,StartDate=DateTime.UtcNow.AddHours(-1),ExpectedHarvestDate=DateTime.UtcNow.AddDays(10),CropStatus=CropStatus.WaitingPlanting};
        var future=new TrayRental{Customer=user,SoilTray=tray2,Supply=supply,Order=order,StartDate=DateTime.UtcNow.AddDays(2),ExpectedHarvestDate=DateTime.UtcNow.AddDays(12),CropStatus=CropStatus.WaitingPlanting};
        db.AddRange(zone,rack,tray1,tray2,supply,order,due,future);
        await db.SaveChangesAsync();
        return(user,order,due,future);
    }
    private static string Payload(long id,string code,decimal amount)=>
        $$"""{"id":{{id}},"gateway":"VCB","transactionDate":"{{DateTime.Now:yyyy-MM-dd HH:mm:ss}}","accountNumber":"123","code":"{{code}}","content":"{{code}}","transferType":"in","transferAmount":{{amount}},"referenceCode":"REF{{id}}"}""";
    private static string Sign(string raw,string timestamp)
    {
        var hash=HMACSHA256.HashData(Encoding.UTF8.GetBytes(Options.WebhookSecret),Encoding.UTF8.GetBytes($"{timestamp}.{raw}"));
        return "sha256="+Convert.ToHexString(hash).ToLowerInvariant();
    }
}
