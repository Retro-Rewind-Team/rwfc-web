using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities;

namespace RetroRewindWebsite.Repositories
{
    public class RaceResultRepository : IRaceResultRepository
    {
        private readonly LeaderboardDbContext _context;
        private readonly ILogger<RaceResultRepository> _logger;

        public RaceResultRepository(
            LeaderboardDbContext context,
            ILogger<RaceResultRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<bool> RaceResultExistsAsync(string roomId, int raceNumber, long profileId)
        {
            return await _context.RaceResults
                .AnyAsync(r => r.RoomId == roomId &&
                              r.RaceNumber == raceNumber &&
                              r.ProfileId == profileId);
        }

        public async Task AddRaceResultAsync(RaceResultEntity raceResult)
        {
            await _context.RaceResults.AddAsync(raceResult);
            await _context.SaveChangesAsync();
        }

        public async Task AddRaceResultsAsync(List<RaceResultEntity> raceResults)
        {
            if (raceResults == null || raceResults.Count == 0)
            {
                return;
            }

            await _context.RaceResults.AddRangeAsync(raceResults);
            await _context.SaveChangesAsync();

            _logger.LogDebug("Added {Count} race results to database", raceResults.Count);
        }

        public async Task<List<RaceResultEntity>> GetRaceResultsByRoomAsync(string roomId)
        {
            return await _context.RaceResults
                .AsNoTracking()
                .Where(r => r.RoomId == roomId)
                .OrderBy(r => r.RaceNumber)
                .ThenBy(r => r.FinishPos)
                .ToListAsync();
        }

        public async Task<List<RaceResultEntity>> GetRaceResultsByPlayerAsync(long profileId, int limit)
        {
            return await _context.RaceResults
                .AsNoTracking()
                .Where(r => r.ProfileId == profileId)
                .OrderByDescending(r => r.RaceTimestamp)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<int> GetTotalRaceResultsCountAsync()
        {
            return await _context.RaceResults.CountAsync();
        }

        public async Task<DateTime?> GetLastRaceResultTimestampAsync()
        {
            return await _context.RaceResults
                .OrderByDescending(r => r.RaceTimestamp)
                .Select(r => r.RaceTimestamp)
                .FirstOrDefaultAsync();
        }
    }
}