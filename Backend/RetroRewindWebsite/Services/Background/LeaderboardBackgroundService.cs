using RetroRewindWebsite.Services.Application;
using RetroRewindWebsite.Services.Domain;

namespace RetroRewindWebsite.Services.Background;

public class LeaderboardBackgroundService : PollingBackgroundService, ILeaderboardBackgroundService
{
    private DateTime? _lastMaintenanceDate;

    private const int RefreshIntervalMinutes = 1;
    private const int MaintenanceHourUtc = 11;

    public LeaderboardBackgroundService(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<LeaderboardBackgroundService> logger)
        : base(serviceScopeFactory, logger)
    {
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        Logger.LogInformation("Leaderboard background service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PerformAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                Logger.LogInformation("Leaderboard background service is stopping");
                break;
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Error in leaderboard background service");
            }

            try
            {
                await Task.Delay(TimeSpan.FromMinutes(RefreshIntervalMinutes), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        Logger.LogInformation("Leaderboard background service stopped");
    }

    protected override async Task ExecuteOnceAsync(IServiceProvider services, CancellationToken cancellationToken)
    {
        Logger.LogDebug("Starting scheduled leaderboard refresh");

        var syncService = services.GetRequiredService<ILeaderboardSyncService>();
        await syncService.RefreshFromApiAsync();
        await syncService.RefreshRankingsAsync();

        var now = DateTime.UtcNow;
        if (now.Hour == MaintenanceHourUtc && now.Minute < RefreshIntervalMinutes
            && _lastMaintenanceDate?.Date != now.Date)
        {
            Logger.LogInformation("Performing daily maintenance tasks for {Date:yyyy-MM-dd}", now.Date);

            _ = Task.Run(async () =>
            {
                try
                {
                    await PerformMaintenanceTasksAsync();
                    _lastMaintenanceDate = now;
                    Logger.LogInformation("Daily maintenance tasks completed");
                }
                catch (Exception ex)
                {
                    Logger.LogError(ex, "Maintenance failed");
                }
            }, cancellationToken);
        }

        Logger.LogDebug("Scheduled leaderboard refresh completed successfully");
    }

    private async Task PerformMaintenanceTasksAsync()
    {
        using var scope = ServiceScopeFactory.CreateScope();
        var maintenanceService = scope.ServiceProvider.GetRequiredService<IMaintenanceService>();
        await maintenanceService.UpdateAllPlayerVRGainsAsync();
    }
}
