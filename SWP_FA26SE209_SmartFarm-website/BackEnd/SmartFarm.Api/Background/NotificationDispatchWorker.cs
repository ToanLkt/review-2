using SmartFarm.Services.Services;

namespace SmartFarm.Api.Background;

public sealed class NotificationDispatchWorker(IServiceScopeFactory scopes,ILogger<NotificationDispatchWorker> logger):BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while(!stoppingToken.IsCancellationRequested)
        {
            try{await using var scope=scopes.CreateAsyncScope();await scope.ServiceProvider.GetRequiredService<NotificationService>().DispatchDueAsync(DateTime.UtcNow);}
            catch(Exception exception){logger.LogError(exception,"Failed to dispatch scheduled notifications");}
            await Task.Delay(TimeSpan.FromSeconds(30),stoppingToken);
        }
    }
}
