using SmartFarm.Services.Services;

namespace SmartFarm.Api.Background;

// Định kỳ kích hoạt các khay đang chờ gieo (WAITING_PLANTING) khi đã tới ngày trồng -> PLANTED.
public sealed class PlantingActivationWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<PlantingActivationWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(5));
        do
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<CultivationService>();
                var activated = await service.ActivateDuePlantingsAsync(DateTime.UtcNow);
                if (activated > 0) logger.LogInformation("Activated {Count} due planting(s)", activated);
            }
            catch (Exception exception) when (!stoppingToken.IsCancellationRequested)
            {
                logger.LogError(exception, "Failed to activate due plantings");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
