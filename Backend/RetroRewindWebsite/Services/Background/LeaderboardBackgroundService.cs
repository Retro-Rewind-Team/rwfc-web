using RetroRewindWebsite.Services.Application;
using RetroRewindWebsite.Services.Domain;

namespace RetroRewindWebsite.Services.Background
{
    public class LeaderboardBackgroundService : BackgroundService, ILeaderboardBackgroundService
    {
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly ILogger<LeaderboardBackgroundService> _logger;
        private Timer? _timer;
        private readonly SemaphoreSlim _semaphore = new(1, 1);

        public LeaderboardBackgroundService(
            IServiceScopeFactory serviceScopeFactory,
            ILogger<LeaderboardBackgroundService> logger)
        {
            _serviceScopeFactory = serviceScopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Leaderboard Background Service starting...");

            // Start the timer for regular updates (every minute)
            _timer = new Timer(
                callback: async _ => await DoWork(),
                state: null,
                dueTime: TimeSpan.Zero, // Start immediately
                period: TimeSpan.FromMinutes(1)); // Run every minute

            // Keep the service running
            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(1000, stoppingToken);
            }

            _logger.LogInformation("Leaderboard Background Service stopping...");
        }

        private async Task DoWork()
        {
            if (!await _semaphore.WaitAsync(TimeSpan.FromSeconds(30)))
            {
                _logger.LogWarning("Previous refresh operation is still running, skipping this cycle");
                return;
            }

            try
            {
                _logger.LogDebug("Starting scheduled leaderboard refresh");

                using var scope = _serviceScopeFactory.CreateScope();
                var leaderboardManager = scope.ServiceProvider.GetRequiredService<ILeaderboardManager>();

                // Perform the refresh
                await leaderboardManager.RefreshFromApiAsync();
                await leaderboardManager.RefreshRankingsAsync();

                // Check if it's time for maintenance tasks
                var now = DateTime.UtcNow;
                if (now.Hour == 11 && now.Minute == 0)
                {
                    _logger.LogInformation("Performing daily maintenance tasks");

                    // Run maintenance in background to avoid blocking regular updates
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            await PerformMaintenanceTasksAsync();
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error during maintenance tasks");
                        }
                    });
                }

                _logger.LogDebug("Scheduled leaderboard refresh completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during scheduled leaderboard refresh");
            }
            finally
            {
                _semaphore.Release();
            }
        }

        private async Task PerformMaintenanceTasksAsync()
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var maintenanceService = scope.ServiceProvider.GetService<IMaintenanceService>();

            if (maintenanceService != null)
            {
                await maintenanceService.UpdateAllPlayerVRGainsAsync();
            }
        }

        public async Task ForceRefreshAsync()
        {
            _logger.LogInformation("Force refresh requested");
            await DoWork();
        }

        public override async Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Leaderboard Background Service is starting");
            await base.StartAsync(cancellationToken);
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Leaderboard Background Service is stopping");

            _timer?.Change(Timeout.Infinite, 0);
            _timer?.Dispose();

            await base.StopAsync(cancellationToken);
        }

        public override void Dispose()
        {
            _timer?.Dispose();
            _semaphore?.Dispose();
            base.Dispose();
            GC.SuppressFinalize(this);
        }
    }
}
