using RetroRewindWebsite.Models.DTOs.TimeTrial;

namespace RetroRewindWebsite.Services.Application;

public interface ITimeTrialService
{
    // ===== TRACKS =====

    /// <summary>
    /// Returns all tracks ordered by sort order.
    /// </summary>
    Task<List<TrackDto>> GetAllTracksAsync();

    /// <summary>
    /// Returns the track with the given ID, or <see langword="null"/> if not found.
    /// </summary>
    Task<TrackDto?> GetTrackAsync(int id);

    // ===== LEADERBOARDS =====

    /// <summary>
    /// Returns the paged race leaderboard for a track/category combination, including the fastest
    /// lap across all submissions in that category. Returns <see langword="null"/> if the track
    /// does not exist.
    /// </summary>
    Task<TrackLeaderboardDto?> GetLeaderboardAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        string? vehicle,
        short? vehicleMin,
        short? vehicleMax,
        int page,
        int pageSize);

    /// <summary>
    /// Returns the paged flap leaderboard for a track/category combination.
    /// Returns <see langword="null"/> if the track does not exist.
    /// </summary>
    Task<TrackLeaderboardDto?> GetFlapLeaderboardAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        string? vehicle,
        short? vehicleMin,
        short? vehicleMax,
        int page,
        int pageSize);

    /// <summary>
    /// Returns the top N times for a track/category combination.
    /// </summary>
    Task<List<GhostSubmissionDto>> GetTopTimesAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? vehicleMin,
        short? vehicleMax,
        int count);

    // ===== WORLD RECORDS =====

    /// <summary>
    /// Returns the current world record for a track/category combination, or
    /// <see langword="null"/> if no times exist.
    /// </summary>
    Task<GhostSubmissionDto?> GetWorldRecordAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? vehicleMin,
        short? vehicleMax);

    /// <summary>
    /// Returns the full WR progression history for a track/category combination.
    /// </summary>
    Task<List<GhostSubmissionDto>> GetWorldRecordHistoryAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? vehicleMin,
        short? vehicleMax);

    /// <summary>
    /// Returns the flap WR progression history for a track/category combination.
    /// </summary>
    Task<List<GhostSubmissionDto>> GetFlapWorldRecordHistoryAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? vehicleMin,
        short? vehicleMax);

    /// <summary>
    /// Returns the current world record for every track in the given category. Each entry
    /// includes the track info and the WR submission (or <see langword="null"/> if no times).
    /// </summary>
    Task<List<TrackWorldRecordsDto>> GetAllWorldRecordsAsync(
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? vehicleMin,
        short? vehicleMax);

    // ===== FLAP =====

    /// <summary>
    /// Returns the fastest individual lap for a track/category combination, or
    /// <see langword="null"/> if no lap times exist.
    /// </summary>
    Task<FlapDto?> GetFastestLapAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? vehicleMin,
        short? vehicleMax);

    // ===== GHOST DOWNLOAD =====

    /// <summary>
    /// Returns the file path and suggested download filename for a ghost submission, or
    /// <see langword="null"/> if the submission does not exist or the file is missing on disk.
    /// </summary>
    Task<(string FilePath, string FileName)?> GetGhostDownloadInfoAsync(int id);

    // ===== PROFILES =====

    /// <summary>
    /// Returns the TT profile with the given ID, or <see langword="null"/> if not found.
    /// </summary>
    Task<TTProfileDto?> GetProfileAsync(int ttProfileId);

    /// <summary>
    /// Returns paged ghost submissions for a profile with optional filters, or
    /// <see langword="null"/> if the profile does not exist.
    /// </summary>
    Task<PagedSubmissionsDto?> GetProfileSubmissionsAsync(
        int ttProfileId,
        int? trackId,
        short? cc,
        bool? glitch,
        bool? shroomless,
        short? vehicleMin,
        short? vehicleMax,
        int page,
        int pageSize);

    /// <summary>
    /// Returns aggregate statistics for a TT profile, or <see langword="null"/> if not found.
    /// </summary>
    Task<TTPlayerStatsDto?> GetPlayerStatsAsync(int ttProfileId);
}
