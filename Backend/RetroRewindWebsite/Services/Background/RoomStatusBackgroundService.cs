using RetroRewindWebsite.Services.Application;

namespace RetroRewindWebsite.Services.Background
{
    public class RoomStatusBackgroundService : BackgroundService, IRoomStatusBackgroundService
    {
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly ILogger<RoomStatusBackgroundService> _logger;
        private readonly SemaphoreSlim _semaphore = new(1, 1);

        private const int RefreshIntervalSeconds = 60;
        private const int SemaphoreTimeoutSeconds = 30;

        public RoomStatusBackgroundService(
            IServiceScopeFactory serviceScopeFactory,
            ILogger<RoomStatusBackgroundService> logger)
        {
            _serviceScopeFactory = serviceScopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Room status background service started");

            // Perform initial fetch immediately
            try
            {
                await PerformRefreshAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Room status background service stopped during initial fetch");
                return;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during initial room status fetch");
            }

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(RefreshIntervalSeconds), stoppingToken);
                    await PerformRefreshAsync(stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Room status background service is stopping");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in room status background service");
                }
            }

            _logger.LogInformation("Room status background service stopped");
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
                _logger.LogWarning("Previous room status refresh is still running, skipping this cycle");
                return;
            }

            try
            {
                _logger.LogDebug("Starting scheduled room status refresh");

                using var scope = _serviceScopeFactory.CreateScope();
                var roomStatusService = scope.ServiceProvider.GetRequiredService<IRoomStatusService>();

                await roomStatusService.RefreshRoomDataAsync();

                _logger.LogDebug("Scheduled room status refresh completed successfully");
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