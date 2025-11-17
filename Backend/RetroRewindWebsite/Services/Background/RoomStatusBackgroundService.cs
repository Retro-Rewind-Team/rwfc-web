using RetroRewindWebsite.Services.Application;

namespace RetroRewindWebsite.Services.Background
{
    public class RoomStatusBackgroundService : BackgroundService, IRoomStatusBackgroundService
    {
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly ILogger<RoomStatusBackgroundService> _logger;
        private readonly SemaphoreSlim _semaphore = new(1, 1);
        private Timer? _timer;

        public RoomStatusBackgroundService(
            IServiceScopeFactory serviceScopeFactory,
            ILogger<RoomStatusBackgroundService> logger)
        {
            _serviceScopeFactory = serviceScopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Room Status Background Service starting...");

            // Perform initial fetch immediately
            await DoWork();

            // Start the timer for regular updates (every 60 seconds)
            _timer = new Timer(
                callback: async _ => await DoWork(),
                state: null,
                dueTime: TimeSpan.FromSeconds(60), // First scheduled update after 60s
                period: TimeSpan.FromSeconds(60)); // Then every 60s

            // Keep the service running
            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(1000, stoppingToken);
            }

            _logger.LogInformation("Room Status Background Service stopping...");
        }

        private async Task DoWork()
        {
            if (!await _semaphore.WaitAsync(TimeSpan.FromSeconds(30)))
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
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during scheduled room status refresh");
            }
            finally
            {
                _semaphore.Release();
            }
        }

        public async Task ForceRefreshAsync()
        {
            _logger.LogInformation("Force refresh requested");
            await DoWork();
        }

        public override async Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Room Status Background Service is starting");
            await base.StartAsync(cancellationToken);
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Room Status Background Service is stopping");

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