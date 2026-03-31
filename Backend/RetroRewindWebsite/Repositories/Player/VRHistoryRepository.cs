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

    public async Task<List<VRHistoryEntity>> GetRecentChangesAsync(int count = 50) =>
        await _context.VRHistories
            .AsNoTracking()
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
}
