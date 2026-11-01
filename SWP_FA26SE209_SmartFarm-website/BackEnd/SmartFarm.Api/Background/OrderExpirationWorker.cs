using SmartFarm.Services.Services;

namespace SmartFarm.Api.Background;

public sealed class OrderExpirationWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<OrderExpirationWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
        do
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<IOrderService>();
                var expired = await service.ExpireAwaitingPaymentAsync(DateTime.UtcNow);
                if (expired > 0) logger.LogInformation("Expired {OrderCount} unpaid order(s)", expired);
            }
            catch (Exception exception) when (!stoppingToken.IsCancellationRequested)
            {
                logger.LogError(exception, "Failed to expire unpaid orders");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
