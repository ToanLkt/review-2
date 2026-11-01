using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SmartFarm.Services.Models;

public sealed class SePayOptions
{
    public string WebhookSecret { get; set; } = "";
    public string BankName { get; set; } = "";
    // Mã BIN ngân hàng theo chuẩn Napas/VietQR (vd Vietcombank=970436, MBBank=970422, ACB=970416).
    // BẮT BUỘC để FE/BE dựng được mã VietQR; thiếu BIN thì không tạo được QR.
    public string BankBin { get; set; } = "";
    public string BankAccountNumber { get; set; } = "";
    public string AccountName { get; set; } = "";
}

public record PaymentInstructionsResponse(int PaymentId, int OrderId, string Status, decimal Amount,
    string PaymentCode, string BankName, string BankBin, string BankAccountNumber, string AccountName,
    string? QrCodeUrl, DateTime ExpiresAt);
public record PaymentStatusResponse(int PaymentId, int OrderId, string Status, decimal ExpectedAmount,
    decimal AmountPaid, string ExceptionType, DateTime? PaidAt, string? StaffNote);
public record PaymentExceptionNoteRequest([Required, MaxLength(1000)] string Note);
public record PaymentReportResponse(int TotalTransactions, decimal TotalReceived, int Successful,
    int Exceptions, IReadOnlyDictionary<string, int> ExceptionsByType);
public record PaymentExceptionResponse(long EventId, long SePayTransactionId, int? OrderId, int? PaymentId,
    string? PaymentCode, string ReferenceCode, decimal Amount, string ExceptionType, DateTime TransactionAt,
    string? StaffNote, int? ReviewedByUserId, DateTime? ReviewedAt);
public record WebhookResultResponse(bool Duplicate, string Result, int? OrderId, int? PaymentId);
// Một dòng trong lịch sử thanh toán của khách.
public record PaymentHistoryItemResponse(int PaymentId, int OrderId, string OrderCode, string PaymentStatus,
    decimal ExpectedAmount, decimal AmountPaid, string ExceptionType, DateTime? PaidAt);

public sealed class SePayWebhookPayload
{
    [JsonPropertyName("id")] public long Id { get; set; }
    [JsonPropertyName("gateway")] public string Gateway { get; set; } = "";
    [JsonPropertyName("transactionDate")] public string TransactionDate { get; set; } = "";
    [JsonPropertyName("accountNumber")] public string AccountNumber { get; set; } = "";
    [JsonPropertyName("code")] public string? Code { get; set; }
    [JsonPropertyName("content")] public string Content { get; set; } = "";
    [JsonPropertyName("transferType")] public string TransferType { get; set; } = "";
    [JsonPropertyName("transferAmount")] public decimal TransferAmount { get; set; }
    [JsonPropertyName("referenceCode")] public string ReferenceCode { get; set; } = "";
}

public record CreateDeliveryRequest(int OrderId, int? RentalId, [Required, MaxLength(100)] string RecipientName,
    [Required, Phone, MaxLength(20)] string RecipientPhone, [MaxLength(500)] string? ShippingAddress,
    [MaxLength(1000)] string? Notes);
public record AssignShipperRequest([Required] int ShipperId);
public record UpdateDeliveryRequest([Required] string Status, [MaxLength(100)] string? TrackingCode,
    [Range(0.01, 10000)] float? ActualWeightKg, [MaxLength(1000)] string? Notes);
public record ScheduleDeliveryRequest(
    [Required, MaxLength(100)] string RecipientName,
    [Required, Phone, MaxLength(20)] string RecipientPhone,
    [MaxLength(500)] string? ShippingAddress,
    DateTime ScheduledDeliveryAt,
    [MaxLength(1000)] string? Notes,
    [Range(-90, 90)] double? ShippingLatitude = null,
    [Range(-180, 180)] double? ShippingLongitude = null,
    bool IsAccepted = false,
    int? CycleNumber = null,
    int? DeliveryId = null);
public sealed class DeliveryResponse
{
    public int DeliveryId { get; set; } public int OrderId { get; set; } public string OrderCode { get; set; } = "";
    public int? RentalId { get; set; } public int CycleNumber { get; set; } = 1; public int? ShipperId { get; set; } public string? ShipperName { get; set; }
    public string RecipientName { get; set; } = ""; public string RecipientPhone { get; set; } = "";
    public string ShippingAddress { get; set; } = ""; public DateTime? ScheduledDeliveryAt { get; set; } public string? TrackingCode { get; set; }
    public float? ActualWeightKg { get; set; } public string Status { get; set; } = "";
    public DateTime? ShippedAt { get; set; } public DateTime? DeliveredAt { get; set; } public string? Notes { get; set; }
}
