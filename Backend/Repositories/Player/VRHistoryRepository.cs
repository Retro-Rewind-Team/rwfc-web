using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.Player;

namespace RetroRewindWebsite.Repositories.Player;

public class VRHistoryRepository : IVRHistoryRepository
{
    private readonly LeaderboardDbContext _context;
    private readonly ILogger<VRHistoryRepository> _logger;

    public VRHistoryRepository(LeaderboardDbContext context, ILogger<VRHistoryRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task AddRangeAsync(IEnumerable<VRHistoryEntity> entries)
    {
        await _context.VRHistories.AddRangeAsync(entries);
        await _context.SaveChangesAsync();
    }

    public async Task<List<VRHistoryEntity>> GetPlayerHistoryAsync(
        string playerId,
        DateTime fromDate,
        DateTime toDate) =>
        await _context.VRHistories
            .AsNoTracking()
            .Where(h => h.PlayerId == playerId && h.Date >= fromDate && h.Date <= toDate)
            .OrderBy(h => h.Date)
            .ToListAsync();

    public async Task<List<VRHistoryEntity>> GetPlayerHistoryAsync(string playerId, int count = 100) =>
        await _context.VRHistories
            .AsNoTracking()
            .Where(h => h.PlayerId == playerId)
            .OrderByDescending(h => h.Date)
            .Take(count)
            .ToListAsync();

    public async Task<Dictionary<string, (int Gain24h, int Gain7d, int Gain30d)>> CalculateVRGainsBatchAsync(
        IReadOnlyCollection<string> playerIds)
    {
        if (playerIds.Count == 0)
            return [];

        var now = DateTime.UtcNow;
        var cutoff30d = now.AddDays(-30);
        var cutoff7d = now.AddDays(-7);
        var cutoff24h = now.AddDays(-1);

        // Conditional sums so all three windows come back from one grouped query. The narrower
        // windows are subsets of the 30 day one, so a single pass over the same rows answers all
        // three. This aggregates server-side: the per-player version transferred every history row
        // in the window and summed them in memory, once per player.
        var rows = await _context.VRHistories
            .AsNoTracking()
            .Where(h => playerIds.Contains(h.PlayerId) && h.Date >= cutoff30d)
            .GroupBy(h => h.PlayerId)
            .Select(g => new
            {
                PlayerId = g.Key,
                Gain24h = g.Sum(h => h.Date >= cutoff24h ? h.VRChange : 0),
                Gain7d = g.Sum(h => h.Date >= cutoff7d ? h.VRChange : 0),
                Gain30d = g.Sum(h => h.VRChange)
            })
            .ToListAsync();

        return rows.ToDictionary(r => r.PlayerId, r => (r.Gain24h, r.Gain7d, r.Gain30d));
    }

    public async Task<(int Gain24h, int Gain7d, int Gain30d)> CalculateAllVRGainsAsync(string playerId)
    {
        var now = DateTime.UtcNow;
        var cutoff30d = now.AddDays(-30);
        var cutoff7d = now.AddDays(-7);
        var cutoff24h = now.AddDays(-1);

        // Single query fetching all history within the longest window, then sum in memory
        var rows = await _context.VRHistories
            .AsNoTracking()
            .Where(h => h.PlayerId == playerId && h.Date >= cutoff30d)
            .Select(h => new { h.Date, h.VRChange })
            .ToListAsync();

        return (
            Gain24h: rows.Where(h => h.Date >= cutoff24h).Sum(h => h.VRChange),
            Gain7d: rows.Where(h => h.Date >= cutoff7d).Sum(h => h.VRChange),
            Gain30d: rows.Sum(h => h.VRChange)
        );
    }
}
