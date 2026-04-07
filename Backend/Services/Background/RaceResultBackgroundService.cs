using RetroRewindWebsite.Services.Application;

namespace RetroRewindWebsite.Services.Background;

public class RaceResultBackgroundService : PollingBackgroundService, IRaceResultBackgroundService
{
    private const int RefreshIntervalSeconds = 60;

    public RaceResultBackgroundService(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<RaceResultBackgroundService> logger)
        : base(serviceScopeFactory, logger)
    {
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        Logger.LogInformation("Race results background service started");

        try
        {
            await PerformAsync(stoppingToken);
        }
        catch (OperationCanceledException)
        {
            Logger.LogInformation("Race results background service stopped during initial collection");
            return;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error during initial race results collection");
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
                Logger.LogInformation("Race results background service is stopping");
                break;
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Error in race results background service");
            }
        }

        Logger.LogInformation("Race results background service stopped");
    }

    protected override async Task ExecuteOnceAsync(IServiceProvider services, CancellationToken cancellationToken)
    {
        Logger.LogDebug("Starting scheduled race results collection");
        var raceResultService = services.GetRequiredService<IRaceResultService>();
        await raceResultService.CollectRaceResultsAsync();
        Logger.LogDebug("Scheduled race results collection completed successfully");
    }

    public override async Task ForceRefreshAsync()
    {
        Logger.LogInformation("Force collection requested");
        await PerformAsync(CancellationToken.None);
    }
}
