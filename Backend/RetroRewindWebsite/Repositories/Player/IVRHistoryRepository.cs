using RetroRewindWebsite.Models.Entities.Player;
using RetroRewindWebsite.Repositories.Common;

namespace RetroRewindWebsite.Repositories.Player;

public interface IVRHistoryRepository : IRepository<VRHistoryEntity>
{
    Task<List<VRHistoryEntity>> GetPlayerHistoryAsync(string playerId, DateTime fromDate, DateTime toDate);
    Task<List<VRHistoryEntity>> GetPlayerHistoryAsync(string playerId, int count = 100);
    Task<List<VRHistoryEntity>> GetRecentChangesAsync(int count = 50);
    Task<int> CalculateVRGainAsync(string playerId, TimeSpan timeSpan);
    Task<int> CleanupOldRecordsAsync(DateTime cutoffDate);
}
