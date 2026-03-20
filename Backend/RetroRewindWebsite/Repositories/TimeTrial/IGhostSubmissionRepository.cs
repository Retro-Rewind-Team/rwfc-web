using RetroRewindWebsite.Models.DTOs.Common;
using RetroRewindWebsite.Models.Entities.TimeTrial;

namespace RetroRewindWebsite.Repositories.TimeTrial;

public interface IGhostSubmissionRepository
{
    /// <summary>
    /// Retrieves a ghost submission entity by its unique identifier asynchronously.
    /// </summary>
    /// <param name="id">The unique identifier of the ghost submission to retrieve. Must be greater than zero.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the ghost submission entity if
    /// found; otherwise, null.</returns>
    Task<GhostSubmissionEntity?> GetByIdAsync(int id);

    /// <summary>
    /// Asynchronously adds a new ghost submission entity to the data store.
    /// </summary>
    /// <param name="submission">The ghost submission entity to add. Cannot be null.</param>
    /// <returns>A task that represents the asynchronous add operation.</returns>
    Task AddAsync(GhostSubmissionEntity submission);

    /// <summary>
    /// Asynchronously updates the specified ghost submission entity in the data store.
    /// </summary>
    /// <param name="submission">The ghost submission entity to update. Cannot be null.</param>
    /// <returns>A task that represents the asynchronous update operation.</returns>
    Task UpdateAsync(GhostSubmissionEntity submission);

    /// <summary>
    /// Asynchronously deletes the entity with the specified identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the entity to delete. Must be a valid, existing entity ID.</param>
    /// <returns>A task that represents the asynchronous delete operation.</returns>
    Task DeleteAsync(int id);

    /// <summary>
    /// Asynchronously searches for ghost submissions matching the specified criteria.
    /// </summary>
    /// <remarks>All filter parameters are optional. If a parameter is not specified, the search includes all
    /// possible values for that criterion. The method is thread-safe and can be called concurrently.</remarks>
    /// <param name="ttProfileId">The unique identifier of the time trial profile to filter results. If null, submissions from all profiles are
    /// included.</param>
    /// <param name="trackId">The unique identifier of the track to filter results. If null, submissions from all tracks are included.</param>
    /// <param name="cc">The engine class to filter results, specified in cubic centimeters (cc). If null, submissions from all engine
    /// classes are included.</param>
    /// <param name="glitch">Indicates whether to filter results by glitch category. If null, both glitch and non-glitch submissions are
    /// included.</param>
    /// <param name="shroomless">Indicates whether to filter results by shroomless category. If null, both shroomless and non-shroomless
    /// submissions are included.</param>
    /// <param name="isFlap"></param>
    /// <param name="driftCategory">The drift category to filter results. If null, submissions from all drift categories are included.</param>
    /// <param name="limit">The maximum number of submissions to return. Must be a positive integer.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of ghost submissions matching
    /// the specified filters. The list may be empty if no submissions are found.</returns>
    Task<List<GhostSubmissionEntity>> SearchAsync(
        int? ttProfileId = null,
        int? trackId = null,
        short? cc = null,
        bool? glitch = null,
        bool? shroomless = null,
        bool? isFlap = null,
        short? driftCategory = null,
        int limit = 25);

    /// <summary>
    /// Retrieves a paged leaderboard of ghost submissions for a specific track, filtered by engine class, glitch
    /// allowance, shroomless status, vehicle range, and pagination parameters.
    /// </summary>
    /// <param name="trackId">The unique identifier of the track for which to retrieve leaderboard entries.</param>
    /// <param name="cc">The engine class to filter leaderboard entries by. Values are 150 or 200.</param>
    /// <param name="glitchAllowed">A value indicating whether glitch submissions are included in the leaderboard. Set to <see langword="true"/> to
    /// allow glitches; otherwise, <see langword="false"/>.</param>
    /// <param name="shroomless">An optional value indicating whether to filter for shroomless submissions. If <see langword="true"/>, only
    /// shroomless runs are included; if <see langword="false"/>, only runs with shrooms are included; if <see
    /// langword="null"/>, both types are included.</param>
    /// <param name="minVehicleId">An optional minimum vehicle identifier to filter leaderboard entries. Only submissions with a vehicle ID greater
    /// than or equal to this value are included.</param>
    /// <param name="maxVehicleId">An optional maximum vehicle identifier to filter leaderboard entries. Only submissions with a vehicle ID less
    /// than or equal to this value are included.</param>
    /// <param name="page">The zero-based page index of leaderboard results to retrieve. Must be greater than or equal to 0.</param>
    /// <param name="pageSize">The number of leaderboard entries to include per page. Must be greater than 0.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a paged collection of ghost
    /// submission entities matching the specified filters. The collection may be empty if no submissions meet the
    /// criteria.</returns>
    Task<PagedResult<GhostSubmissionEntity>> GetTrackLeaderboardAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? minVehicleId,
        short? maxVehicleId,
        int page,
        int pageSize);

    /// <summary>
    /// Asynchronously retrieves a list of the fastest ghost submissions for a specified track, filtered by engine
    /// class, glitch allowance, shroomless status, vehicle ID range, and result count.
    /// </summary>
    /// <param name="trackId">The unique identifier of the track for which to retrieve top ghost times.</param>
    /// <param name="cc">The engine class to filter results by, specified in cubic centimeters (cc).</param>
    /// <param name="glitchAllowed">A value indicating whether glitch runs are allowed in the results. Set to <see langword="true"/> to include
    /// glitch runs; otherwise, <see langword="false"/>.</param>
    /// <param name="shroomless">An optional value indicating whether to filter for shroomless runs. If <see langword="true"/>, only shroomless
    /// runs are included; if <see langword="false"/>, only runs with mushrooms are included; if <see langword="null"/>,
    /// both types are included.</param>
    /// <param name="minVehicleId">An optional minimum vehicle ID to filter results. If specified, only submissions with a vehicle ID greater than
    /// or equal to this value are included.</param>
    /// <param name="maxVehicleId">An optional maximum vehicle ID to filter results. If specified, only submissions with a vehicle ID less than or
    /// equal to this value are included.</param>
    /// <param name="count">The maximum number of top ghost submissions to return. Must be a positive integer.</param>
    /// <returns>A task representing the asynchronous operation. The task result contains a list of ghost submission entities
    /// ordered by fastest time, limited by the specified count. The list may be empty if no submissions match the
    /// filters.</returns>
    Task<List<GhostSubmissionEntity>> GetTopTimesForTrackAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? minVehicleId,
        short? maxVehicleId,
        int count);

    /// <summary>
    /// Retrieves a paged leaderboard of ghost submissions for the specified track, filtered by engine class, glitch
    /// allowance, shroomless mode, vehicle range, and pagination parameters.
    /// </summary>
    /// <param name="trackId">The identifier of the track for which to retrieve leaderboard entries.</param>
    /// <param name="cc">The engine class to filter leaderboard entries by. Values are 150 or 200.</param>
    /// <param name="glitchAllowed">A value indicating whether glitch runs are allowed in the leaderboard results.</param>
    /// <param name="shroomless">A value indicating whether to filter for shroomless runs. If null, both shroomless and non-shroomless runs are
    /// included.</param>
    /// <param name="minVehicleId">The minimum vehicle identifier to include in the results. If null, no lower bound is applied.</param>
    /// <param name="maxVehicleId">The maximum vehicle identifier to include in the results. If null, no upper bound is applied.</param>
    /// <param name="page">The zero-based page index of the leaderboard results to retrieve. Must be greater than or equal to 0.</param>
    /// <param name="pageSize">The number of leaderboard entries to include per page. Must be greater than 0.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a paged collection of ghost
    /// submission entities matching the specified filters.</returns>
    Task<PagedResult<GhostSubmissionEntity>> GetFlapLeaderboardAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? minVehicleId,
        short? maxVehicleId,
        int page,
        int pageSize);

    /// <summary>
    /// Retrieves the fastest ghost submission for the specified track and configuration asynchronously.
    /// </summary>
    /// <remarks>If multiple submissions match the criteria, the one with the lowest completion time is
    /// returned. This method does not guarantee thread safety for concurrent calls.</remarks>
    /// <param name="trackId">The unique identifier of the track for which to retrieve the world record.</param>
    /// <param name="cc">The engine class, in cubic centimeters, used for the record attempt. Values are 150 or 200.</param>
    /// <param name="glitchAllowed">A value indicating whether glitch techniques are permitted in the record search. Set to <see langword="true"/>
    /// to include glitch runs; otherwise, <see langword="false"/>.</param>
    /// <param name="shroomless">A value indicating whether the record must be achieved without using mushrooms. If <see langword="true"/>, only
    /// shroomless runs are considered; if <see langword="false"/>, only runs with mushrooms are considered; if <see
    /// langword="null"/>, both types are included.</param>
    /// <param name="minVehicleId">The minimum vehicle identifier to filter eligible submissions. If <see langword="null"/>, no lower bound is
    /// applied.</param>
    /// <param name="maxVehicleId">The maximum vehicle identifier to filter eligible submissions. If <see langword="null"/>, no upper bound is
    /// applied.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the fastest matching ghost
    /// submission, or <see langword="null"/> if no submission meets the criteria.</returns>
    Task<GhostSubmissionEntity?> GetWorldRecordAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless = null,
        short? minVehicleId = null,
        short? maxVehicleId = null);

    /// <summary>
    /// Retrieves the history of world record ghost submissions for a specified track and configuration.
    /// </summary>
    /// <param name="trackId">The unique identifier of the track for which to retrieve world record history.</param>
    /// <param name="cc">The engine class of the track, specified in cubic centimeters (cc).</param>
    /// <param name="glitchAllowed">A value indicating whether glitch techniques are permitted in the record history.</param>
    /// <param name="shroomless">A value indicating whether shroomless runs should be included. If null, both types are considered.</param>
    /// <param name="minVehicleId">The minimum vehicle identifier to filter submissions. If null, no lower bound is applied.</param>
    /// <param name="maxVehicleId">The maximum vehicle identifier to filter submissions. If null, no upper bound is applied.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of ghost submission entities
    /// representing the world record history for the specified criteria. The list may be empty if no records are found.</returns>
    Task<List<GhostSubmissionEntity>> GetWorldRecordHistoryAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless = null,
        short? minVehicleId = null,
        short? maxVehicleId = null);

    /// <summary>
    /// Retrieves the history of world record ghost submissions for the Flap category on a specified track, filtered by
    /// game settings and vehicle criteria.
    /// </summary>
    /// <param name="trackId">The unique identifier of the track for which to retrieve world record history.</param>
    /// <param name="cc">The engine class to filter results by. Values are 150 or 200.</param>
    /// <param name="glitchAllowed">Indicates whether glitch techniques are permitted in the record submissions. Set to <see langword="true"/> to
    /// include glitch runs; otherwise, <see langword="false"/>.</param>
    /// <param name="shroomless">If specified, filters results to include only shroomless runs (<see langword="true"/>) or runs where mushrooms
    /// are allowed (<see langword="false"/>). If null, both types are included.</param>
    /// <param name="minVehicleId">If specified, filters results to include only submissions with vehicle IDs greater than or equal to this value.</param>
    /// <param name="maxVehicleId">If specified, filters results to include only submissions with vehicle IDs less than or equal to this value.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of ghost submission entities
    /// matching the specified criteria. The list will be empty if no records are found.</returns>
    Task<List<GhostSubmissionEntity>> GetFlapWorldRecordHistoryAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless = null,
        short? minVehicleId = null,
        short? maxVehicleId = null);

    /// <summary>
    /// Asynchronously retrieves the fastest lap time for a specified track and configuration.
    /// </summary>
    /// <remarks>If multiple laps match the criteria, the lap with the lowest time is returned. This method
    /// does not modify any data and is thread-safe.</remarks>
    /// <param name="trackId">The unique identifier of the track for which to retrieve the fastest lap time.</param>
    /// <param name="cc">The engine class, in cubic centimeters, used for the lap. Must be a valid value supported by the track.</param>
    /// <param name="glitchAllowed">Indicates whether laps using glitches are considered. Set to <see langword="true"/> to include glitch laps;
    /// otherwise, only standard laps are considered.</param>
    /// <param name="shroomless">Specifies whether only shroomless laps should be considered. If <see langword="true"/>, only laps without
    /// mushrooms are included; if <see langword="false"/>, only laps with mushrooms are included; if <see
    /// langword="null"/>, both types are considered.</param>
    /// <param name="minVehicleId">The minimum vehicle identifier to filter laps. If <see langword="null"/>, no lower bound is applied.</param>
    /// <param name="maxVehicleId">The maximum vehicle identifier to filter laps. If <see langword="null"/>, no upper bound is applied.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the fastest lap time in
    /// milliseconds, or <see langword="null"/> if no valid lap is found.</returns>
    Task<int?> GetFastestLapForTrackAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless = null,
        short? minVehicleId = null,
        short? maxVehicleId = null);

    /// <summary>
    /// Retrieves a paged list of ghost submissions for a specified player, optionally filtered by track, engine class,
    /// glitch usage, shroomless status, and vehicle ID range.
    /// </summary>
    /// <remarks>Filtering parameters are optional; omitting them returns submissions without those filters
    /// applied. The returned collection may be empty if no submissions match the criteria.</remarks>
    /// <param name="ttProfileId">The unique identifier of the player's profile for which submissions are retrieved.</param>
    /// <param name="page">The zero-based page index of results to return. Must be greater than or equal to 0.</param>
    /// <param name="pageSize">The maximum number of submissions to include in each page. Must be greater than 0.</param>
    /// <param name="trackId">The identifier of the track to filter submissions by. If null, submissions from all tracks are included.</param>
    /// <param name="cc">The engine class to filter submissions by. If null, submissions from all engine classes are included.</param>
    /// <param name="glitch">Indicates whether to filter submissions by glitch usage. If null, both glitched and non-glitched submissions are
    /// included.</param>
    /// <param name="shroomless">Indicates whether to filter submissions by shroomless status. If null, both shroomless and non-shroomless
    /// submissions are included.</param>
    /// <param name="minVehicleId">The minimum vehicle identifier to filter submissions by. If null, no lower bound is applied.</param>
    /// <param name="maxVehicleId">The maximum vehicle identifier to filter submissions by. If null, no upper bound is applied.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a paged collection of ghost
    /// submissions matching the specified filters.</returns>
    Task<PagedResult<GhostSubmissionEntity>> GetPlayerSubmissionsAsync(
        int ttProfileId,
        int page,
        int pageSize,
        int? trackId = null,
        short? cc = null,
        bool? glitch = null,
        bool? shroomless = null,
        short? minVehicleId = null,
        short? maxVehicleId = null);

    /// <summary>
    /// Asynchronously retrieves the total number of submissions available.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result contains the total count of submissions as an
    /// integer.</returns>
    Task<int> GetTotalSubmissionsCountAsync();

    /// <summary>
    /// Asynchronously retrieves the total number of submissions associated with the specified profile.
    /// </summary>
    /// <param name="ttProfileId">The unique identifier of the profile for which to count submissions. Must be a positive integer.</param>
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
    /// double. Returns 0 if no finish positions are available.</returns>
    Task<double> CalculateAverageFinishPositionAsync(int ttProfileId);

    /// <summary>
    /// Asynchronously counts the number of top 10 finishes for the specified profile.
    /// </summary>
    /// <param name="ttProfileId">The unique identifier of the profile for which to count top 10 finishes. Must be a valid profile ID.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the number of top 10 finishes for
    /// the specified profile.</returns>
    Task<int> CountTop10FinishesAsync(int ttProfileId);

    /// <summary>
    /// Asynchronously counts the number of distinct tracks associated with the specified profile and code.
    /// </summary>
    /// <param name="ttProfileId">The identifier of the profile for which to count distinct tracks. Must be a valid profile ID.</param>
    /// <param name="cc">The cc used to filter tracks. The value must be within the valid range for track ccs. Can be optionally null.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the number of distinct tracks found
    /// for the given profile and code.</returns>
    Task<int> CountDistinctTracksAsync(int ttProfileId, short? cc = null);

    /// <summary>
    /// Updates the counts of world records asynchronously.
    /// </summary>
    /// <remarks>Call this method to refresh world record counts. The operation completes when all counts have
    /// been updated.</remarks>
    /// <returns>A task that represents the asynchronous update operation.</returns>
    Task UpdateWorldRecordCountsAsync();

    /// <summary> 
    /// Retrieves the best known ghost submission time for a specified track and set of filtering criteria for the Discord bot.
    /// </summary>
    /// <param name="trackId">The identifier of the track for which to retrieve the best known time.</param>
    /// <param name="cc">The engine class to filter results by, which is either 150 or 200.</param>
    /// <param name="nonGlitchOnly">Specifies whether to include only non-glitch submissions. Set to <see langword="true"/> to exclude glitch runs;
    /// otherwise, include all.</param>
    /// <param name="shroomless">Indicates whether to filter for shroomless runs. If <see langword="true"/>, only shroomless submissions are
    /// considered; if <see langword="false"/>, only runs with mushrooms are considered; if <see langword="null"/>, both
    /// types are included.</param>
    /// <param name="minVehicleId">The minimum vehicle identifier to filter submissions. If <see langword="null"/>, no lower bound is applied.</param>
    /// <param name="maxVehicleId">The maximum vehicle identifier to filter submissions. If <see langword="null"/>, no upper bound is applied.</param>
    /// <param name="driftType">The drift type to filter submissions by. If <see langword="null"/>, all drift types are included.</param>
    /// <param name="driftCategory">The drift category to filter submissions by. If <see langword="null"/>, all drift categories are included.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the best known ghost submission
    /// entity matching the specified criteria, or <see langword="null"/> if no matching submission is found.</returns>
    Task<GhostSubmissionEntity?> GetBestKnownTimeAsync(
        int trackId,
        short cc,
        bool nonGlitchOnly,
        bool? shroomless = null,
        short? minVehicleId = null,
        short? maxVehicleId = null,
        short? driftType = null,
        short? driftCategory = null);
}
