using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.TimeTrial;

namespace RetroRewindWebsite.Repositories.TimeTrial;

public class TrackRepository : ITrackRepository
{
    private readonly LeaderboardDbContext _context;

    public TrackRepository(LeaderboardDbContext context)
    {
        _context = context;
    }

    public async Task<TrackEntity?> GetByIdAsync(int id) =>
        await _context.Tracks
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id);

    public async Task<List<TrackEntity>> GetAllTracksAsync() =>
        await _context.Tracks
            .AsNoTracking()
            .OrderBy(t => t.SortOrder)
            .ToListAsync();

    public async Task AddAsync(TrackEntity track)
    {
        await _context.Tracks.AddAsync(track);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(TrackEntity track)
    {
        _context.Tracks.Update(track);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var track = await _context.Tracks.FindAsync(id);
        if (track != null)
        {
            _context.Tracks.Remove(track);
            await _context.SaveChangesAsync();
        }
    }
}
