using RetroRewindWebsite.Services.Application;
using RetroRewindWebsite.Services.Domain;

namespace RetroRewindWebsite.Services.Background
{
    public class LeaderboardBackgroundService : BackgroundService, ILeaderboardBackgroundService
    {
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly ILogger<LeaderboardBackgroundService> _logger;
        private readonly SemaphoreSlim _semaphore = new(1, 1);

        private const int RefreshIntervalMinutes = 1;
        private const int MaintenanceHourUtc = 11;
        private const int SemaphoreTimeoutSeconds = 30;

        public LeaderboardBackgroundService(
            IServiceScopeFactory serviceScopeFactory,
            ILogger<LeaderboardBackgroundService> logger)
        {
            _serviceScopeFactory = serviceScopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Leaderboard background service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await PerformRefreshAsync(stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Leaderboard background service is stopping");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in leaderboard background service");
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

            _logger.LogInformation("Leaderboard background service stopped");
        }

        public async Task ForceRefreshAsync()
        {
            _logger.LogInformation("Force refresh requested");
            await PerformRefreshAsync(CancellationToken.None);
        }

        private async Task PerformRefreshAsync(CancellationToken cancellationToken)
        {
            if (!await _semaphore.WaitAsync(TimeSpan.FromSeconds(SemaphoreTimeoutSeconds), cancellationToken))
            {
                _logger.LogWarning("Previous refresh operation is still running, skipping this cycle");
                return;
            }

            try
            {
                _logger.LogDebug("Starting scheduled leaderboard refresh");

                using var scope = _serviceScopeFactory.CreateScope();
                var leaderboardManager = scope.ServiceProvider.GetRequiredService<ILeaderboardManager>();

                await leaderboardManager.RefreshFromApiAsync();
                await leaderboardManager.RefreshRankingsAsync();

                var now = DateTime.UtcNow;
                if (now.Hour == MaintenanceHourUtc && now.Minute < RefreshIntervalMinutes)
                {
                    _logger.LogInformation("Performing daily maintenance tasks");
                    await PerformMaintenanceTasksAsync();
                }

                _logger.LogDebug("Scheduled leaderboard refresh completed successfully");
            }
            finally
            {
                _semaphore.Release();
            }
        }

        private async Task PerformMaintenanceTasksAsync()
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var maintenanceService = scope.ServiceProvider.GetRequiredService<IMaintenanceService>();

                await maintenanceService.UpdateAllPlayerVRGainsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during maintenance tasks");
            }
        }

        public override void Dispose()
        {
            _semaphore?.Dispose();
            base.Dispose();
            GC.SuppressFinalize(this);
        }
    }
}