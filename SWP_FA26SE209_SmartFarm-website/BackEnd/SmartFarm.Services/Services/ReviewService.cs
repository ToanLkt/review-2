using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;

namespace SmartFarm.Services.Services;

public sealed class ReviewService(AppDbContext db)
{
    // Khách gửi đánh giá cho một đơn đã COMPLETED của chính mình. Mỗi đơn chỉ đánh giá một lần.
    public async Task<ReviewResponse> CreateAsync(int customerId, int orderId, CreateReviewRequest request)
    {
        if (request.Rating is < 1 or > 5)
            throw new AppException(400, "Rating must be between 1 and 5.");

        var order = await db.Orders.FirstOrDefaultAsync(x => x.OrderId == orderId && x.CustomerId == customerId)
            ?? throw new AppException(404, "Order not found.");
        if (order.OrderStatus != OrderStatus.Completed)
            throw new AppException(409, "Only completed orders can be reviewed.");
        if (order.IsReviewed || await db.Reviews.AnyAsync(x => x.OrderId == orderId))
            throw new AppException(409, "This order has already been reviewed.");

        var review = new Review
        {
            OrderId = orderId,
            CustomerId = customerId,
            Rating = request.Rating,
            Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim(),
            CreatedAt = DateTime.UtcNow
        };
        db.Reviews.Add(review);
        order.IsReviewed = true;
        await db.SaveChangesAsync();

        var customer = await db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == customerId);
        return ToDto(review, customer?.FullName ?? "");
    }

    // Danh sách đánh giá công khai của trang trại + điểm trung bình.
    public async Task<FarmRatingsResponse> RatingsAsync(QueryRequest request)
    {
        var query = db.Reviews.AsNoTracking().Include(x => x.Customer).OrderByDescending(x => x.CreatedAt);
        var total = await query.CountAsync();
        var average = total == 0 ? 0 : Math.Round(await db.Reviews.AsNoTracking().AverageAsync(x => (double)x.Rating), 2);
        var (page, size) = QueryHelper.Paging(request);
        var rows = await query.Skip((page - 1) * size).Take(size).ToListAsync();
        var items = rows.Select(x => ToDto(x, x.Customer?.FullName ?? "")).ToList();
        return new FarmRatingsResponse(average, total, items, page, size, total);
    }

    private static ReviewResponse ToDto(Review x, string customerName) =>
        new(x.ReviewId, x.OrderId, x.CustomerId, customerName, x.Rating, x.Comment, x.CreatedAt);
}
