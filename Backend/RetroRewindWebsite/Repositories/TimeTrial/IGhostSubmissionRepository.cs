using RetroRewindWebsite.Models.DTOs.Common;
using RetroRewindWebsite.Models.Entities.TimeTrial;
using RetroRewindWebsite.Repositories.Common;

namespace RetroRewindWebsite.Repositories.TimeTrial;

public interface IGhostSubmissionRepository : IRepository<GhostSubmissionEntity>
{
    // ===== SEARCH =====
    Task<List<GhostSubmissionEntity>> SearchAsync(
        int? ttProfileId = null,
        int? trackId = null,
        short? cc = null,
        bool? glitch = null,
        bool? shroomless = null,
        short? driftCategory = null,
        int limit = 25);

    // ===== LEADERBOARD =====
    Task<PagedResult<GhostSubmissionEntity>> GetTrackLeaderboardAsync(int trackId, short cc, bool glitch, int page, int pageSize);
    Task<List<GhostSubmissionEntity>> GetTopTimesForTrackAsync(int trackId, short cc, bool glitch, int count);
    Task<GhostSubmissionEntity?> GetWorldRecordAsync(int trackId, short cc, bool glitch);
    Task<List<GhostSubmissionEntity>> GetWorldRecordHistoryAsync(int trackId, short cc, bool glitch);
    Task<List<GhostSubmissionEntity>> GetPlayerSubmissionsAsync(int ttProfileId, int? trackId = null, short? cc = null);

    // ===== STATISTICS =====
    Task<int> GetTotalSubmissionsCountAsync();
    Task<int> GetProfileSubmissionsCountAsync(int ttProfileId);
    Task<int> GetProfileWorldRecordsCountAsync(int ttProfileId);
    Task<double> CalculateAverageFinishPositionAsync(int ttProfileId);
    Task<int> CountTop10FinishesAsync(int ttProfileId);
    Task<int?> GetFastestLapForTrackAsync(int trackId, short cc, bool glitch);

    // ===== BKT =====
    Task<GhostSubmissionEntity?> GetBestKnownTimeAsync(
        int trackId,
        short cc,
        bool nonGlitchOnly,
        bool? shroomless = null,
        short? minVehicleId = null,
        short? maxVehicleId = null,
        short? driftType = null,
        short? driftCategory = null);

    // ===== MAINTENANCE =====
    Task UpdateWorldRecordCountsAsync();
}
