using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.Multiplier;

namespace RetroRewindWebsite.Repositories.Multiplier;

public class MultiplierRepository : IMultiplierRepository
{
    private readonly LeaderboardDbContext _context;

    public MultiplierRepository(LeaderboardDbContext context)
    {
        _context = context;
    }

    public async Task<MultiplierEntity> CreateAsync(MultiplierEntity multiplier)
    {
        await _context.Multipliers.AddAsync(multiplier);
        await _context.SaveChangesAsync();
        return multiplier;
    }

    public async Task<MultiplierEntity?> GetByIdAsync(int id)
    {
        return await _context.Multipliers
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == id);
    }

    public async Task<List<MultiplierEntity>> GetAllAsync(MultiplierChannel? channel = null)
    {
        var query = _context.Multipliers.AsNoTracking();

        if (channel.HasValue)
            query = query.Where(m => m.Channel == channel.Value);

        return await query.OrderBy(m => m.StartTime).ToListAsync();
    }

    public async Task UpdateAsync(MultiplierEntity multiplier)
    {
        _context.Multipliers.Update(multiplier);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var rows = await _context.Multipliers.Where(m => m.Id == id).ExecuteDeleteAsync();
        return rows > 0;
    }

    public async Task<MultiplierEntity?> GetActiveAsync(MultiplierChannel channel, DateTime at)
    {
        return await _context.Multipliers
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Channel == channel && m.StartTime <= at && m.EndTime > at);
    }

    public async Task<List<MultiplierEntity>> GetOverlappingAsync(
        MultiplierChannel channel, DateTime start, DateTime end, int? excludeId = null)
    {
        var query = _context.Multipliers
            .AsNoTracking()
            .Where(m => m.Channel == channel && m.StartTime < end && m.EndTime > start);

        if (excludeId.HasValue)
            query = query.Where(m => m.Id != excludeId.Value);

        return await query.ToListAsync();
    }
}
