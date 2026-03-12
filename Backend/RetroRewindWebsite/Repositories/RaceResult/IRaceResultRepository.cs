using RetroRewindWebsite.Models.Entities.RaceResult;
using RetroRewindWebsite.Repositories.Common;

namespace RetroRewindWebsite.Repositories.RaceResult;

public interface IRaceResultRepository : IRepository<RaceResultEntity>
{
    Task<bool> RaceResultExistsAsync(string roomId, int raceNumber, long profileId);
    Task AddRaceResultsAsync(List<RaceResultEntity> raceResults);
    Task<List<RaceResultEntity>> GetRaceResultsByRoomAsync(string roomId);
    Task<List<RaceResultEntity>> GetRaceResultsByPlayerAsync(long profileId, int limit);
    Task<int> GetTotalRaceResultsCountAsync();
    Task<DateTime?> GetLastRaceResultTimestampAsync();
}
