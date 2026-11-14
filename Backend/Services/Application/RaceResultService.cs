using RetroRewindWebsite.Models.Entities.RaceResult;
using RetroRewindWebsite.Repositories.RaceResult;
using RetroRewindWebsite.Services.Domain;
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
        var roomTracker = scope.ServiceProvider.GetRequiredService<RecentRoomTracker>();

        try
        {
            var groups = await apiClient.GetActiveGroupsAsync() ?? [];

            // Include recently closed rooms, otherwise the last race of a room that closes between
            // ticks is never collected.
            var rooms = roomTracker.GetRoomsToCollect(groups);

            if (rooms.Count == 0)
            {
                _logger.LogDebug("No active or recently closed rooms found for race result collection");
                return;
            }

            var totalNewResults = 0;
            var totalSkippedResults = 0;

            foreach (var room in rooms)
            {
                try
                {
                    var (inserted, skipped) = await CollectRoomAsync(apiClient, raceResultRepository, room);
                    totalNewResults += inserted;
                    totalSkippedResults += skipped;

                    if (!room.IsOpen && inserted > 0)
                    {
                        _logger.LogInformation(
                            "Collected {Count} race results from closed room {RoomId}", inserted, room.Id);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error collecting race results for room {RoomId}", room.Id);
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

    /// <summary>Stores a room's new results. Returns (inserted, skipped).</summary>
    private static async Task<(int Inserted, int Skipped)> CollectRoomAsync(
        IRetroWFCApiClient apiClient,
        IRaceResultRepository raceResultRepository,
        TrackedRoom room)
    {
        var raceResultsByRace = await apiClient.GetRoomRaceResultsAsync(room.Id);

        if (raceResultsByRace == null || raceResultsByRace.Count == 0)
            return (0, 0);

        var existingResults = await raceResultRepository.GetRaceResultsByRoomAsync(room.Id);
        var existingKeys = existingResults
            .Select(r => (r.RoomId, r.RaceNumber, r.ProfileId))
            .ToHashSet();

        var timestamp = DateTime.UtcNow;
        var allNewResults = new List<RaceResultEntity>();
        var skipped = 0;

        foreach (var (raceNumber, raceResults) in raceResultsByRace)
        {
            // A split room (WFC connectivity split) shares one RoomId and RaceNumber across
            // its independent sub-races, distinguished only by PlayerCount. Rank each
            // sub-race separately so positions aren't computed across unrelated races.
            foreach (var subRace in raceResults.GroupBy(r => r.PlayerCount))
            {
                // Build a ProfileID -> correct 1-based position map from FinishTime ordering.
                // PlayerID != 0 is a co-op guest (never stored); FinishTime == 0 is a DNF.
                // Duplicate ProfileIDs (API quirk) are deduplicated by taking the fastest time.
                // All-DNF races produce an empty map; every row falls back to FinishPos = 0.
                var correctedPositions = subRace
                    .Where(r => r.PlayerID == 0 && r.FinishTime != 0)
                    .Select(r => (r.ProfileID, Time: BitConverter.Int32BitsToSingle(r.FinishTime)))
                    .Where(x => x.Time > 0f && !float.IsNaN(x.Time) && !float.IsInfinity(x.Time))
                    .GroupBy(x => x.ProfileID)
                    .Select(g => (ProfileID: g.Key, Time: g.Min(x => x.Time)))
                    .OrderBy(x => x.Time)
                    .Select((x, i) => (x.ProfileID, Pos: (short)(i + 1)))
                    .ToDictionary(x => x.ProfileID, x => x.Pos);

                foreach (var result in subRace)
                {
                    if (result.PlayerID != 0)
                        continue;

                    if (existingKeys.Contains((room.Id, raceNumber, result.ProfileID)))
                    {
                        skipped++;
                        continue;
                    }

                    allNewResults.Add(new RaceResultEntity
                    {
                        RoomId = room.Id,
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
                        // From the tracker, since closed rooms are no longer in the groups list.
                        IsPublic = room.Type == "anybody",
                        Rk = room.Rk
                    });
                }
            }
        }

        if (allNewResults.Count == 0)
            return (0, skipped);

        // The repository drops only the rows a concurrent tick already wrote, so a
        // single duplicate no longer costs us the rest of the room's races.
        var inserted = await raceResultRepository.AddRaceResultsAsync(allNewResults);
        return (inserted, skipped + allNewResults.Count - inserted);
    }
}
