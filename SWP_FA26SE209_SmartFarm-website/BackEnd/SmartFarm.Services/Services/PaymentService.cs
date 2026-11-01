using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;

namespace SmartFarm.Services.Services;

public sealed class PaymentService(AppDbContext db, SePayOptions options,NotificationService? notifications=null)
{
    public async Task<PaymentInstructionsResponse> CreateAsync(int customerId, int orderId)
    {
        var order = await db.Orders.FirstOrDefaultAsync(x => x.OrderId == orderId && x.CustomerId == customerId)
            ?? throw new AppException(404, "Order not found.");
        if (order.OrderStatus != OrderStatus.AwaitingPayment || order.ExpiresAt <= DateTime.UtcNow)
            throw new AppException(409, "Order is not awaiting payment.");
        // Khách phải xác nhận đã đọc và đồng ý rủi ro gieo trồng trước khi được tạo QR thanh toán.
        if (order.OrderType == OrderType.TrayRental && !order.IsRiskAccepted)
            throw new AppException(409, "Risk acceptance is required before payment.");
        var payment = await db.Payments.FirstOrDefaultAsync(x => x.OrderId == orderId);
        if (payment is null)
        {
            payment = new Payment { OrderId = orderId, PaymentStatus = PaymentStatuses.Pending };
            db.Payments.Add(payment);
            await db.SaveChangesAsync();
        }
        else if (payment.PaymentStatus == PaymentStatuses.Failed)
        {
            // Cho phép retry thanh toán khi đơn chưa hết hạn: reset về PENDING
            payment.PaymentStatus = PaymentStatuses.Pending;
            payment.ExceptionType = PaymentExceptionTypes.None;
            await db.SaveChangesAsync();
        }
        // Dựng mã VietQR (chuẩn img.vietqr.io) ngay ở BE khi đủ BIN + số tài khoản, để FE chỉ việc hiển thị.
        // Nội dung chuyển khoản = OrderCode (đúng paymentCode webhook dùng để đối chiếu).
        var qrUrl = BuildVietQrUrl(order.TotalAmount, order.OrderCode);
        return new(payment.PaymentId, orderId, payment.PaymentStatus, order.TotalAmount, order.OrderCode,
            options.BankName, options.BankBin, options.BankAccountNumber, options.AccountName, qrUrl, order.ExpiresAt);
    }

    // URL ảnh VietQR theo chuẩn img.vietqr.io. Null khi chưa cấu hình đủ BIN/số tài khoản (chế độ dev).
    private string? BuildVietQrUrl(decimal amount, string orderCode)
    {
        if (string.IsNullOrWhiteSpace(options.BankBin) || string.IsNullOrWhiteSpace(options.BankAccountNumber))
            return null;
        var amountInt = (long)Math.Round(amount, MidpointRounding.AwayFromZero);
        var addInfo = Uri.EscapeDataString(orderCode);
        var accountName = Uri.EscapeDataString(options.AccountName);
        return $"https://img.vietqr.io/image/{options.BankBin}-{options.BankAccountNumber}-compact2.png"
             + $"?amount={amountInt}&addInfo={addInfo}&accountName={accountName}";
    }

    public async Task<PaymentStatusResponse> StatusAsync(int customerId, int orderId)
    {
        var payment = await db.Payments.Include(x => x.Order)
            .FirstOrDefaultAsync(x => x.OrderId == orderId && x.Order!.CustomerId == customerId)
            ?? throw new AppException(404, "Payment not found.");
        return ToStatus(payment);
    }

    // Lịch sử thanh toán của chính khách (mọi đơn), mới nhất trước.
    public async Task<PagedResponse<object>> HistoryAsync(int customerId, QueryRequest request)
    {
        var query = db.Payments.AsNoTracking().Include(x => x.Order)
            .Where(x => x.Order!.CustomerId == customerId)
            .OrderByDescending(x => x.PaymentId);
        var (page, size) = QueryHelper.Paging(request);
        var total = await query.CountAsync();
        var rows = await query.Skip((page - 1) * size).Take(size).ToListAsync();
        var items = rows.Select(x => (object)new PaymentHistoryItemResponse(x.PaymentId, x.OrderId,
            x.Order?.OrderCode ?? "", x.PaymentStatus, x.Order?.TotalAmount ?? 0, x.AmountPaid,
            x.ExceptionType, x.PaidAt)).ToList();
        return new(items, page, size, total);
    }

    public async Task<WebhookResultResponse> HandleWebhookAsync(string rawBody, string signature, string timestamp)
    {
        VerifySignature(rawBody, signature, timestamp);
        var payload = JsonSerializer.Deserialize<SePayWebhookPayload>(rawBody,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? throw new AppException(400, "Invalid SePay payload.");
        if (payload.Id == 0 &&
            string.Equals(payload.Code, "SEPAYTEST", StringComparison.OrdinalIgnoreCase) &&
            string.Equals(payload.TransferType, "in", StringComparison.OrdinalIgnoreCase))
            return new(false, "TEST", null, null);
        if (payload.Id <= 0 || !string.Equals(payload.TransferType, "in", StringComparison.OrdinalIgnoreCase))
            throw new AppException(400, "Unsupported SePay transaction.");
        var duplicate = await db.PaymentWebhookEvents.AsNoTracking().FirstOrDefaultAsync(x => x.SePayTransactionId == payload.Id);
        if (duplicate is not null) return new(true, duplicate.ExceptionType, duplicate.OrderId, duplicate.PaymentId);

        var paymentCode = ResolvePaymentCode(payload.Code, payload.Content);
        var order = string.IsNullOrWhiteSpace(paymentCode) ? null :
            await db.Orders.FirstOrDefaultAsync(x => x.OrderCode == paymentCode);
        Payment? payment = order is null ? null : await db.Payments.FirstOrDefaultAsync(x => x.OrderId == order.OrderId);
        if (payment is null && order is not null)
        {
            payment = new Payment
            {
                OrderId = order.OrderId,
                PaymentStatus = PaymentStatuses.Pending
            };
            db.Payments.Add(payment);
            // Lưu trước Payment để MySQL sinh PaymentId thật, tránh lỗi khóa ngoại (PaymentId=0) trên PaymentWebhookEvents
            await db.SaveChangesAsync();
        }
        var exception = string.IsNullOrWhiteSpace(paymentCode) ? PaymentExceptionTypes.ReferenceMismatch : Classify(order, payload.TransferAmount);
        var isSuccess = exception == PaymentExceptionTypes.None || exception == PaymentExceptionTypes.Overpaid;
        if (payment is not null && payment.PaymentStatus != PaymentStatuses.Success)
        {
            payment.TransactionCode = payload.ReferenceCode;
            payment.AmountPaid = payload.TransferAmount;
            payment.SePayPayload = rawBody;
            payment.PaidAt = ParseTransactionDate(payload.TransactionDate);
            payment.ExceptionType = exception;
            payment.PaymentStatus = isSuccess ? PaymentStatuses.Success : PaymentStatuses.Failed;
        }

        // Bảo vệ trạng thái đơn hàng (P0):
        // 1. Chỉ chuyển sang CONFIRMED khi đơn đang ở AWAITING_PAYMENT (không được đưa PREPARING, DELIVERING hoặc COMPLETED quay về CONFIRMED).
        // 2. Bắt buộc bản ghi Payment phải ở trạng thái SUCCESS.
        var confirmedNow = false;
        if (order is not null && order.OrderStatus == OrderStatus.AwaitingPayment && payment is not null && payment.PaymentStatus == PaymentStatuses.Success)
        {
            order.OrderStatus = OrderStatus.Confirmed;
            confirmedNow = true;
            // Thanh toán thành công = được phép bắt đầu trồng. Khay nào đã tới ngày trồng thì chuyển
            // WAITING_PLANTING -> PLANTED ngay, không phải chờ worker định kỳ. Khay có ngày trồng ở
            // tương lai vẫn giữ WAITING_PLANTING và sẽ được worker kích hoạt khi tới ngày.
            var now = DateTime.UtcNow;
            var dueRentals = await db.TrayRentals
                .Where(x => x.OrderId == order.OrderId
                    && x.CropStatus == CropStatus.WaitingPlanting
                    && x.StartDate <= now)
                .ToListAsync();
            foreach (var rental in dueRentals)
                rental.CropStatus = CropStatus.Planted;
        }
        db.PaymentWebhookEvents.Add(new PaymentWebhookEvent
        {
            SePayTransactionId = payload.Id,
            OrderId = order?.OrderId,
            PaymentId = payment != null && payment.PaymentId > 0 ? payment.PaymentId : null,
            Payment = payment,
            Order = order,
            PaymentCode = paymentCode,
            ReferenceCode = payload.ReferenceCode,
            Gateway = payload.Gateway,
            AccountNumber = payload.AccountNumber,
            TransferAmount = payload.TransferAmount,
            TransactionAt = ParseTransactionDate(payload.TransactionDate),
            ExceptionType = exception,
            RawPayload = rawBody
        });
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Hai webhook cùng SePayTransactionId đến gần đồng thời cùng vượt qua bước kiểm tra trùng;
            // unique index chặn bản ghi thứ hai. Trả về idempotent (200) thay vì 500. Các thay đổi
            // payment/order trong cùng SaveChanges đã bị rollback nên không áp dụng hai lần.
            db.ChangeTracker.Clear();
            var existing = await db.PaymentWebhookEvents.AsNoTracking()
                .FirstOrDefaultAsync(x => x.SePayTransactionId == payload.Id);
            if (existing is null) throw; // lỗi khác, không phải trùng khóa
            return new(true, existing.ExceptionType, existing.OrderId, existing.PaymentId);
        }
        if(order is not null&&notifications is not null)
        {
            var title=isSuccess?"Thanh toán thành công":"Thanh toán cần kiểm tra";
            await notifications.SendDomainAsync(order.CustomerId,title,$"Thanh toán cho đơn {order.OrderCode}: {exception}.",
                NotificationTypes.Payment,payment?.PaymentId??order.OrderId,$"PAYMENT:{payload.Id}");
            if(confirmedNow)await notifications.SendDomainAsync(order.CustomerId,"Đơn hàng đã xác nhận",
                $"Đơn {order.OrderCode} đã được xác nhận.",NotificationTypes.Order,order.OrderId,$"ORDER:{order.OrderId}:CONFIRMED");
        }
        return new(false, exception, order?.OrderId, payment?.PaymentId);
    }

    public async Task<PagedResponse<object>> ExceptionsAsync(QueryRequest request)
    {
        var query = db.PaymentWebhookEvents.AsNoTracking()
            .Where(x => x.ExceptionType != PaymentExceptionTypes.None).OrderByDescending(x => x.TransactionAt);
        var (page, size) = QueryHelper.Paging(request); var total = await query.CountAsync();
        var rows = await query.Skip((page - 1) * size).Take(size).ToListAsync();
        return new(rows.Select(x => (object)ToException(x)).ToList(), page, size, total);
    }

    public async Task<PaymentExceptionResponse> NoteAsync(long eventId, int staffId, string note)
    {
        if(string.IsNullOrWhiteSpace(note))throw new AppException(400,"Payment exception note is required.");
        var item = await db.PaymentWebhookEvents.FirstOrDefaultAsync(x => x.PaymentWebhookEventId == eventId)
            ?? throw new AppException(404, "Payment exception not found.");
        item.StaffNote = note.Trim(); item.ReviewedByUserId = staffId; item.ReviewedAt = DateTime.UtcNow;
        if (item.PaymentId.HasValue)
        {
            var payment = await db.Payments.FindAsync(item.PaymentId.Value);
            if (payment is not null)
            {
                payment.StaffNote = item.StaffNote;
                payment.ReviewedByUserId = staffId;
                payment.ReviewedAt = item.ReviewedAt;
            }
        }
        await db.SaveChangesAsync(); return ToException(item);
    }

    public async Task<PaymentReportResponse> ReportAsync(DateTime? from, DateTime? to)
    {
        if(from.HasValue&&to.HasValue&&from.Value>to.Value)throw new AppException(400,"From must be earlier than or equal to To.");
        var query = db.PaymentWebhookEvents.AsNoTracking().AsQueryable();
        if (from.HasValue) query = query.Where(x => x.TransactionAt >= from.Value);
        if (to.HasValue) query = query.Where(x => x.TransactionAt <= to.Value);
        var rows = await query.ToListAsync();
        return new(rows.Count, rows.Sum(x => x.TransferAmount), rows.Count(x => x.ExceptionType == PaymentExceptionTypes.None),
            rows.Count(x => x.ExceptionType != PaymentExceptionTypes.None), rows.GroupBy(x => x.ExceptionType).ToDictionary(x => x.Key, x => x.Count()));
    }

    private string Classify(Order? order, decimal amount)
    {
        if (order is null) return PaymentExceptionTypes.Unmatched;
        if (order.OrderStatus == OrderStatus.Expired || order.ExpiresAt < DateTime.UtcNow) return PaymentExceptionTypes.Late;
        if (order.OrderStatus != OrderStatus.AwaitingPayment) return PaymentExceptionTypes.OrderStateMismatch;
        if (amount < order.TotalAmount) return PaymentExceptionTypes.Underpaid;
        if (amount > order.TotalAmount) return PaymentExceptionTypes.Overpaid;
        return PaymentExceptionTypes.None;
    }

    private static string? ResolvePaymentCode(string? code, string content)
    {
        if (!string.IsNullOrWhiteSpace(code)) return code.Trim();
        var match = Regex.Match(content ?? "", @"\b(?:SP|TR)\d{17,19}\b", RegexOptions.IgnoreCase);
        return match.Success ? match.Value.ToUpperInvariant() : null;
    }

    private void VerifySignature(string body, string signature, string timestamp)
    {
        if (string.IsNullOrWhiteSpace(options.WebhookSecret)) throw new AppException(503, "SePay webhook is not configured.");
        if (!long.TryParse(timestamp, out var seconds) || Math.Abs(DateTimeOffset.UtcNow.ToUnixTimeSeconds() - seconds) > 300)
            throw new AppException(401, "Expired webhook timestamp.");
        var hash = HMACSHA256.HashData(Encoding.UTF8.GetBytes(options.WebhookSecret), Encoding.UTF8.GetBytes($"{timestamp}.{body}"));
        var expected = "sha256=" + Convert.ToHexString(hash).ToLowerInvariant();
        if (!CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(expected), Encoding.ASCII.GetBytes(signature ?? "")))
            throw new AppException(401, "Invalid webhook signature.");
    }

    private static DateTime ParseTransactionDate(string value) => DateTime.TryParseExact(value, "yyyy-MM-dd HH:mm:ss",
        CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed)
        ? new DateTimeOffset(DateTime.SpecifyKind(parsed, DateTimeKind.Unspecified), TimeSpan.FromHours(7)).UtcDateTime
        : DateTime.UtcNow;
    private static PaymentStatusResponse ToStatus(Payment x) => new(x.PaymentId, x.OrderId, x.PaymentStatus,
        x.Order?.TotalAmount ?? 0, x.AmountPaid, x.ExceptionType, x.PaidAt, x.StaffNote);
    private static PaymentExceptionResponse ToException(PaymentWebhookEvent x) => new(x.PaymentWebhookEventId,
        x.SePayTransactionId,x.OrderId,x.PaymentId,x.PaymentCode,x.ReferenceCode,x.TransferAmount,x.ExceptionType,
        x.TransactionAt,x.StaffNote,x.ReviewedByUserId,x.ReviewedAt);
}
