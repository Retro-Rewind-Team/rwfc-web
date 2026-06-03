using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Models.Entities.RaceResult;
using RetroRewindWebsite.Repositories.RaceResult;
using RetroRewindWebsite.Services.External;

namespace RetroRewindWebsite.Services.Application;

/// <summary>
/// Collects race results from the WFC API and persists them, deduplicating by room and race number.
/// </summary>
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
                    var raceResultsByRace = await apiClient.GetRoomRaceResultsAsync(group.Id);

                    if (raceResultsByRace == null || raceResultsByRace.Count == 0)
                        continue;

                    var existingResults = await raceResultRepository.GetRaceResultsByRoomAsync(group.Id);
                    var existingKeys = existingResults
                        .Select(r => (r.RoomId, r.RaceNumber, r.ProfileId))
                        .ToHashSet();

                    var timestamp = DateTime.UtcNow;
                    var allNewResults = new List<RaceResultEntity>();

                    foreach (var (raceNumber, raceResults) in raceResultsByRace)
                    {
                        // Build a ProfileID -> correct 1-based position map from FinishTime ordering.
                        // PlayerID != 0 is a co-op guest (never stored); FinishTime == 0 is a DNF.
                        // Duplicate ProfileIDs (API quirk) are deduplicated by taking the fastest time.
                        // All-DNF races produce an empty map; every row falls back to FinishPos = 0.
                        var correctedPositions = raceResults
                            .Where(r => r.PlayerID == 0 && r.FinishTime != 0)
                            .Select(r => (r.ProfileID, Time: BitConverter.Int32BitsToSingle(r.FinishTime)))
                            .Where(x => x.Time > 0f && !float.IsNaN(x.Time) && !float.IsInfinity(x.Time))
                            .GroupBy(x => x.ProfileID)
                            .Select(g => (ProfileID: g.Key, Time: g.Min(x => x.Time)))
                            .OrderBy(x => x.Time)
                            .Select((x, i) => (x.ProfileID, Pos: (short)(i + 1)))
                            .ToDictionary(x => x.ProfileID, x => x.Pos);

                        foreach (var result in raceResults)
                        {
                            if (result.PlayerID != 0)
                                continue;

                            if (existingKeys.Contains((group.Id, raceNumber, result.ProfileID)))
                            {
                                totalSkippedResults++;
                                continue;
                            }

                            allNewResults.Add(new RaceResultEntity
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
                                FinishPos = correctedPositions.TryGetValue(result.ProfileID, out var pos) ? pos : (short)0,
                                FramesIn1st = result.FramesIn1st,
                                CourseId = result.CourseID,
                                EngineClassId = result.EngineClassID,
                                IsPublic = group.Type == "anybody",
                                Rk = group.Rk
                            });
                        }
                    }

                    if (allNewResults.Count > 0)
                    {
                        try
                        {
                            await raceResultRepository.AddRaceResultsAsync(allNewResults);
                            totalNewResults += allNewResults.Count;
                        }
                        catch (DbUpdateException ex) when (
                            ex.InnerException is Npgsql.PostgresException pgEx &&
                            pgEx.SqlState == "23505")
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
                    "Race result collection completed. New: {NewCount}, Skipped: {SkippedCount}",
                    totalNewResults, totalSkippedResults);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during race result collection");
        }
    }
}
