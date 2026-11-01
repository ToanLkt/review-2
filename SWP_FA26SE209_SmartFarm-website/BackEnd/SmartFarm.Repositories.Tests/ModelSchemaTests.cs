using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using Xunit;

namespace SmartFarm.Repositories.Tests;

public class ModelSchemaTests
{
    private static AppDbContext CreateContext()
    {
        var options=new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new AppDbContext(options);
    }

    [Fact]
    public void Model_contains_every_erd_entity()
    {
        using var db=CreateContext();
        var expected=new[]
        {
            typeof(User),typeof(RefreshToken),typeof(FarmZone),typeof(FarmRack),typeof(SoilTray),
            typeof(Supply),typeof(CropThreshold),typeof(CareSchedule),typeof(Order),typeof(OrderItem),
            typeof(TrayRental),typeof(DailyTask),typeof(Payment),typeof(Delivery),typeof(Notification),typeof(FirebaseDeviceToken),
            typeof(IoTDevice),typeof(TrayDevice),typeof(SensorTelemetry),typeof(CameraSnapshot),
            typeof(ActuatorLog),typeof(SystemAlert)
        };
        foreach(var type in expected) Assert.NotNull(db.Model.FindEntityType(type));
    }

    [Fact]
    public void User_contains_email_confirmation_and_role_columns()
    {
        using var db=CreateContext();
        var user=db.Model.FindEntityType(typeof(User))!;
        Assert.NotNull(user.FindProperty(nameof(User.EmailConfirmed)));
        Assert.NotNull(user.FindProperty(nameof(User.Role)));
        Assert.Null(db.Model.FindEntityType("SmartFarm.Repositories.Entities.Role"));
    }

    [Theory]
    [InlineData(typeof(Order), nameof(Order.TotalAmount), 12, 2)]
    [InlineData(typeof(Payment), nameof(Payment.AmountPaid), 12, 2)]
    [InlineData(typeof(Supply), nameof(Supply.RentalPrice), 12, 2)]
    public void Money_columns_have_fixed_precision(Type entityType,string property,int precision,int scale)
    {
        using var db=CreateContext();
        var metadata=db.Model.FindEntityType(entityType)!.FindProperty(property)!;
        Assert.Equal(precision,metadata.GetPrecision());
        Assert.Equal(scale,metadata.GetScale());
    }
}
