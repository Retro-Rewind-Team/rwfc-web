using RetroRewindWebsite.Services.Application;

namespace RetroRewindWebsite.Services.Background
{
    public class RaceResultsBackgroundService : BackgroundService, IRaceResultsBackgroundService
    {
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly ILogger<RaceResultsBackgroundService> _logger;
        private readonly SemaphoreSlim _semaphore = new(1, 1);

        private const int RefreshIntervalSeconds = 60;
        private const int SemaphoreTimeoutSeconds = 30;

        public RaceResultsBackgroundService(
            IServiceScopeFactory serviceScopeFactory,
            ILogger<RaceResultsBackgroundService> logger)
        {
            _serviceScopeFactory = serviceScopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Race results background service started");

            try
            {
                await PerformCollectionAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Race results background service stopped during initial collection");
                return;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during initial race results collection");
            }

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(RefreshIntervalSeconds), stoppingToken);
                    await PerformCollectionAsync(stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Race results background service is stopping");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in race results background service");
                }
            }

            _logger.LogInformation("Race results background service stopped");
        }

        public async Task ForceRefreshAsync()
        {
            _logger.LogInformation("Force collection requested");
            await PerformCollectionAsync(CancellationToken.None);
        }

        private async Task PerformCollectionAsync(CancellationToken cancellationToken)
        {
            if (!await _semaphore.WaitAsync(TimeSpan.FromSeconds(SemaphoreTimeoutSeconds), cancellationToken))
            {
                _logger.LogWarning("Previous race results collection is still running, skipping this cycle");
                return;
            }

            try
            {
                _logger.LogDebug("Starting scheduled race results collection");

                using var scope = _serviceScopeFactory.CreateScope();
                var raceResultService = scope.ServiceProvider.GetRequiredService<IRaceResultService>();

                await raceResultService.CollectRaceResultsAsync();

                _logger.LogDebug("Scheduled race results collection completed successfully");
            }
            finally
            {
                _semaphore.Release();
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