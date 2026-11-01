using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Services;

namespace SmartFarm.Api.Data;

/// <summary>
/// Seed dữ liệu mẫu để FE/người test có thể dùng ngay sau khi dựng DB.
/// Mỗi khối chỉ chạy khi bảng tương ứng còn rỗng (idempotent — chạy lại không nhân đôi dữ liệu).
/// Chỉ seed master data + vài mẫu rõ ràng; KHÔNG seed đơn đã thanh toán/giao (các luồng đó test qua API thật).
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, IConfiguration config)
    {
        await db.Database.MigrateAsync();
        var password = config["Seed:DefaultPassword"] ?? "Admin@12345";

        // 1) Tài khoản: admin, staff, và 2 customer mẫu (đã xác nhận email để login ngay).
        if (!await db.Users.AnyAsync())
            db.Users.AddRange(
                new User { Email = "admin@smartfarm.local", FullName = "System Admin", PasswordHash = PasswordHasher.Hash(password), Role = RoleNames.Admin, EmailConfirmed = true },
                new User { Email = "staff@smartfarm.local", FullName = "Farm Staff", PasswordHash = PasswordHasher.Hash(password), Role = RoleNames.Staff, EmailConfirmed = true },
                new User { Email = "customer@smartfarm.local", FullName = "Nguyễn Văn Khách", PasswordHash = PasswordHasher.Hash(password), Role = RoleNames.Customer, EmailConfirmed = true, PhoneNumber = "0900000001", Address = "Vinhomes Grand Park, TP.HCM" },
                new User { Email = "customer2@smartfarm.local", FullName = "Trần Thị Hàng", PasswordHash = PasswordHasher.Hash(password), Role = RoleNames.Customer, EmailConfirmed = true, PhoneNumber = "0900000002", Address = "Quận 9, TP.HCM" });

        // 2) Vật tư: hạt giống (SEED) + giá thể/bao bì/thiết bị để test đủ loại SupplyType và tồn kho.
        if (!await db.Supplies.AnyAsync())
            db.Supplies.AddRange(
                new Supply { SupplyName = "Rau muống mầm", SupplyType = SupplyType.Seed, Description = "Microgreen dễ trồng, vị ngọt nhẹ", HarvestDays = 10, CostPrice = 30000, UnitPrice = 45000, RentalPrice = 65000, QuantityInStock = 100, Unit = "GÓI", MinStockLevel = 10, IsActive = true },
                new Supply { SupplyName = "Cải xanh mầm", SupplyType = SupplyType.Seed, Description = "Vị cay nhẹ, giàu vitamin C", HarvestDays = 8, CostPrice = 25000, UnitPrice = 40000, RentalPrice = 55000, QuantityInStock = 80, Unit = "GÓI", MinStockLevel = 10, IsActive = true },
                new Supply { SupplyName = "Hướng dương mầm", SupplyType = SupplyType.Seed, Description = "Giòn, vị bùi, giàu protein", HarvestDays = 12, CostPrice = 40000, UnitPrice = 60000, RentalPrice = 85000, QuantityInStock = 60, Unit = "GÓI", MinStockLevel = 8, IsActive = true },
                new Supply { SupplyName = "Giá thể xơ dừa", SupplyType = SupplyType.SoilSubstrate, Description = "Giá thể trồng rau mầm", HarvestDays = 0, CostPrice = 15000, UnitPrice = 25000, RentalPrice = 0, QuantityInStock = 200, Unit = "KG", MinStockLevel = 20, IsActive = true },
                new Supply { SupplyName = "Hộp đóng gói 250g", SupplyType = SupplyType.Packaging, Description = "Hộp nhựa đựng rau thu hoạch", HarvestDays = 0, CostPrice = 2000, UnitPrice = 3500, RentalPrice = 0, QuantityInStock = 500, Unit = "CÁI", MinStockLevel = 50, IsActive = true });

        await db.SaveChangesAsync();

        // 3) Khu/kệ/khay: Khu A (40 khay) + Khu B (20 khay) để test nhiều farm area.
        if (!await db.FarmZones.AnyAsync())
        {
            var zoneA = new FarmZone { ZoneName = "Khu A", LocationDescription = "Nhà kính số 1", TotalCapacity = 40, IsActive = true };
            var rackA = new FarmRack { RackCode = "A-R01", TotalTiers = 4, MaxTraysPerTier = 10 };
            for (var i = 1; i <= 40; i++) rackA.SoilTrays.Add(new SoilTray { TrayCode = $"A-{i:D3}", TierIndex = ((i - 1) / 10) + 1, CurrentStatus = TrayStatus.Available });
            zoneA.FarmRacks.Add(rackA);

            var zoneB = new FarmZone { ZoneName = "Khu B", LocationDescription = "Nhà kính số 2", TotalCapacity = 20, IsActive = true };
            var rackB = new FarmRack { RackCode = "B-R01", TotalTiers = 2, MaxTraysPerTier = 10 };
            for (var i = 1; i <= 20; i++) rackB.SoilTrays.Add(new SoilTray { TrayCode = $"B-{i:D3}", TierIndex = ((i - 1) / 10) + 1, CurrentStatus = TrayStatus.Available });
            zoneB.FarmRacks.Add(rackB);

            db.FarmZones.AddRange(zoneA, zoneB);
            await db.SaveChangesAsync();
        }

        // 5) Ngưỡng IoT + lịch chăm sóc theo giống cây (lấy giống đầu tiên làm mẫu).
        var seed = await db.Supplies.FirstOrDefaultAsync(x => x.SupplyType == SupplyType.Seed);
        if (seed is not null && !await db.CropThresholds.AnyAsync())
        {
            db.CropThresholds.AddRange(
                new CropThreshold { SupplyId = seed.SupplyId, Stage = GrowthStage.Germination, MinSoilMoisture = 50, MaxSoilMoisture = 80, MinAirHumidity = 60, MaxAirHumidity = 90, MinTemperature = 22, MaxTemperature = 28, MinLightIntensity = 0, MaxLightIntensity = 200, LightHoursPerDay = 6 },
                new CropThreshold { SupplyId = seed.SupplyId, Stage = GrowthStage.Growing, MinSoilMoisture = 40, MaxSoilMoisture = 70, MinAirHumidity = 50, MaxAirHumidity = 80, MinTemperature = 20, MaxTemperature = 30, MinLightIntensity = 100, MaxLightIntensity = 500, LightHoursPerDay = 12 },
                new CropThreshold { SupplyId = seed.SupplyId, Stage = GrowthStage.Harvest, MinSoilMoisture = 35, MaxSoilMoisture = 60, MinAirHumidity = 45, MaxAirHumidity = 70, MinTemperature = 18, MaxTemperature = 28, MinLightIntensity = 150, MaxLightIntensity = 600, LightHoursPerDay = 10 });
            await db.SaveChangesAsync();
        }
        if (seed is not null && !await db.CareSchedules.AnyAsync())
        {
            db.CareSchedules.AddRange(
                new CareSchedule { SupplyId = seed.SupplyId, DayIndex = 1, TaskName = "Gieo hạt và tưới ẩm", TaskDescription = "Rải hạt đều, phun sương giữ ẩm", TargetStage = GrowthStage.Germination },
                new CareSchedule { SupplyId = seed.SupplyId, DayIndex = 3, TaskName = "Kiểm tra độ ẩm", TaskDescription = "Tưới nếu giá thể khô", TargetStage = GrowthStage.Germination },
                new CareSchedule { SupplyId = seed.SupplyId, DayIndex = 5, TaskName = "Đưa ra ánh sáng", TaskDescription = "Bật đèn LED theo lịch", TargetStage = GrowthStage.Growing },
                new CareSchedule { SupplyId = seed.SupplyId, DayIndex = 10, TaskName = "Thu hoạch", TaskDescription = "Cắt rau mầm, đóng gói", TargetStage = GrowthStage.Harvest });
            await db.SaveChangesAsync();
        }

        // 6) Thiết bị IoT mẫu + gán 1 camera + 1 cảm biến độ ẩm vào khay đầu tiên của Khu A.
        if (!await db.IoTDevices.AnyAsync())
        {
            var esp = new IoTDevice { DeviceCode = "ESP32-A01", MacAddress = "AA:BB:CC:DD:EE:01", DeviceType = "ESP32", FirmwareVersion = "1.0.0", Status = DeviceStatuses.Offline };
            var cam = new IoTDevice { DeviceCode = "CAM-A01", MacAddress = "AA:BB:CC:DD:EE:02", DeviceType = "CAMERA", FirmwareVersion = "1.0.0", Status = DeviceStatuses.Offline };
            db.IoTDevices.AddRange(esp, cam);
            await db.SaveChangesAsync();

            var firstTray = await db.SoilTrays.OrderBy(x => x.SoilTrayId).FirstOrDefaultAsync();
            if (firstTray is not null)
                db.TrayDevices.AddRange(
                    new TrayDevice { SoilTrayId = firstTray.SoilTrayId, DeviceId = esp.DeviceId, PinNumber = "A1", ComponentType = ComponentTypes.SoilMoisture, IsActive = true },
                    new TrayDevice { SoilTrayId = firstTray.SoilTrayId, DeviceId = cam.DeviceId, ComponentType = ComponentTypes.Light, IsActive = true });
            await db.SaveChangesAsync();
        }

        // 7) Cấu hình trang trại: 1 bản ghi cố định (ConfigId=1) dùng cho đặt trước, kích thước khay, ưu đãi, tài khoản VietQR.
        if (!await db.FarmConfigs.AnyAsync())
        {
            db.FarmConfigs.Add(new FarmConfig { FarmName = "SmartFarm", MaxPreOrderDays = 7, StandardTraySize = "32x24x4 cm", MaxDeliveryRadiusKm = 10.0f, FarmLatitude = 10.762622, FarmLongitude = 106.660172, DiscountCycleThreshold = 3, DiscountTrayThreshold = 3, LoyalOrderThreshold = 5, StandardDiscountPercent = 10.00m, LoyalDiscountPercent = 15.00m, UpdatedAt = DateTime.UtcNow });
            await db.SaveChangesAsync();
        }
    }
}
