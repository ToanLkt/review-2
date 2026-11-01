using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;
using Xunit;

namespace SmartFarm.Repositories.Tests;

public class ReviewServiceTests
{
    private static AppDbContext Context() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static async Task<(User customer, Order order)> SeedOrderAsync(AppDbContext db, string code, string status)
    {
        var customer = new User { Email = $"{code}@test.local", FullName = "Khách Đánh Giá", PasswordHash = "x", Role = RoleNames.Customer };
        var order = new Order { Customer = customer, OrderCode = code, OrderType = OrderType.TrayRental, OrderStatus = status, TotalAmount = 100, ExpiresAt = DateTime.UtcNow.AddMinutes(20) };
        db.Add(order); await db.SaveChangesAsync();
        return (customer, order);
    }

    [Fact]
    public async Task Completed_order_can_be_reviewed_once()
    {
        await using var db = Context();
        var (customer, order) = await SeedOrderAsync(db, "REV-OK", OrderStatus.Completed);
        var service = new ReviewService(db);

        var review = await service.CreateAsync(customer.UserId, order.OrderId, new CreateReviewRequest(5, "Rau sạch, giao đúng hẹn"));

        Assert.Equal(5, review.Rating);
        Assert.Equal(order.OrderId, review.OrderId);
        Assert.True((await db.Orders.FindAsync(order.OrderId))!.IsReviewed);

        // Đánh giá lần hai cho cùng đơn -> 409.
        var dup = await Assert.ThrowsAsync<AppException>(() =>
            service.CreateAsync(customer.UserId, order.OrderId, new CreateReviewRequest(4, "lần hai")));
        Assert.Equal(409, dup.StatusCode);
    }

    [Fact]
    public async Task Non_completed_order_cannot_be_reviewed()
    {
        await using var db = Context();
        var (customer, order) = await SeedOrderAsync(db, "REV-PENDING", OrderStatus.Confirmed);
        var service = new ReviewService(db);

        var error = await Assert.ThrowsAsync<AppException>(() =>
            service.CreateAsync(customer.UserId, order.OrderId, new CreateReviewRequest(4, null)));
        Assert.Equal(409, error.StatusCode);
    }

    [Fact]
    public async Task Cannot_review_order_of_another_customer()
    {
        await using var db = Context();
        var (_, order) = await SeedOrderAsync(db, "REV-OTHER", OrderStatus.Completed);
        var service = new ReviewService(db);

        var error = await Assert.ThrowsAsync<AppException>(() =>
            service.CreateAsync(99999, order.OrderId, new CreateReviewRequest(5, null)));
        Assert.Equal(404, error.StatusCode);
    }

    [Fact]
    public async Task Ratings_returns_average_and_items()
    {
        await using var db = Context();
        var service = new ReviewService(db);
        var (c1, o1) = await SeedOrderAsync(db, "REV-A", OrderStatus.Completed);
        var (c2, o2) = await SeedOrderAsync(db, "REV-B", OrderStatus.Completed);
        await service.CreateAsync(c1.UserId, o1.OrderId, new CreateReviewRequest(4, "ổn"));
        await service.CreateAsync(c2.UserId, o2.OrderId, new CreateReviewRequest(2, "chậm"));

        var ratings = await service.RatingsAsync(new QueryRequest());

        Assert.Equal(2, ratings.TotalReviews);
        Assert.Equal(3.0, ratings.AverageRating);
        Assert.Equal(2, ratings.Items.Count);
    }
}
