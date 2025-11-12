using RetroRewindWebsite.Repositories;

namespace RetroRewindWebsite.Services.Domain
{
    public class MaintenanceService : IMaintenanceService
    {
        private readonly IPlayerRepository _playerRepository;
        private readonly IVRHistoryRepository _vrHistoryRepository;
        private readonly ILogger<MaintenanceService> _logger;

        public MaintenanceService(
            IPlayerRepository playerRepository,
            IVRHistoryRepository vrHistoryRepository,
            ILogger<MaintenanceService> logger)
        {
            _playerRepository = playerRepository;
            _vrHistoryRepository = vrHistoryRepository;
            _logger = logger;
        }

        public async Task UpdateAllPlayerVRGainsAsync()
        {
            _logger.LogInformation("Starting daily update of VR gain stats for all players");

            try
            {
                var batchSize = 100;
                var skip = 0;
                var totalProcessed = 0;

                while (true)
                {
                    // Get just the PIDs, not full entities
                    var playerPids = await _playerRepository.GetPlayerPidsBatchAsync(skip, batchSize);

                    if (playerPids.Count == 0)
                        break;

                    _logger.LogDebug("Processing batch starting at {Skip}, {Count} players", skip, playerPids.Count);

                    // Calculate VR gains for all players in this batch
                    var vrGainsBatch = new Dictionary<string, (int gain24h, int gain7d, int gain30d)>();

                    foreach (var pid in playerPids)
                    {
                        try
                        {
                            var gain24h = await _vrHistoryRepository.CalculateVRGainAsync(pid, TimeSpan.FromDays(1));
                            var gain7d = await _vrHistoryRepository.CalculateVRGainAsync(pid, TimeSpan.FromDays(7));
                            var gain30d = await _vrHistoryRepository.CalculateVRGainAsync(pid, TimeSpan.FromDays(30));

                            vrGainsBatch[pid] = (gain24h, gain7d, gain30d);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Error calculating VR gains for player PID {Pid}", pid);
                        }
                    }

                    // Batch update all players at once
                    if (vrGainsBatch.Count > 0)
                    {
                        await _playerRepository.UpdatePlayerVRGainsBatchAsync(vrGainsBatch);
                    }

                    totalProcessed += playerPids.Count;
                    skip += batchSize;

                    // Log progress every 500 players
                    if (totalProcessed % 500 == 0)
                    {
                        _logger.LogInformation("Updated VR gains for {Count} players so far", totalProcessed);
                    }
                }

                _logger.LogInformation("Daily update of VR gain stats completed. Total players processed: {Count}", totalProcessed);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during daily VR gain update");
                throw;
            }
        }
    }
}
