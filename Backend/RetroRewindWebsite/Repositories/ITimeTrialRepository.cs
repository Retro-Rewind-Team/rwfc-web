using RetroRewindWebsite.Models.Common;
using RetroRewindWebsite.Models.Entities;

namespace RetroRewindWebsite.Repositories
{
    public interface ITimeTrialRepository
    {
        // ===== TRACK OPERATIONS =====

        /// <summary>
        /// Get track by ID
        /// </summary>
        Task<TrackEntity?> GetTrackByIdAsync(int id);

        /// <summary>
        /// Get all tracks ordered by ID and category
        /// </summary>
        Task<List<TrackEntity>> GetAllTracksAsync();

        /// <summary>
        /// Get track by course ID (track slot)
        /// </summary>
        Task<TrackEntity?> GetTrackByCourseIdAsync(short courseId);

        /// <summary>
        /// Add a new track to the database
        /// </summary>
        Task AddTrackAsync(TrackEntity track);

        // ===== TT PROFILE OPERATIONS =====

        /// <summary>
        /// Get Time Trial profile by ID
        /// </summary>
        Task<TTProfileEntity?> GetTTProfileByIdAsync(int id);

        /// <summary>
        /// Get Time Trial profile by display name
        /// </summary>
        Task<TTProfileEntity?> GetTTProfileByNameAsync(string displayName);

        /// <summary>
        /// Add a new Time Trial profile
        /// </summary>
        Task AddTTProfileAsync(TTProfileEntity profile);

        /// <summary>
        /// Update an existing Time Trial profile
        /// </summary>
        Task UpdateTTProfileAsync(TTProfileEntity profile);

        /// <summary>
        /// Get all Time Trial profiles
        /// </summary>
        Task<List<TTProfileEntity>> GetAllTTProfilesAsync();

        /// <summary>
        /// Delete a Time Trial profile by ID
        /// </summary>
        Task DeleteTTProfileAsync(int id);

        // ===== GHOST SUBMISSION OPERATIONS =====

        /// <summary>
        /// Get ghost submission by ID
        /// </summary>
        Task<GhostSubmissionEntity?> GetGhostSubmissionByIdAsync(int id);

        /// <summary>
        /// Add a new ghost submission
        /// </summary>
        Task AddGhostSubmissionAsync(GhostSubmissionEntity submission);

        /// <summary>
        /// Delete a ghost submission by ID
        /// </summary>
        Task DeleteGhostSubmissionAsync(int id);

        // ===== LEADERBOARD QUERIES =====

        /// <summary>
        /// Get paginated leaderboard for a specific track and CC
        /// </summary>
        /// <param name="trackId">Track ID</param>
        /// <param name="cc">CC value (150 or 200)</param>
        /// <param name="glitch">Whether to include glitch runs</param>
        /// <param name="page">Page number (1-indexed)</param>
        /// <param name="pageSize">Number of results per page</param>
        Task<PagedResult<GhostSubmissionEntity>> GetTrackLeaderboardAsync(
            int trackId,
            short cc,
            bool glitch,
            int page,
            int pageSize);

        /// <summary>
        /// Get top N times for a specific track and CC
        /// </summary>
        Task<List<GhostSubmissionEntity>> GetTopTimesForTrackAsync(
            int trackId,
            short cc,
            bool glitch,
            int count);

        /// <summary>
        /// Get the current world record for a specific track, CC and glitch
        /// </summary>
        Task<GhostSubmissionEntity?> GetWorldRecordAsync(int trackId, short cc, bool glitch);

        /// <summary>
        /// Get all submissions for a specific player profile
        /// </summary>
        /// <param name="ttProfileId">Time Trial profile ID</param>
        /// <param name="trackId">Optional: Filter by track ID</param>
        /// <param name="cc">Optional: Filter by CC (150 or 200)</param>
        Task<List<GhostSubmissionEntity>> GetPlayerSubmissionsAsync(
            int ttProfileId,
            int? trackId = null,
            short? cc = null);

        /// <summary>
        /// Get world record history for a specific track, CC and glitch (chronologically ordered)
        /// </summary>
        Task<List<GhostSubmissionEntity>> GetWorldRecordHistoryAsync(int trackId, short cc, bool glitch);

        // ===== STATISTICS =====

        /// <summary>
        /// Get total number of ghost submissions across all tracks
        /// </summary>
        Task<int> GetTotalSubmissionsCountAsync();

        /// <summary>
        /// Get number of submissions for a specific profile
        /// </summary>
        Task<int> GetProfileSubmissionsCountAsync(int ttProfileId);

        /// <summary>
        /// Get number of world records held by a specific profile
        /// </summary>
        Task<int> GetProfileWorldRecordsCountAsync(int ttProfileId);

        /// <summary>
        /// Calculate average finish position for a player across all their submissions
        /// </summary>
        Task<double> CalculateAverageFinishPositionAsync(int ttProfileId);

        /// <summary>
        /// Count how many top 10 finishes a player has
        /// </summary>
        Task<int> CountTop10FinishesAsync(int ttProfileId);

        /// <summary>
        /// Get the fastest lap time for a specific track, CC and glitch (across all submissions)
        /// </summary>
        Task<int?> GetFastestLapForTrackAsync(int trackId, short cc, bool glitch);
    }
}