using RetroRewindWebsite.Models.DTOs.Common;
using RetroRewindWebsite.Models.Entities.TimeTrial;
using RetroRewindWebsite.Repositories.Common;

namespace RetroRewindWebsite.Repositories.TimeTrial;

public interface IGhostSubmissionRepository : IRepository<GhostSubmissionEntity>
{
    // ===== SEARCH =====

    /// <summary>
    /// Asynchronously searches for ghost submissions matching the specified filter criteria.
    /// </summary>
    /// <param name="ttProfileId">The unique identifier of the time trial profile to filter results. If null, submissions from all profiles are
    /// included.</param>
    /// <param name="trackId">The unique identifier of the track to filter results. If null, submissions from all tracks are included.</param>
    /// <param name="cc">The engine class to filter results, specified as a short integer. If null, submissions from all engine classes
    /// are included.</param>
    /// <param name="glitch">A value indicating whether to filter results by glitch runs. If null, both glitch and non-glitch submissions are
    /// included.</param>
    /// <param name="shroomless">A value indicating whether to filter results by shroomless runs. If null, both shroomless and non-shroomless
    /// submissions are included.</param>
    /// <param name="driftCategory">The drift category to filter results, specified as a short integer. If null, submissions from all drift
    /// categories are included.</param>
    /// <param name="limit">The maximum number of submissions to return. Must be a positive integer.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of ghost submissions matching
    /// the specified criteria. The list may be empty if no submissions are found.</returns>
    Task<List<GhostSubmissionEntity>> SearchAsync(
        int? ttProfileId = null,
        int? trackId = null,
        short? cc = null,
        bool? glitch = null,
        bool? shroomless = null,
        short? driftCategory = null,
        int limit = 25);

    // ===== LEADERBOARD =====

    /// <summary>
    /// Retrieves a paged leaderboard of ghost submissions for a specific track and configuration.
    /// </summary>
    /// <remarks>Use this method to obtain leaderboard data for a track, filtered by engine class and glitch
    /// status. Paging parameters allow efficient retrieval of large leaderboards.</remarks>
    /// <param name="trackId">The unique identifier of the track for which to retrieve leaderboard entries.</param>
    /// <param name="cc">The engine class (in cubic centimeters) used to filter leaderboard results. Typical values are 50, 100, 150, or
    /// 200.</param>
    /// <param name="glitch">A value indicating whether to include glitch runs. Set to <see langword="true"/> to include glitch submissions;
    /// otherwise, only non-glitch runs are returned.</param>
    /// <param name="page">The zero-based page index of the leaderboard results to retrieve. Must be greater than or equal to 0.</param>
    /// <param name="pageSize">The maximum number of leaderboard entries to return per page. Must be greater than 0.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a paged collection of ghost
    /// submissions for the specified track and configuration.</returns>
    Task<PagedResult<GhostSubmissionEntity>> GetTrackLeaderboardAsync(int trackId, short cc, bool glitch, int page, int pageSize);

    /// <summary>
    /// Retrieves the top ghost submission times for a specified track, filtered by engine class and glitch usage.
    /// </summary>
    /// <param name="trackId">The unique identifier of the track for which to retrieve top times.</param>
    /// <param name="cc">The engine class to filter results by. Typical values are 50, 100, 150, or 200.</param>
    /// <param name="glitch">A value indicating whether to include submissions that use glitches. Set to <see langword="true"/> to include
    /// glitch runs; otherwise, <see langword="false"/>.</param>
    /// <param name="count">The maximum number of top times to return. Must be positive.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of ghost submission entities
    /// representing the top times for the specified track. The list will be empty if no submissions match the criteria.</returns>
    Task<List<GhostSubmissionEntity>> GetTopTimesForTrackAsync(int trackId, short cc, bool glitch, int count);

    /// <summary>
    /// Retrieves the fastest recorded ghost submission for the specified track, engine class, and glitch setting.
    /// </summary>
    /// <param name="trackId">The unique identifier of the track for which to retrieve the world record.</param>
    /// <param name="cc">The engine class to filter the world record by. Typical values are 50, 100, 150, or 200.</param>
    /// <param name="glitch">A value indicating whether to consider glitch runs (<see langword="true"/>) or only non-glitch runs (<see
    /// langword="false"/>).</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the world record ghost submission
    /// entity if found; otherwise, <see langword="null"/>.</returns>
    Task<GhostSubmissionEntity?> GetWorldRecordAsync(int trackId, short cc, bool glitch);

    /// <summary>
    /// Retrieves the history of world record ghost submissions for the specified track, engine class, and glitch
    /// setting.
    /// </summary>
    /// <param name="trackId">The unique identifier of the track for which to retrieve world record history.</param>
    /// <param name="cc">The engine class of the track, typically represented in cubic centimeters (cc).</param>
    /// <param name="glitch">A value indicating whether to include records achieved using glitches. Set to <see langword="true"/> to include
    /// glitch records; otherwise, <see langword="false"/>.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of ghost submission entities
    /// representing the world record history for the specified criteria. The list will be empty if no records are
    /// found.</returns>
    Task<List<GhostSubmissionEntity>> GetWorldRecordHistoryAsync(int trackId, short cc, bool glitch);

    /// <summary>
    /// Retrieves a list of ghost submissions for the specified player, optionally filtered by track and engine class.
    /// </summary>
    /// <param name="ttProfileId">The unique identifier of the player whose submissions are to be retrieved.</param>
    /// <param name="trackId">The identifier of the track to filter submissions. If null, submissions from all tracks are included.</param>
    /// <param name="cc">The engine class to filter submissions. If null, submissions from all engine classes are included.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of ghost submissions for the
    /// specified player, filtered as requested. The list will be empty if no submissions are found.</returns>
    Task<List<GhostSubmissionEntity>> GetPlayerSubmissionsAsync(int ttProfileId, int? trackId = null, short? cc = null);

    // ===== STATISTICS =====

    /// <summary>
    /// Asynchronously retrieves the total number of submissions.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result contains the total count of submissions as an
    /// integer.</returns>
    Task<int> GetTotalSubmissionsCountAsync();

    /// <summary>
    /// Asynchronously retrieves the total number of submissions associated with the specified profile.
    /// </summary>
    /// <param name="ttProfileId">The unique identifier of the profile for which to count submissions. Must be a valid profile ID.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the number of submissions for the
    /// specified profile.</returns>
    Task<int> GetProfileSubmissionsCountAsync(int ttProfileId);

    /// <summary>
    /// Asynchronously retrieves the number of world records associated with the specified profile.
    /// </summary>
    /// <param name="ttProfileId">The unique identifier of the profile for which to count world records. Must be a valid profile ID.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the total number of world records
    /// for the specified profile.</returns>
    Task<int> GetProfileWorldRecordsCountAsync(int ttProfileId);

    /// <summary>
    /// Calculates the average finish position for the specified profile asynchronously.
    /// </summary>
    /// <param name="ttProfileId">The unique identifier of the profile for which to calculate the average finish position. Must be a valid profile
    /// ID.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the average finish position as a
    /// double value. Returns 0 if no finish positions are available.</returns>
    Task<double> CalculateAverageFinishPositionAsync(int ttProfileId);

    /// <summary>
    /// Asynchronously counts the number of top 10 finishes for the specified profile.
    /// </summary>
    /// <param name="ttProfileId">The unique identifier of the profile for which to count top 10 finishes. Must be a valid profile ID.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the number of top 10 finishes for
    /// the specified profile.</returns>
    Task<int> CountTop10FinishesAsync(int ttProfileId);

    /// <summary>
    /// Asynchronously retrieves the fastest lap time for the specified track and engine class, optionally considering
    /// glitch shortcuts.
    /// </summary>
    /// <param name="trackId">The unique identifier of the track for which to retrieve the fastest lap time.</param>
    /// <param name="cc">The engine class, in cubic centimeters (cc), used to filter lap times. Typical values are 50, 100, 150, or 200.</param>
    /// <param name="glitch">A value indicating whether glitch shortcuts are allowed when determining the fastest lap time. Set to <see
    /// langword="true"/> to include laps using glitches; otherwise, <see langword="false"/>.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the fastest lap time in
    /// milliseconds, or <see langword="null"/> if no valid lap exists for the specified criteria.</returns>
    Task<int?> GetFastestLapForTrackAsync(int trackId, short cc, bool glitch);

    // ===== BKT =====

    /// <summary>
    /// Asynchronously retrieves the best known time for a track, filtered by specified criteria such as engine class,
    /// glitch usage, shroomless status, vehicle range, and drift settings.
    /// </summary>
    /// <param name="trackId">The unique identifier of the track for which to retrieve the best known time.</param>
    /// <param name="cc">The engine class to filter results by. Typical values are 50, 100, 150, or 200.</param>
    /// <param name="nonGlitchOnly">Specifies whether to exclude runs that use glitches. Set to <see langword="true"/> to include only non-glitch
    /// runs; otherwise, include all runs.</param>
    /// <param name="shroomless">Indicates whether to filter for shroomless runs. Set to <see langword="true"/> to include only shroomless runs,
    /// <see langword="false"/> to exclude them, or <see langword="null"/> to ignore this filter.</param>
    /// <param name="minVehicleId">The minimum vehicle identifier to filter results by. If <see langword="null"/>, no lower bound is applied.</param>
    /// <param name="maxVehicleId">The maximum vehicle identifier to filter results by. If <see langword="null"/>, no upper bound is applied.</param>
    /// <param name="driftType">The drift type to filter results by. If <see langword="null"/>, all drift types are included.</param>
    /// <param name="driftCategory">The drift category to filter results by. If <see langword="null"/>, all drift categories are included.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a <see
    /// cref="GhostSubmissionEntity"/> representing the best known time matching the specified criteria, or <see
    /// langword="null"/> if no matching submission is found.</returns>
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

    /// <summary>
    /// Updates the counts of world records in the system asynchronously.
    /// </summary>
    /// <remarks>Call this method to refresh world record statistics after relevant data changes. The
    /// operation is performed asynchronously and does not block the calling thread.</remarks>
    /// <returns>A task that represents the asynchronous update operation.</returns>
    Task UpdateWorldRecordCountsAsync();
}
