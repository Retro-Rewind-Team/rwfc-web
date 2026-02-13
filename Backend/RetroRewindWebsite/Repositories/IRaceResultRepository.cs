using RetroRewindWebsite.Models.Entities;

namespace RetroRewindWebsite.Repositories
{
    public interface IRaceResultRepository
    {
        Task<bool> RaceResultExistsAsync(string roomId, int raceNumber, long profileId);
        Task AddRaceResultAsync(RaceResultEntity raceResult);
        Task AddRaceResultsAsync(List<RaceResultEntity> raceResults);
        Task<List<RaceResultEntity>> GetRaceResultsByRoomAsync(string roomId);
        Task<List<RaceResultEntity>> GetRaceResultsByPlayerAsync(long profileId, int limit);
        Task<int> GetTotalRaceResultsCountAsync();
        Task<DateTime?> GetLastRaceResultTimestampAsync();
    }
}