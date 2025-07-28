using RetroRewindWebsite.Models.Entities;

namespace RetroRewindWebsite.Repositories
{
    public interface IVRHistoryRepository
    {
        Task AddAsync(VRHistoryEntity vrHistory);
        Task<List<VRHistoryEntity>> GetPlayerHistoryAsync(string playerId, int count = 100);
        Task<List<VRHistoryEntity>> GetPlayerHistoryAsync(string playerId, DateTime fromDate, DateTime toDate);
        Task<int> CalculateVRGainAsync(string playerId, TimeSpan timeSpan);
        Task<int> CleanupOldRecordsAsync(DateTime cutoffDate);
        Task<List<VRHistoryEntity>> GetRecentChangesAsync(int count = 50);
    }
}
