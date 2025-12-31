using RetroRewindWebsite.Models.Common;
using RetroRewindWebsite.Models.Entities;

namespace RetroRewindWebsite.Repositories
{
    public interface ITimeTrialRepository
    {
        // Track operations
        Task<TrackEntity?> GetTrackByIdAsync(int id);
        Task<List<TrackEntity>> GetAllTracksAsync();
        Task<TrackEntity?> GetTrackByCourseIdAsync(short courseId);
        Task AddTrackAsync(TrackEntity track);

        // TT Profile operations
        Task<TTProfileEntity?> GetTTProfileByIdAsync(int id);
        Task<TTProfileEntity?> GetTTProfileByNameAsync(string displayName);
        Task AddTTProfileAsync(TTProfileEntity profile);
        Task UpdateTTProfileAsync(TTProfileEntity profile);

        // Ghost Submission operations
        Task<GhostSubmissionEntity?> GetGhostSubmissionByIdAsync(int id);
        Task AddGhostSubmissionAsync(GhostSubmissionEntity submission);
        Task DeleteGhostSubmissionAsync(int id);

        // Leaderboard queries
        Task<PagedResult<GhostSubmissionEntity>> GetTrackLeaderboardAsync(
            int trackId,
            short cc,
            int page,
            int pageSize);

        Task<List<GhostSubmissionEntity>> GetTopTimesForTrackAsync(
            int trackId,
            short cc,
            int count);

        Task<GhostSubmissionEntity?> GetWorldRecordAsync(int trackId, short cc);

        Task<List<GhostSubmissionEntity>> GetPlayerSubmissionsAsync(
            int ttProfileId,
            int? trackId = null,
            short? cc = null);

        // Stats
        Task<int> GetTotalSubmissionsCountAsync();
        Task<int> GetProfileSubmissionsCountAsync(int ttProfileId);
        Task<int> GetProfileWorldRecordsCountAsync(int ttProfileId);
        Task<List<GhostSubmissionEntity>> GetWorldRecordHistoryAsync(int trackId, short cc);
        Task<double> CalculateAverageFinishPositionAsync(int ttProfileId);
        Task<int> CountTop10FinishesAsync(int ttProfileId);
        Task<List<TTProfileEntity>> GetAllTTProfilesAsync();
        Task DeleteTTProfileAsync(int id);
        Task<int?> GetFastestLapForTrackAsync(int trackId, short cc);
    }
}