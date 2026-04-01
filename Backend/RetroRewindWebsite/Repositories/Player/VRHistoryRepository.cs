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

    public async Task<VRHistoryEntity?> GetByIdAsync(int id) =>
        await _context.VRHistories
            .AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == id);

    public async Task AddAsync(VRHistoryEntity vrHistory)
    {
        await _context.VRHistories.AddAsync(vrHistory);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(VRHistoryEntity vrHistory)
    {
        _context.VRHistories.Update(vrHistory);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var entry = await _context.VRHistories.FindAsync(id);
        if (entry != null)
        {
            _context.VRHistories.Remove(entry);
            await _context.SaveChangesAsync();
        }
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

    public async Task<int> CalculateVRGainAsync(string playerId, TimeSpan timeSpan)
    {
        var fromDate = DateTime.UtcNow.Subtract(timeSpan);
        return await _context.VRHistories
            .AsNoTracking()
            .Where(h => h.PlayerId == playerId && h.Date >= fromDate)
            .SumAsync(h => h.VRChange);
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
