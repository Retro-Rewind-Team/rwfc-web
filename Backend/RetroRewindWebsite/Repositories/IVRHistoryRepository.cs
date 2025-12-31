using RetroRewindWebsite.Models.Entities;

namespace RetroRewindWebsite.Repositories
{
    public interface IVRHistoryRepository
    {
        // ===== BASIC OPERATIONS =====

        /// <summary>
        /// Add VR history entry
        /// </summary>
        Task AddAsync(VRHistoryEntity vrHistory);

        // ===== QUERIES =====

        /// <summary>
        /// Get player's VR history for a date range
        /// </summary>
        Task<List<VRHistoryEntity>> GetPlayerHistoryAsync(string playerId, DateTime fromDate, DateTime toDate);

        /// <summary>
        /// Get player's most recent VR history entries
        /// </summary>
        Task<List<VRHistoryEntity>> GetPlayerHistoryAsync(string playerId, int count = 100);

        /// <summary>
        /// Get recent VR changes across all players
        /// </summary>
        Task<List<VRHistoryEntity>> GetRecentChangesAsync(int count = 50);

        // ===== CALCULATIONS =====

        /// <summary>
        /// Calculate total VR gain for a player over a time span
        /// </summary>
        Task<int> CalculateVRGainAsync(string playerId, TimeSpan timeSpan);

        // ===== MAINTENANCE =====

        /// <summary>
        /// Delete old VR history records before cutoff date
        /// </summary>
        Task<int> CleanupOldRecordsAsync(DateTime cutoffDate);
    }
}