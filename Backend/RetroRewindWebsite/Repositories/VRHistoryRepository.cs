using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities;

namespace RetroRewindWebsite.Repositories
{
    public class VRHistoryRepository : IVRHistoryRepository
    {
        private readonly LeaderboardDbContext _context;
        private readonly ILogger<VRHistoryRepository> _logger;

        public VRHistoryRepository(LeaderboardDbContext context, ILogger<VRHistoryRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task AddAsync(VRHistoryEntity vrHistory)
        {
            await _context.VRHistories.AddAsync(vrHistory);
            await _context.SaveChangesAsync();
        }

        public async Task<List<VRHistoryEntity>> GetPlayerHistoryAsync(string playerId, int count = 100)
        {
            return await _context.VRHistories
                .AsNoTracking()
                .Where(h => h.PlayerId == playerId)
                .OrderByDescending(h => h.Date)
                .Take(count)
                .ToListAsync();
        }

        public async Task<List<VRHistoryEntity>> GetPlayerHistoryAsync(string playerId, DateTime fromDate, DateTime toDate)
        {
            return await _context.VRHistories
                .AsNoTracking()
                .Where(h => h.PlayerId == playerId && h.Date >= fromDate && h.Date <= toDate)
                .OrderBy(h => h.Date)
                .ToListAsync();
        }

        public async Task<int> CalculateVRGainAsync(string playerId, TimeSpan timeSpan)
        {
            var fromDate = DateTime.UtcNow.Subtract(timeSpan);

            var totalGain = await _context.VRHistories
                .AsNoTracking()
                .Where(h => h.PlayerId == playerId && h.Date >= fromDate)
                .SumAsync(h => h.VRChange);

            return totalGain;
        }

        public async Task<int> CleanupOldRecordsAsync(DateTime cutoffDate)
        {
            var totalDeleted = 0;
            var batchSize = 1000;

            while (true)
            {
                var recordsToDelete = await _context.VRHistories
                    .Where(h => h.Date < cutoffDate)
                    .Take(batchSize)
                    .ToListAsync();

                if (recordsToDelete.Count == 0)
                    break;

                _context.VRHistories.RemoveRange(recordsToDelete);
                await _context.SaveChangesAsync();

                totalDeleted += recordsToDelete.Count;

                _logger.LogDebug("Deleted {Count} old VR history records", recordsToDelete.Count);

                // Clear the list to help with garbage collection
                recordsToDelete.Clear();
            }

            return totalDeleted;
        }

        public async Task<List<VRHistoryEntity>> GetRecentChangesAsync(int count = 50)
        {
            return await _context.VRHistories
                .AsNoTracking()
                .OrderByDescending(h => h.Date)
                .Take(count)
                .ToListAsync();
        }
    }
}
