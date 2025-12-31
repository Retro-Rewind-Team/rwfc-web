using RetroRewindWebsite.Repositories;
using RetroRewindWebsite.Services.Domain;

namespace RetroRewindWebsite.Services.Background
{
    public class MiiPreFetchBackgroundService : BackgroundService, IMiiPreFetchBackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<MiiPreFetchBackgroundService> _logger;

        private const int RunIntervalMinutes = 30;
        private const int InitialDelayMinutes = 1;
        private const int BatchSize = 100;
        private const int RateLimitDelayMs = 200;

        public MiiPreFetchBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<MiiPreFetchBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Mii pre-fetch background service started");

            try
            {
                await Task.Delay(TimeSpan.FromMinutes(InitialDelayMinutes), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Mii pre-fetch background service stopped during initial delay");
                return;
            }

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await PreFetchMiiImagesAsync(stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Mii pre-fetch background service is stopping");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in Mii pre-fetch background service");
                }

                try
                {
                    await Task.Delay(TimeSpan.FromMinutes(RunIntervalMinutes), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }

            _logger.LogInformation("Mii pre-fetch background service stopped");
        }

        public async Task PreFetchMiiImagesAsync(CancellationToken cancellationToken = default)
        {
            using var scope = _serviceProvider.CreateScope();
            var playerRepository = scope.ServiceProvider.GetRequiredService<IPlayerRepository>();
            var miiService = scope.ServiceProvider.GetRequiredService<IMiiService>();

            _logger.LogInformation("Starting Mii pre-fetch batch");

            var players = await playerRepository.GetPlayersNeedingMiiImagesAsync(BatchSize);

            if (players.Count == 0)
            {
                _logger.LogInformation("No players need Mii images, all up to date");
                return;
            }

            _logger.LogInformation("Pre-fetching Mii images for {Count} players", players.Count);

            var successCount = 0;
            var failCount = 0;
            var skippedCount = 0;

            foreach (var player in players)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    _logger.LogInformation("Mii pre-fetch cancelled, processed {Success}/{Total}",
                        successCount, players.Count);
                    break;
                }

                if (string.IsNullOrEmpty(player.MiiData))
                {
                    skippedCount++;
                    _logger.LogDebug("Skipping {Name} ({FriendCode}) - no Mii data", player.Name, player.Fc);
                    continue;
                }

                try
                {
                    var miiImage = await miiService.GetMiiImageAsync(player.Fc, player.MiiData, cancellationToken);

                    if (miiImage != null)
                    {
                        await playerRepository.UpdatePlayerMiiImageAsync(player.Pid, miiImage);
                        successCount++;
                        _logger.LogDebug("Pre-fetched Mii for {Name} ({FriendCode})", player.Name, player.Fc);
                    }
                    else
                    {
                        failCount++;
                        _logger.LogWarning("Failed to pre-fetch Mii for {Name} ({FriendCode})",
                            player.Name, player.Fc);
                    }

                    await Task.Delay(RateLimitDelayMs, cancellationToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Mii pre-fetch cancelled during processing");
                    break;
                }
                catch (Exception ex)
                {
                    failCount++;
                    _logger.LogWarning(ex, "Error pre-fetching Mii for {Name} ({FriendCode})",
                        player.Name, player.Fc);
                }
            }

            _logger.LogInformation(
                "Mii pre-fetch batch completed. Success: {Success}, Failed: {Failed}, Skipped: {Skipped}",
                successCount, failCount, skippedCount);
        }
    }
}