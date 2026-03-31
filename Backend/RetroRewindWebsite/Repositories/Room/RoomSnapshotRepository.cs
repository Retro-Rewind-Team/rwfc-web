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
        return await _context.RoomSnapshots
            .AsNoTracking()
            .OrderBy(s => s.Timestamp > timestamp
                ? s.Timestamp - timestamp
                : timestamp - s.Timestamp)
            .FirstOrDefaultAsync();
    }

    public async Task<int> GetMinIdAsync()
    {
        if (!await _context.RoomSnapshots.AnyAsync())
            return 0;

        return await _context.RoomSnapshots.MinAsync(s => s.Id);
    }

    public async Task<int> GetMaxIdAsync()
    {
        if (!await _context.RoomSnapshots.AnyAsync())
            return 0;

        return await _context.RoomSnapshots.MaxAsync(s => s.Id);
    }

    public async Task<int> GetPeakPlayerCountAsync(DateTime? since = null)
    {
        var query = _context.RoomSnapshots.AsNoTracking();

        if (since.HasValue)
            query = query.Where(s => s.Timestamp >= since.Value);

        if (!await query.AnyAsync())
            return 0;

        return await query.MaxAsync(s => s.TotalPlayers);
    }
}
