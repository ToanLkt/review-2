using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Entities;

namespace SmartFarm.Repositories.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<MaterialMovement> MaterialMovements=>Set<MaterialMovement>();
    public DbSet<NotificationTemplate> NotificationTemplates=>Set<NotificationTemplate>();
    public DbSet<User> Users=>Set<User>(); public DbSet<RefreshToken> RefreshTokens=>Set<RefreshToken>(); public DbSet<FarmZone> FarmZones=>Set<FarmZone>(); public DbSet<FarmRack> FarmRacks=>Set<FarmRack>(); public DbSet<SoilTray> SoilTrays=>Set<SoilTray>(); public DbSet<Supply> Supplies=>Set<Supply>(); public DbSet<CropThreshold> CropThresholds=>Set<CropThreshold>(); public DbSet<CareSchedule> CareSchedules=>Set<CareSchedule>(); public DbSet<Order> Orders=>Set<Order>(); public DbSet<OrderItem> OrderItems=>Set<OrderItem>(); public DbSet<TrayRental> TrayRentals=>Set<TrayRental>(); public DbSet<DailyTask> DailyTasks=>Set<DailyTask>(); public DbSet<Payment> Payments=>Set<Payment>(); public DbSet<PaymentWebhookEvent> PaymentWebhookEvents=>Set<PaymentWebhookEvent>(); public DbSet<Delivery> Deliveries=>Set<Delivery>(); public DbSet<Notification> Notifications=>Set<Notification>(); public DbSet<FirebaseDeviceToken> FirebaseDeviceTokens=>Set<FirebaseDeviceToken>(); public DbSet<IoTDevice> IoTDevices=>Set<IoTDevice>(); public DbSet<TrayDevice> TrayDevices=>Set<TrayDevice>(); public DbSet<SensorTelemetry> SensorTelemetry=>Set<SensorTelemetry>(); public DbSet<CameraSnapshot> CameraSnapshots=>Set<CameraSnapshot>(); public DbSet<ActuatorLog> ActuatorLogs=>Set<ActuatorLog>(); public DbSet<SystemAlert> SystemAlerts=>Set<SystemAlert>(); public DbSet<Cart> Carts=>Set<Cart>(); public DbSet<CartItem> CartItems=>Set<CartItem>(); public DbSet<FarmConfig> FarmConfigs=>Set<FarmConfig>(); public DbSet<Review> Reviews=>Set<Review>();
    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<MaterialMovement>().HasKey(x=>x.MovementId);
        b.Entity<NotificationTemplate>().HasKey(x=>x.NotificationTemplateId); b.Entity<NotificationTemplate>().HasIndex(x=>x.TemplateKey).IsUnique(); b.Entity<NotificationTemplate>().HasOne(x=>x.UpdatedByUser).WithMany().HasForeignKey(x=>x.UpdatedByUserId).OnDelete(DeleteBehavior.SetNull);
        b.Entity<SensorTelemetry>().HasIndex(x=>x.MessageId).IsUnique();
        b.Entity<MaterialMovement>().HasIndex(x=>new{x.OrderId,x.SupplyId,x.MovementType}).IsUnique(); b.Entity<SystemAlert>().HasOne(x=>x.Supply).WithMany().HasForeignKey(x=>x.SupplyId).OnDelete(DeleteBehavior.SetNull);
        b.Entity<FarmZone>().HasKey(x=>x.ZoneId); b.Entity<FarmRack>().HasKey(x=>x.RackId); b.Entity<Supply>().HasKey(x=>x.SupplyId); b.Entity<CropThreshold>().HasKey(x=>x.ThresholdId); b.Entity<CareSchedule>().HasKey(x=>x.ScheduleId); b.Entity<TrayRental>().HasKey(x=>x.RentalId); b.Entity<DailyTask>().HasKey(x=>x.TaskId); b.Entity<PaymentWebhookEvent>().HasKey(x=>x.PaymentWebhookEventId); b.Entity<FirebaseDeviceToken>().HasKey(x=>x.FirebaseDeviceTokenId); b.Entity<IoTDevice>().HasKey(x=>x.DeviceId); b.Entity<SensorTelemetry>().HasKey(x=>x.TelemetryId); b.Entity<CameraSnapshot>().HasKey(x=>x.SnapshotId); b.Entity<ActuatorLog>().HasKey(x=>x.LogId); b.Entity<SystemAlert>().HasKey(x=>x.AlertId);
        b.Entity<User>().HasIndex(x=>x.Email).IsUnique(); b.Entity<RefreshToken>().HasIndex(x=>x.TokenHash).IsUnique(); b.Entity<FarmZone>().HasIndex(x=>x.ZoneName).IsUnique(); b.Entity<FarmRack>().HasIndex(x=>x.RackCode).IsUnique(); b.Entity<SoilTray>().HasIndex(x=>x.TrayCode).IsUnique(); b.Entity<IoTDevice>().HasIndex(x=>x.DeviceCode).IsUnique(); b.Entity<IoTDevice>().HasIndex(x=>x.MacAddress).IsUnique(); b.Entity<TrayDevice>().HasIndex(x=>new{x.SoilTrayId,x.DeviceId,x.ComponentType}).IsUnique(); b.Entity<Order>().HasIndex(x=>x.OrderCode).IsUnique(); b.Entity<Payment>().HasIndex(x=>x.TransactionCode).IsUnique(); b.Entity<Payment>().HasIndex(x=>x.OrderId).IsUnique(); b.Entity<PaymentWebhookEvent>().HasIndex(x=>x.SePayTransactionId).IsUnique(); b.Entity<Delivery>().HasIndex(x=>new{x.OrderId,x.CycleNumber}).IsUnique(); b.Entity<Notification>().HasIndex(x=>x.IdempotencyKey).IsUnique(); b.Entity<FirebaseDeviceToken>().HasIndex(x=>x.Token).IsUnique();
        b.Entity<Supply>().Property(x=>x.CostPrice).HasPrecision(12,2); b.Entity<Supply>().Property(x=>x.UnitPrice).HasPrecision(12,2); b.Entity<Supply>().Property(x=>x.RentalPrice).HasPrecision(12,2); b.Entity<Order>().Property(x=>x.TotalAmount).HasPrecision(12,2); b.Entity<Order>().Property(x=>x.Subtotal).HasPrecision(12,2); b.Entity<Order>().Property(x=>x.DiscountPercent).HasPrecision(5,2); b.Entity<Order>().Property(x=>x.DiscountAmount).HasPrecision(12,2); b.Entity<OrderItem>().Property(x=>x.UnitPrice).HasPrecision(12,2); b.Entity<OrderItem>().Property(x=>x.Subtotal).HasPrecision(12,2); b.Entity<Payment>().Property(x=>x.AmountPaid).HasPrecision(12,2); b.Entity<Payment>().Property(x=>x.SePayPayload).HasColumnType("json"); b.Entity<PaymentWebhookEvent>().Property(x=>x.TransferAmount).HasPrecision(12,2); b.Entity<PaymentWebhookEvent>().Property(x=>x.RawPayload).HasColumnType("json");
        b.Entity<Delivery>().HasOne(x=>x.Order).WithMany().HasForeignKey(x=>x.OrderId).OnDelete(DeleteBehavior.Restrict); b.Entity<Delivery>().HasOne(x=>x.Rental).WithMany().HasForeignKey(x=>x.RentalId).OnDelete(DeleteBehavior.SetNull); b.Entity<Delivery>().HasOne(x=>x.Shipper).WithMany().HasForeignKey(x=>x.ShipperId).OnDelete(DeleteBehavior.SetNull); b.Entity<Payment>().HasOne(x=>x.ReviewedByUser).WithMany().HasForeignKey(x=>x.ReviewedByUserId).OnDelete(DeleteBehavior.SetNull); b.Entity<PaymentWebhookEvent>().HasOne(x=>x.Order).WithMany().HasForeignKey(x=>x.OrderId).OnDelete(DeleteBehavior.SetNull); b.Entity<PaymentWebhookEvent>().HasOne(x=>x.Payment).WithMany().HasForeignKey(x=>x.PaymentId).OnDelete(DeleteBehavior.SetNull); b.Entity<PaymentWebhookEvent>().HasOne(x=>x.ReviewedByUser).WithMany().HasForeignKey(x=>x.ReviewedByUserId).OnDelete(DeleteBehavior.SetNull); b.Entity<DailyTask>().HasOne(x=>x.AssignedUser).WithMany().HasForeignKey(x=>x.AssignedUserId).OnDelete(DeleteBehavior.SetNull); b.Entity<ActuatorLog>().HasOne(x=>x.RequestedByUser).WithMany().HasForeignKey(x=>x.RequestedByUserId).OnDelete(DeleteBehavior.SetNull); b.Entity<SystemAlert>().HasOne(x=>x.Rental).WithMany().HasForeignKey(x=>x.RentalId).OnDelete(DeleteBehavior.SetNull);
        b.Entity<Notification>().HasOne(x=>x.CreatedByUser).WithMany().HasForeignKey(x=>x.CreatedByUserId).OnDelete(DeleteBehavior.SetNull); b.Entity<FirebaseDeviceToken>().HasOne(x=>x.User).WithMany().HasForeignKey(x=>x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Cart>().HasKey(x=>x.CartId); b.Entity<Cart>().HasIndex(x=>x.CustomerId).IsUnique(); b.Entity<Cart>().HasOne(x=>x.Customer).WithMany().HasForeignKey(x=>x.CustomerId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<CartItem>().HasKey(x=>x.CartItemId); b.Entity<CartItem>().HasOne(x=>x.Cart).WithMany(c=>c.Items).HasForeignKey(x=>x.CartId).OnDelete(DeleteBehavior.Cascade); b.Entity<CartItem>().HasOne(x=>x.SeedVariety).WithMany().HasForeignKey(x=>x.SeedVarietyId).OnDelete(DeleteBehavior.Restrict); b.Entity<CartItem>().HasOne(x=>x.FarmArea).WithMany().HasForeignKey(x=>x.FarmAreaId).OnDelete(DeleteBehavior.SetNull);
        b.Entity<FarmConfig>().HasKey(x=>x.ConfigId); b.Entity<FarmConfig>().Property(x=>x.StandardDiscountPercent).HasPrecision(5,2); b.Entity<FarmConfig>().Property(x=>x.LoyalDiscountPercent).HasPrecision(5,2);
        b.Entity<Review>().HasKey(x=>x.ReviewId); b.Entity<Review>().HasIndex(x=>x.OrderId).IsUnique(); b.Entity<Review>().HasOne(x=>x.Order).WithMany().HasForeignKey(x=>x.OrderId).OnDelete(DeleteBehavior.Cascade); b.Entity<Review>().HasOne(x=>x.Customer).WithMany().HasForeignKey(x=>x.CustomerId).OnDelete(DeleteBehavior.Restrict); b.Entity<Review>().ToTable(t=>t.HasCheckConstraint("CK_Review_Rating","`Rating` BETWEEN 1 AND 5"));
    }

    // Tự động cập nhật User.UpdatedAt mỗi khi bản ghi User bị sửa, để không phải set thủ công ở từng service.
    private void TouchUpdatedUsers()
    {
        foreach (var entry in ChangeTracker.Entries<User>())
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
    }

    public override int SaveChanges()
    {
        TouchUpdatedUsers();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        TouchUpdatedUsers();
        return base.SaveChangesAsync(cancellationToken);
    }
}
