using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities;

namespace RetroRewindWebsite.Repositories
{
    public class VRHistoryRepository : IVRHistoryRepository
    {
        private readonly LeaderboardDbContext _context;
        private readonly ILogger<VRHistoryRepository> _logger;

        private const int DefaultHistoryCount = 100;
        private const int DefaultRecentChangesCount = 50;

        public VRHistoryRepository(LeaderboardDbContext context, ILogger<VRHistoryRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ===== BASIC OPERATIONS =====

        public async Task AddAsync(VRHistoryEntity vrHistory)
        {
            await _context.VRHistories.AddAsync(vrHistory);
            await _context.SaveChangesAsync();
        }

        // ===== QUERIES =====

        public async Task<List<VRHistoryEntity>> GetPlayerHistoryAsync(
            string playerId,
            DateTime fromDate,
            DateTime toDate)
        {
            return await _context.VRHistories
                .AsNoTracking()
                .Where(h => h.PlayerId == playerId && h.Date >= fromDate && h.Date <= toDate)
                .OrderBy(h => h.Date)
                .ToListAsync();
        }

        public async Task<List<VRHistoryEntity>> GetPlayerHistoryAsync(string playerId, int count = DefaultHistoryCount)
        {
            return await _context.VRHistories
                .AsNoTracking()
                .Where(h => h.PlayerId == playerId)
                .OrderByDescending(h => h.Date)
                .Take(count)
                .ToListAsync();
        }

        public async Task<List<VRHistoryEntity>> GetRecentChangesAsync(int count = DefaultRecentChangesCount)
        {
            return await _context.VRHistories
                .AsNoTracking()
                .OrderByDescending(h => h.Date)
                .Take(count)
                .ToListAsync();
        }

        // ===== CALCULATIONS =====

        public async Task<int> CalculateVRGainAsync(string playerId, TimeSpan timeSpan)
        {
            var fromDate = DateTime.UtcNow.Subtract(timeSpan);

            var totalGain = await _context.VRHistories
                .AsNoTracking()
                .Where(h => h.PlayerId == playerId && h.Date >= fromDate)
                .SumAsync(h => h.VRChange);

            return totalGain;
        }

        // ===== MAINTENANCE =====

        public async Task<int> CleanupOldRecordsAsync(DateTime cutoffDate)
        {
            try
            {
                _logger.LogInformation("Starting cleanup of VR history records before {CutoffDate}", cutoffDate);

                var deletedCount = await _context.VRHistories
                    .Where(h => h.Date < cutoffDate)
                    .ExecuteDeleteAsync();

                _logger.LogInformation("Cleanup completed. Deleted {Count} old VR history records", deletedCount);

                return deletedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during VR history cleanup");
                throw;
            }
        }
    }
}