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
                var batchSize = 50;
                var skip = 0;
                var totalProcessed = 0;

                while (true)
                {
                    var playersBatch = await _playerRepository.GetPlayersBatchAsync(skip, batchSize);

                    if (playersBatch.Count == 0)
                        break; // No more players to process

                    _logger.LogDebug("Processing batch starting at {Skip}, {Count} players", skip, playersBatch.Count);

                    foreach (var player in playersBatch)
                    {
                        try
                        {
                            // Calculate VR gains for different time periods
                            player.VRGainLast24Hours = await _vrHistoryRepository.CalculateVRGainAsync(
                                player.Pid, TimeSpan.FromDays(1));
                            player.VRGainLastWeek = await _vrHistoryRepository.CalculateVRGainAsync(
                                player.Pid, TimeSpan.FromDays(7));
                            player.VRGainLastMonth = await _vrHistoryRepository.CalculateVRGainAsync(
                                player.Pid, TimeSpan.FromDays(30));
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Error calculating VR gains for player {PlayerName} ({Pid})",
                                player.Name, player.Pid);
                        }
                    }

                    // Update the batch
                    await _playerRepository.UpdatePlayersAsync(playersBatch);

                    totalProcessed += playersBatch.Count;
                    skip += batchSize;

                    // Log progress every 10 batches (500 players)
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

        public async Task CleanupOldVRHistoryAsync()
        {
            _logger.LogInformation("Starting cleanup of old VR history records");

            try
            {
                // Keep only the last 30 days of history
                var cutoffDate = DateTime.UtcNow.AddDays(-30);
                var deletedCount = await _vrHistoryRepository.CleanupOldRecordsAsync(cutoffDate);

                _logger.LogInformation("Completed cleanup of old VR history records. Deleted: {Count} records", deletedCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during VR history cleanup");
                throw;
            }
        }
    }
}
