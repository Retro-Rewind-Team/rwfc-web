using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Models.Entities;
using RetroRewindWebsite.Repositories;
using RetroRewindWebsite.Services.External;

namespace RetroRewindWebsite.Services.Application
{
    public class RaceResultService : IRaceResultService
    {
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly ILogger<RaceResultService> _logger;

        public RaceResultService(
            IServiceScopeFactory serviceScopeFactory,
            ILogger<RaceResultService> logger)
        {
            _serviceScopeFactory = serviceScopeFactory;
            _logger = logger;
        }

        public async Task CollectRaceResultsAsync()
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var apiClient = scope.ServiceProvider.GetRequiredService<IRetroWFCApiClient>();
            var raceResultRepository = scope.ServiceProvider.GetRequiredService<IRaceResultRepository>();

            try
            {
                // Get all active rooms
                var groups = await apiClient.GetActiveGroupsAsync();

                if (groups == null || groups.Count == 0)
                {
                    _logger.LogDebug("No active rooms found for race result collection");
                    return;
                }

                var totalNewResults = 0;
                var totalSkippedResults = 0;

                foreach (var group in groups)
                {
                    try
                    {
                        // Fetch all race results for this room
                        var raceResultsByRace = await apiClient.GetRoomRaceResultsAsync(group.Id);

                        if (raceResultsByRace == null || raceResultsByRace.Count == 0)
                        {
                            continue;
                        }

                        // Bulk fetch existing results for this room
                        var existingResults = await raceResultRepository.GetRaceResultsByRoomAsync(group.Id);
                        var existingKeys = existingResults
                            .Select(r => (r.RaceNumber, r.ProfileId))
                            .ToHashSet();

                        var timestamp = DateTime.UtcNow;
                        var allNewResults = new List<RaceResultEntity>();

                        // Process each race
                        foreach (var (raceNumber, raceResults) in raceResultsByRace)
                        {
                            foreach (var result in raceResults)
                            {
                                // Check against in-memory HashSet
                                if (existingKeys.Contains((raceNumber, result.ProfileID)))
                                {
                                    totalSkippedResults++;
                                    continue;
                                }

                                var entity = new RaceResultEntity
                                {
                                    RoomId = group.Id,
                                    RaceNumber = raceNumber,
                                    RaceTimestamp = timestamp,
                                    ProfileId = result.ProfileID,
                                    PlayerId = result.PlayerID,
                                    FinishTime = result.FinishTime,
                                    CharacterId = result.CharacterID,
                                    VehicleId = result.VehicleID,
                                    PlayerCount = result.PlayerCount,
                                    FinishPos = result.FinishPos,
                                    FramesIn1st = result.FramesIn1st,
                                    CourseId = result.CourseID,
                                    EngineClassId = result.EngineClassID
                                };

                                allNewResults.Add(entity);
                            }
                        }

                        // Insert all new results in one batch
                        if (allNewResults.Count > 0)
                        {
                            try
                            {
                                await raceResultRepository.AddRaceResultsAsync(allNewResults);
                                totalNewResults += allNewResults.Count;
                            }
                            catch (DbUpdateException ex) when (ex.InnerException is Npgsql.PostgresException pgEx
                                && pgEx.SqlState == "23505")
                            {
                                _logger.LogDebug(
                                    "Caught race condition duplicate for room {RoomId}, skipped {Count} results",
                                    group.Id, allNewResults.Count);
                                totalSkippedResults += allNewResults.Count;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error collecting race results for room {RoomId}", group.Id);
                    }
                }

                if (totalNewResults > 0 || totalSkippedResults > 0)
                {
                    _logger.LogInformation(
                        "Race result collection completed. New: {NewCount}, Skipped (duplicates): {SkippedCount}",
                        totalNewResults, totalSkippedResults);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during race result collection");
            }
        }
    }
}