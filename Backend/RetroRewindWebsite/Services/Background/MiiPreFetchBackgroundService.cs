using RetroRewindWebsite.Repositories;
using RetroRewindWebsite.Services.Domain;

namespace RetroRewindWebsite.Services.Background
{
    public class MiiPreFetchBackgroundService : BackgroundService, IMiiPreFetchBackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<MiiPreFetchBackgroundService> _logger;
        private readonly TimeSpan _runInterval = TimeSpan.FromMinutes(30);

        public MiiPreFetchBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<MiiPreFetchBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("MiiPreFetchBackgroundService started");

            // Wait 1 minute before first run to let the app start up
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await PreFetchMiiImagesAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in MiiPreFetchBackgroundService");
                }

                await Task.Delay(_runInterval, stoppingToken);
            }

            _logger.LogInformation("MiiPreFetchBackgroundService stopped");
        }

        public async Task PreFetchMiiImagesAsync(CancellationToken cancellationToken = default)
        {
            using var scope = _serviceProvider.CreateScope();
            var playerRepository = scope.ServiceProvider.GetRequiredService<IPlayerRepository>();
            var miiService = scope.ServiceProvider.GetRequiredService<IMiiService>();

            _logger.LogInformation("Starting Mii pre-fetch batch");

            // Get players that need Mii images fetched
            var players = await playerRepository.GetPlayersNeedingMiiImagesAsync(100);

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
                    break;

                // Skip players without Mii data
                if (string.IsNullOrEmpty(player.MiiData))
                {
                    skippedCount++;
                    _logger.LogDebug("Skipping {Name} ({Fc}) - no Mii data", player.Name, player.Fc);
                    continue;
                }

                try
                {
                    var miiImage = await miiService.GetMiiImageAsync(player.Fc, player.MiiData);

                    if (miiImage != null)
                    {
                        await playerRepository.UpdatePlayerMiiImageAsync(player.Pid, miiImage);
                        successCount++;
                        _logger.LogDebug("Pre-fetched Mii for {Name} ({Fc})", player.Name, player.Fc);
                    }
                    else
                    {
                        failCount++;
                        _logger.LogWarning("Failed to pre-fetch Mii for {Name} ({Fc})", player.Name, player.Fc);
                    }

                    // Rate limit: 5 per second max
                    await Task.Delay(200, cancellationToken);
                }
                catch (Exception ex)
                {
                    failCount++;
                    _logger.LogWarning(ex, "Error pre-fetching Mii for {Name} ({Fc})", player.Name, player.Fc);
                }
            }

            _logger.LogInformation(
                "Mii pre-fetch batch completed. Success: {Success}, Failed: {Failed}, Skipped: {Skipped}",
                successCount, failCount, skippedCount);
        }
    }
}