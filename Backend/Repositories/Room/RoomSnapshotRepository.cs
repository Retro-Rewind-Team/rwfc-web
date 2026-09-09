using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.DTOs.Common;
using RetroRewindWebsite.Models.Entities.Room;

namespace RetroRewindWebsite.Repositories.Room;

public class RoomSnapshotRepository : IRoomSnapshotRepository
{
    private readonly LeaderboardDbContext _context;
    private readonly ILogger<RoomSnapshotRepository> _logger;

    public RoomSnapshotRepository(LeaderboardDbContext context, ILogger<RoomSnapshotRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task AddAsync(RoomSnapshotEntity snapshot)
    {
        await _context.RoomSnapshots.AddAsync(snapshot);
        await _context.SaveChangesAsync();
    }

    public async Task<RoomSnapshotEntity?> GetByDbIdAsync(int id)
    {
        return await _context.RoomSnapshots
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<PagedResult<RoomSnapshotEntity>> GetPagedAsync(int page, int pageSize)
    {
        var query = _context.RoomSnapshots
            .AsNoTracking()
            .OrderByDescending(s => s.Timestamp);

        return await PagedResult<RoomSnapshotEntity>.CreateAsync(query, page, pageSize);
    }

    public async Task<List<RoomSnapshotEntity>> GetByDateRangeAsync(DateTime from, DateTime to)
    {
        return await _context.RoomSnapshots
            .AsNoTracking()
            .Where(s => s.Timestamp >= from && s.Timestamp <= to)
            .OrderByDescending(s => s.Timestamp)
            .ToListAsync();
    }

    public async Task<RoomSnapshotEntity?> GetLatestAsync()
    {
        return await _context.RoomSnapshots
            .AsNoTracking()
            .OrderByDescending(s => s.Timestamp)
            .FirstOrDefaultAsync();
    }

    public async Task<RoomSnapshotEntity?> GetNearestAsync(DateTime timestamp)
    {
        // Two index-friendly queries (no full-table sort) instead of one computed-expression scan
        var before = await _context.RoomSnapshots
            .AsNoTracking()
            .Where(s => s.Timestamp <= timestamp)
            .OrderByDescending(s => s.Timestamp)
            .FirstOrDefaultAsync();

        var after = await _context.RoomSnapshots
            .AsNoTracking()
            .Where(s => s.Timestamp > timestamp)
            .OrderBy(s => s.Timestamp)
            .FirstOrDefaultAsync();

        if (before == null) return after;
        if (after == null) return before;

        return (timestamp - before.Timestamp) <= (after.Timestamp - timestamp) ? before : after;
    }

    public async Task<int> GetMinIdAsync() =>
        await _context.RoomSnapshots.MinAsync(s => (int?)s.Id) ?? 0;

    public async Task<int> GetMaxIdAsync() =>
        await _context.RoomSnapshots.MaxAsync(s => (int?)s.Id) ?? 0;

    public async Task<int> GetPeakPlayerCountAsync(DateTime? since = null)
    {
        var query = _context.RoomSnapshots.AsNoTracking();

        if (since.HasValue)
            query = query.Where(s => s.Timestamp >= since.Value);

        return await query.MaxAsync(s => (int?)s.TotalPlayers) ?? 0;
    }

    public async Task<List<(DateTime Bucket, int MaxPlayers, int MaxRooms)>> GetPlayerCountSeriesAsync(
        DateTime? cutoff, TimeSpan bucketSize)
    {
        if (bucketSize <= TimeSpan.Zero)
            throw new ArgumentException("bucketSize must be positive.", nameof(bucketSize));

        // Bucket and aggregate server-side: one row per bucket instead of one row per snapshot.
        // At a snapshot a minute, an all-time series was every row ever recorded.
        //
        // Truncating the Unix epoch second count reproduces the previous tick-based bucketing
        // exactly for every size in use (10m, 1h, 4h, 12h). Both origins sit at midnight and are a
        // whole number of days apart, so any bucket that divides a day evenly lands on the same
        // boundaries. A size that does not divide a day evenly would shift them.
        var bucketSeconds = (long)bucketSize.TotalSeconds;
        if (bucketSeconds <= 0)
            throw new ArgumentException("bucketSize must be at least one second.", nameof(bucketSize));

        var sql = """
            SELECT to_timestamp(floor(extract(epoch FROM "Timestamp") / {0}) * {0}) AS "Bucket",
                   MAX("TotalPlayers") AS "MaxPlayers",
                   MAX("TotalRooms") AS "MaxRooms"
            FROM "RoomSnapshots"
            """;

        object[] parameters;
        if (cutoff.HasValue)
        {
            sql += "\nWHERE \"Timestamp\" >= {1}";
            parameters = [bucketSeconds, cutoff.Value];
        }
        else
        {
            parameters = [bucketSeconds];
        }

        sql += "\nGROUP BY 1\nORDER BY 1";

        var rows = await _context.Database
            .SqlQueryRaw<PlayerCountBucketRow>(sql, parameters)
            .ToListAsync();

        return [.. rows.Select(r => (
            Bucket: DateTime.SpecifyKind(r.Bucket, DateTimeKind.Utc),
            MaxPlayers: r.MaxPlayers,
            MaxRooms: r.MaxRooms))];
    }

    private sealed record PlayerCountBucketRow(DateTime Bucket, int MaxPlayers, int MaxRooms);
}
