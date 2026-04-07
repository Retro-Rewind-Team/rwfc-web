using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.TimeTrial;

namespace RetroRewindWebsite.Repositories.TimeTrial;

public class TTProfileRepository : ITTProfileRepository
{
    private readonly LeaderboardDbContext _context;
    private readonly ILogger<TTProfileRepository> _logger;

    public TTProfileRepository(LeaderboardDbContext context, ILogger<TTProfileRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<TTProfileEntity?> GetByIdAsync(int id) =>
        await _context.TTProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

    public async Task<TTProfileEntity?> GetByNameAsync(string displayName) =>
        await _context.TTProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.DisplayName == displayName);

    public async Task<List<TTProfileEntity>> GetAllAsync() =>
        await _context.TTProfiles
            .AsNoTracking()
            .OrderBy(p => p.DisplayName)
            .ToListAsync();

    public async Task AddAsync(TTProfileEntity profile)
    {
        await _context.TTProfiles.AddAsync(profile);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(TTProfileEntity profile)
    {
        profile.UpdatedAt = DateTime.UtcNow;
        _context.TTProfiles.Update(profile);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var profile = await _context.TTProfiles.FindAsync(id);
        if (profile != null)
        {
            _context.TTProfiles.Remove(profile);
            await _context.SaveChangesAsync();
        }
    }
}
