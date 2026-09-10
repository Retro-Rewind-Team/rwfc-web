using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.RaceResult;

namespace RetroRewindWebsite.Repositories.RaceResult;

public class RaceResultRepository : IRaceResultRepository
{
    private readonly LeaderboardDbContext _context;
    private readonly ILogger<RaceResultRepository> _logger;

    public RaceResultRepository(LeaderboardDbContext context, ILogger<RaceResultRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> AddRaceResultsAsync(List<RaceResultEntity> raceResults)
    {
        if (raceResults == null || raceResults.Count == 0)
            return 0;

        await _context.RaceResults.AddRangeAsync(raceResults);

        try
        {
            await _context.SaveChangesAsync();
            _logger.LogDebug("Added {Count} race results to database", raceResults.Count);
            return raceResults.Count;
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            // One row another tick already wrote aborts the whole INSERT, which would otherwise
            // throw away every unrelated race in the same batch. Replay row by row so only the
            // rows that actually collide are dropped.
            DetachPendingInserts();
        }

        var inserted = 0;
        var skipped = 0;

        foreach (var raceResult in raceResults)
        {
            _context.RaceResults.Add(raceResult);

            try
            {
                await _context.SaveChangesAsync();
                inserted++;
            }
            catch (DbUpdateException ex) when (IsUniqueViolation(ex))
            {
                skipped++;
                DetachPendingInserts();
            }
        }

        _logger.LogDebug(
            "Added {Count} race results row by row after a duplicate, skipped {Skipped}",
            inserted, skipped);

        return inserted;
    }

    /// <summary>
    /// A failed SaveChanges leaves its entities tracked as Added, so the next call would resend
    /// them and fail again. Detach them to isolate each retry.
    /// </summary>
    private void DetachPendingInserts()
    {
        foreach (var entry in _context.ChangeTracker.Entries<RaceResultEntity>().ToList())
        {
            if (entry.State == EntityState.Added)
                entry.State = EntityState.Detached;
        }
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is Npgsql.PostgresException { SqlState: "23505" };

    public async Task<List<RaceResultEntity>> GetRaceResultsByRoomAsync(string roomId) =>
        await _context.RaceResults
            .AsNoTracking()
            .Where(r => r.RoomId == roomId)
            .OrderBy(r => r.RaceNumber)
            .ThenBy(r => r.FinishPos)
            .ToListAsync();
}
