using RetroRewindWebsite.Services.Application;

namespace RetroRewindWebsite.Services.Background;

public class RoomStatusBackgroundService : PollingBackgroundService, IRoomStatusBackgroundService
{
    private const int RefreshIntervalSeconds = 60;

    public RoomStatusBackgroundService(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<RoomStatusBackgroundService> logger)
        : base(serviceScopeFactory, logger)
    {
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        Logger.LogInformation("Room status background service started");

        try
        {
            await PerformAsync(stoppingToken);
        }
        catch (OperationCanceledException)
        {
            Logger.LogInformation("Room status background service stopped during initial fetch");
            return;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error during initial room status fetch");
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(RefreshIntervalSeconds), stoppingToken);
                await PerformAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                Logger.LogInformation("Room status background service is stopping");
                break;
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Error in room status background service");
            }
        }

        Logger.LogInformation("Room status background service stopped");
    }

    protected override async Task ExecuteOnceAsync(IServiceProvider services, CancellationToken cancellationToken)
    {
        Logger.LogDebug("Starting scheduled room status refresh");
        var roomStatusService = services.GetRequiredService<IRoomStatusService>();
        await roomStatusService.RefreshRoomDataAsync();
        Logger.LogDebug("Scheduled room status refresh completed successfully");
    }
}
