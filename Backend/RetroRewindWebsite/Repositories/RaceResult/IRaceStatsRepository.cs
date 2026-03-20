using RetroRewindWebsite.Models.Entities.RaceResult;

namespace RetroRewindWebsite.Repositories.RaceResult;

public interface IRaceStatsRepository
{
    // ===== PLAYER =====
    Task<int> GetTotalRaceCountByPlayerAsync(long profileId, DateTime? after, short? courseId);
    Task<DateTime?> GetEarliestRaceTimestampAsync();
    Task<List<(short CourseId, int Count)>> GetTopTracksByPlayerAsync(long profileId, int limit, DateTime? after, short? courseId);
    Task<List<(short Id, int Count)>> GetTopCharactersByPlayerAsync(long profileId, int limit, DateTime? after, short? courseId);
    Task<List<(short Id, int Count)>> GetTopVehiclesByPlayerAsync(long profileId, int limit, DateTime? after, short? courseId);
    Task<List<(short CharacterId, short VehicleId, int Count)>> GetTopCombosByPlayerAsync(long profileId, int limit, DateTime? after, short? courseId);
    Task<long> GetTotalFramesIn1stByPlayerAsync(long profileId, DateTime? after, short? courseId);
    Task<(List<RaceResultEntity> Rows, int TotalCount)> GetRecentRacesByPlayerAsync(long profileId, int page, int pageSize, DateTime? after, short? courseId);

    // ===== GLOBAL =====
    Task<int> GetTotalRaceCountAsync(DateTime? after);
    Task<int> GetUniquePlayerCountAsync(DateTime? after);
    Task<List<(short CourseId, int Count)>> GetAllPlayedTracksAsync(DateTime? after);
    Task<List<(short Id, int Count)>> GetTopCharactersAsync(int limit, DateTime? after);
    Task<List<(short Id, int Count)>> GetTopVehiclesAsync(int limit, DateTime? after);
    Task<List<(short CharacterId, short VehicleId, int Count)>> GetTopCombosAsync(int limit, DateTime? after);
    Task<List<(long ProfileId, int Count)>> GetMostActivePlayersAsync(int limit, DateTime? after);
    Task<List<(int DayOfWeek, int Count)>> GetRaceCountByDayOfWeekAsync(DateTime? after);
    Task<List<(int Hour, int Count)>> GetRaceCountByHourAsync(DateTime? after);
}
