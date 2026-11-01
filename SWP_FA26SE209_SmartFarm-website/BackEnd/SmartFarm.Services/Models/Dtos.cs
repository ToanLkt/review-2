using System.ComponentModel.DataAnnotations;

namespace SmartFarm.Services.Models;

// ---- Auth ----
public record RegisterRequest(
    [Required, EmailAddress, MaxLength(100)] string Email,
    [Required, MinLength(8), MaxLength(100)] string Password,
    [Required, MaxLength(100)] string FullName,
    [Phone, MaxLength(20)] string? Phone,
    [MaxLength(255)] string? Address);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);


public record ForgotPasswordRequest([Required, EmailAddress] string Email);

public record ResetPasswordRequest(
    [Required, EmailAddress] string Email,
    [Required] string ResetToken,
    [Required, MinLength(8), MaxLength(100)] string NewPassword);

public record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required, MinLength(8), MaxLength(100)] string NewPassword);

public record UpdateProfileRequest(
    [Required, MaxLength(100)] string FullName,
    [Phone, MaxLength(20)] string? Phone,
    [MaxLength(255)] string? Address);

public class UserResponse
{
    public UserResponse() { }
    public UserResponse(int userId, string email, string fullName, string? phone, string? address, string role, bool isActive, bool emailConfirmed, DateTime createdAt, string? avatarUrl = null, DateTime? updatedAt = null)
    { UserId=userId; Email=email; FullName=fullName; Phone=phone; Address=address; Role=role; IsActive=isActive; EmailConfirmed=emailConfirmed; CreatedAt=createdAt; AvatarUrl=avatarUrl; UpdatedAt=updatedAt; }
    public int UserId { get; set; } public string Email { get; set; } = ""; public string FullName { get; set; } = "";
    public string? Phone { get; set; } public string? Address { get; set; } public string Role { get; set; } = "";
    public bool IsActive { get; set; } public bool EmailConfirmed { get; set; }
    public DateTime CreatedAt { get; set; } public string? AvatarUrl { get; set; } public DateTime? UpdatedAt { get; set; }
}

public record UpdateUserRoleRequest([Required] string Role);
public record UpdateUserStatusRequest(bool IsActive);
public record CreateStaffAccountRequest([Required,EmailAddress,MaxLength(100)] string Email,[Required,MaxLength(100)] string FullName,[Required,MinLength(8),MaxLength(100)] string TemporaryPassword,[Phone,MaxLength(20)] string? PhoneNumber,[MaxLength(255)] string? Address);
public record AdminUpdateUserRequest([Required,MaxLength(100)] string FullName,[Phone,MaxLength(20)] string? PhoneNumber,[MaxLength(255)] string? Address);

public record ConfirmEmailRequest(
    [System.ComponentModel.DataAnnotations.Required, System.ComponentModel.DataAnnotations.EmailAddress] string Email,
    [System.ComponentModel.DataAnnotations.Required] string Token);

public record ResendConfirmEmailRequest(
    [System.ComponentModel.DataAnnotations.Required, System.ComponentModel.DataAnnotations.EmailAddress] string Email);

public class SeedVarietyResponse
{
    public SeedVarietyResponse() { }
    public SeedVarietyResponse(int id, string name, string? description, int growthDays, decimal price,
        string? riskDescription = null, string? expectedYield = null, string? standardTraySize = null,
        decimal salePricePerPacket = 0)
    { SeedVarietyId=id; Name=name; Description=description; GrowthDays=growthDays; RentalPricePerTray=price;
      RiskDescription=riskDescription; ExpectedYield=expectedYield; StandardTraySize=standardTraySize;
      SalePricePerPacket=salePricePerPacket; }
    public int SeedVarietyId { get; set; } public string Name { get; set; } = ""; public string? Description { get; set; }
    public int GrowthDays { get; set; } public decimal RentalPricePerTray { get; set; }
    // Giá BÁN hạt giống mua đứt (Supply.UnitPrice) — để FE hiển thị giá bán bên cạnh giá thuê khay.
    public decimal SalePricePerPacket { get; set; }
    public string? RiskDescription { get; set; } public string? ExpectedYield { get; set; } public string? StandardTraySize { get; set; }
}

public class AvailableTrayResponse
{
    public int SoilTrayId { get; set; } public string Code { get; set; } = ""; public string Status { get; set; } = "";
    public int FarmAreaId { get; set; } public string FarmAreaName { get; set; } = "";
}

// Mỗi đơn thuê trực tiếp chỉ 1 khay. Muốn thuê nhiều khay dùng luồng Giỏ hàng (Cart) rồi checkout.
// TargetPlantingDate/TargetDeliveryDate: ngày khách mong muốn (tùy chọn). IsRiskAccepted: khách phải tích đồng ý rủi ro trước khi thanh toán.
// TotalCycles: số chu kỳ/đợt gieo khách đăng ký (>=1). Giá thuê nhân theo số chu kỳ.
// ShippingAddress + toạ độ BẮT BUỘC để đo khoảng cách giao hàng OSRM và kiểm tra bán kính giao (MaxDeliveryRadiusKm).
// IsAccepted: khách tick đồng ý nhận giao khi địa chỉ NẰM NGOÀI bán kính giao.
public record CreateTrayRentalRequest(
    [Required] int SeedVarietyId,
    [Range(1, 1)] int Quantity = 1,
    int? FarmAreaId = null,
    DateTime? TargetPlantingDate = null,
    DateTime? TargetDeliveryDate = null,
    bool IsRiskAccepted = false,
    [Range(1, 100)] int TotalCycles = 1,
    [MaxLength(500)] string? ShippingAddress = null,
    [Range(-90, 90)] double? ShippingLatitude = null,
    [Range(-180, 180)] double? ShippingLongitude = null,
    bool IsAccepted = false);

// ---- Giỏ hàng thuê khay (Cart) ----
// TotalCycles: số chu kỳ cho khay này (>=1). TargetPlantingDate: ngày trồng mong muốn (<= MaxPreOrderDays ngày).
public record AddCartItemRequest([Required] int SeedVarietyId, int? FarmAreaId, [Range(1, 100)] int TotalCycles = 1, DateTime? TargetPlantingDate = null);
public record UpdateCartItemRequest([Range(1, 100)] int TotalCycles, DateTime? TargetPlantingDate = null);
// Checkout: khách phải tích đồng ý rủi ro gieo trồng (giống luồng thuê trực tiếp) để được tạo thanh toán.
// ShippingAddress + toạ độ BẮT BUỘC: nhập điểm nhận hàng ngay tại checkout để tính khoảng cách (OSRM) và phí giao.
// IsAccepted: khách tick đồng ý nhận giao khi địa chỉ NẰM NGOÀI bán kính giao (MaxDeliveryRadiusKm).
public record CheckoutCartRequest(
    bool IsRiskAccepted = false,
    [Required, MaxLength(500)] string? ShippingAddress = null,
    [Required, Range(-90, 90)] double? ShippingLatitude = null,
    [Required, Range(-180, 180)] double? ShippingLongitude = null,
    bool IsAccepted = false,
    List<int>? CartItemIds = null);

public class CartItemResponse
{
    public int CartItemId { get; set; }
    public int SeedVarietyId { get; set; }
    public string SeedVarietyName { get; set; } = "";
    public int? FarmAreaId { get; set; }
    public string? FarmAreaName { get; set; }
    public int Quantity { get; set; } = 1;         // mỗi dòng luôn 1 khay
    public int TotalCycles { get; set; } = 1;       // số chu kỳ của khay này
    public DateTime? TargetPlantingDate { get; set; } // ngày trồng mong muốn cho khay này
    public decimal RentalPrice { get; set; }        // giá thuê 1 khay / 1 chu kỳ
    public decimal LineTotal { get; set; }          // RentalPrice × TotalCycles
    public DateTime AddedAt { get; set; }
}

public class CartResponse
{
    public int CartId { get; set; }
    public IReadOnlyList<CartItemResponse> Items { get; set; } = Array.Empty<CartItemResponse>();
    public int ItemCount { get; set; }
    public decimal Subtotal { get; set; }           // tổng giá thuê các khay
    public decimal DiscountPercent { get; set; }    // % giảm dự kiến khi checkout (xem trước)
    public decimal DiscountAmount { get; set; }     // số tiền giảm dự kiến trên subtotal
    public decimal Total { get; set; }              // Subtotal - DiscountAmount
}

// ShippingAddress + toạ độ (ShippingLatitude/ShippingLongitude) BẮT BUỘC: khách phải cung cấp điểm nhận hàng
// để hệ thống tính khoảng cách giao hàng (OSRM) và phí giao ngay khi tạo đơn.
// IsAccepted: khách tick đồng ý nhận giao khi địa chỉ NẰM NGOÀI bán kính giao (MaxDeliveryRadiusKm).
// Trong bán kính thì bỏ qua cờ này; ngoài bán kính mà không tick -> không cho tạo đơn.
public record CreateSeedPacketOrderRequest(
    [Required] int SeedVarietyId,
    [Range(1, 100)] int Quantity,
    [Required, MaxLength(500)] string ShippingAddress,
    [Required, Range(-90, 90)] double? ShippingLatitude = null,
    [Required, Range(-180, 180)] double? ShippingLongitude = null,
    bool IsAccepted = false);

public record UpdateOrderStatusRequest([Required] string Status);

public class TrayRentalLineResponse
{
    public TrayRentalLineResponse() { }
    public TrayRentalLineResponse(int id, int trayId, string code, DateTime start, DateTime harvest, string status)
    { TrayRentalId=id; SoilTrayId=trayId; TrayCode=code; StartDate=start; ExpectedHarvestDate=harvest; CropStatus=status; }
    public TrayRentalLineResponse(int id, int trayId, string code, DateTime start, DateTime harvest, string status, int totalCycles, int currentCycle, DateTime? actualHarvest)
    { TrayRentalId=id; SoilTrayId=trayId; TrayCode=code; StartDate=start; ExpectedHarvestDate=harvest; CropStatus=status; TotalCycles=totalCycles; CurrentCycle=currentCycle; ActualHarvestDate=actualHarvest; }
    public int TrayRentalId { get; set; } public int SoilTrayId { get; set; } public string TrayCode { get; set; } = "";
    public DateTime StartDate { get; set; } public DateTime ExpectedHarvestDate { get; set; } public string CropStatus { get; set; } = "";
    public int TotalCycles { get; set; } = 1; public int CurrentCycle { get; set; } = 1; public DateTime? ActualHarvestDate { get; set; }
}

public class OrderResponse
{
    public OrderResponse() { }
    public OrderResponse(int id, string code, string type, string status, decimal total, DateTime created, DateTime due, IReadOnlyList<TrayRentalLineResponse> rentals)
    { OrderId=id; OrderCode=code; OrderType=type; Status=status; TotalAmount=total; CreatedAt=created; PaymentDueAt=due; Rentals=rentals; }
    public int OrderId { get; set; } public string OrderCode { get; set; } = ""; public string OrderType { get; set; } = "";
    public string Status { get; set; } = ""; public decimal TotalAmount { get; set; } public DateTime CreatedAt { get; set; }
    public DateTime PaymentDueAt { get; set; } public IReadOnlyList<TrayRentalLineResponse> Rentals { get; set; } = Array.Empty<TrayRentalLineResponse>();
    // Thông tin đặt + breakdown giá cho FE.
    public DateTime? TargetPlantingDate { get; set; } public DateTime? TargetDeliveryDate { get; set; }
    public bool IsRiskAccepted { get; set; } public bool IsReviewed { get; set; }
    // IsAccepted: khách đã đồng ý nhận giao dù địa chỉ ngoài bán kính giao.
    public bool IsAccepted { get; set; }
    public decimal Subtotal { get; set; }
    public decimal DiscountPercent { get; set; } public decimal DiscountAmount { get; set; }
    // Giao hàng: địa chỉ + toạ độ nhận hàng, khoảng cách (km) tính bằng OSRM và phí giao tương ứng.
    public string? ShippingAddress { get; set; }
    public double? ShippingLatitude { get; set; } public double? ShippingLongitude { get; set; }
    public double? DeliveryDistanceKm { get; set; }
}

public class OrderItemResponse
{
    public int OrderItemId { get; set; }
    public int SupplyId { get; set; }
    public string SupplyName { get; set; } = "";
    public string ItemType { get; set; } = "";
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
    public int TotalCycles { get; set; } = 1;
    public int CurrentCycle { get; set; } = 1;
}

public class OrderDetailsResponse
{
    public int OrderId { get; set; }
    public string OrderCode { get; set; } = "";
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = "";
    public string OrderType { get; set; } = "";
    public string Status { get; set; } = "";
    public decimal TotalAmount { get; set; }
    public string? ShippingAddress { get; set; }
    public double? ShippingLatitude { get; set; }
    public double? ShippingLongitude { get; set; }
    public double? DeliveryDistanceKm { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime PaymentDueAt { get; set; }
    public DateTime? TargetPlantingDate { get; set; }
    public DateTime? TargetDeliveryDate { get; set; }
    public bool IsRiskAccepted { get; set; }
    public bool IsReviewed { get; set; }
    public bool IsAccepted { get; set; }
    public decimal Subtotal { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public IReadOnlyList<OrderItemResponse> Items { get; set; } = Array.Empty<OrderItemResponse>();
    public IReadOnlyList<TrayRentalLineResponse> Rentals { get; set; } = Array.Empty<TrayRentalLineResponse>();
}

// ---- Review (đánh giá trang trại) ----
// Khách chỉ đánh giá được đơn đã COMPLETED của chính mình, mỗi đơn một lần.
public record CreateReviewRequest([Range(1, 5)] int Rating, [MaxLength(2000)] string? Comment = null);
public record ReviewResponse(int ReviewId, int OrderId, int CustomerId, string CustomerName, int Rating, string? Comment, DateTime CreatedAt);
public record FarmRatingsResponse(double AverageRating, int TotalReviews, IReadOnlyList<ReviewResponse> Items, int Page, int PageSize, int TotalItems);

// ---- Farm Config (cấu hình trang trại, 1 bản ghi) ----
public record UpdateFarmConfigRequest(
    [Required, MaxLength(100)] string FarmName,
    [Range(1, 365)] int MaxPreOrderDays,
    [Required, MaxLength(50)] string StandardTraySize,
    [Range(0, 10000)] float MaxDeliveryRadiusKm,
    [Range(1, 100)] int DiscountCycleThreshold,
    [Range(1, 100)] int DiscountTrayThreshold,
    [Range(1, 100)] int LoyalOrderThreshold,
    [Range(0, 100)] decimal StandardDiscountPercent,
    [Range(0, 100)] decimal LoyalDiscountPercent,
    [MaxLength(50)] string? BankAccountNumber,
    [MaxLength(100)] string? BankName,
    [MaxLength(100)] string? BankOwnerName,
    [Range(-90, 90)] double? FarmLatitude = null,
    [Range(-180, 180)] double? FarmLongitude = null);

public record FarmConfigResponse(int ConfigId, string FarmName, int MaxPreOrderDays, string StandardTraySize,
    float MaxDeliveryRadiusKm, int DiscountCycleThreshold, int DiscountTrayThreshold, int LoyalOrderThreshold,
    decimal StandardDiscountPercent, decimal LoyalDiscountPercent, string? BankAccountNumber, string? BankName,
    string? BankOwnerName, DateTime? UpdatedAt, double? FarmLatitude = null, double? FarmLongitude = null);

// Thông tin công khai FE hiển thị cho khách (ẩn tài khoản ngân hàng & ngưỡng nội bộ).
public record PublicFarmInfoResponse(string FarmName, int MaxPreOrderDays, string StandardTraySize, float MaxDeliveryRadiusKm);
