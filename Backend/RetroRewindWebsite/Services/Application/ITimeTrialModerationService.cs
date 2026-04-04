using RetroRewindWebsite.Models.DTOs.TimeTrial;

namespace RetroRewindWebsite.Services.Application;

public interface ITimeTrialModerationService
{
    // ===== GHOST SUBMISSION =====

    /// <summary>
    /// Validates, parses, saves, and records a ghost file submission.
    /// Returns a failed result DTO (not an exception) for user-facing validation errors (bad track,
    /// bad profile, parse failure). Throws on unexpected infrastructure failures.
    /// </summary>
    Task<GhostSubmissionResultDto> SubmitGhostAsync(
        IFormFile ghostFile,
        int trackId,
        short cc,
        int ttProfileId,
        bool shroomless,
        bool glitch,
        bool isFlap);

    /// <summary>
    /// Deletes a ghost submission and its associated file.
    /// Returns <see langword="null"/> if the submission does not exist.
    /// </summary>
    Task<GhostDeletionResultDto?> DeleteGhostAsync(int id);

    /// <summary>
    /// Searches ghost submissions with optional filters.
    /// </summary>
    Task<GhostSubmissionSearchResultDto> SearchGhostSubmissionsAsync(
        int? ttProfileId,
        int? trackId,
        short? cc,
        bool? glitch,
        bool? shroomless,
        bool? isFlap,
        short? driftCategory,
        int limit);

    /// <summary>
    /// Returns the best known time for a track/category combination.
    /// Returns <see langword="null"/> if the track does not exist or no matching time is found.
    /// </summary>
    Task<GhostSubmissionDetailDto?> GetBestKnownTimeAsync(
        int trackId,
        short cc,
        bool nonGlitchOnly,
        bool? shroomless,
        short? vehicleMin,
        short? vehicleMax,
        short? driftType,
        short? driftCategory);

    // ===== TT PROFILE MANAGEMENT =====

    /// <summary>
    /// Creates a new TT profile. Returns a failed result DTO if a profile with the same name already exists.
    /// </summary>
    Task<ProfileCreationResultDto> CreateProfileAsync(string displayName, int? countryCode);

    /// <summary>Returns all TT profiles ordered by display name.</summary>
    Task<ProfileListResultDto> GetAllProfilesAsync();

    /// <summary>
    /// Returns a TT profile by ID.
    /// Returns <see langword="null"/> if not found.
    /// </summary>
    Task<ProfileViewResultDto?> GetProfileAsync(int id);

    /// <summary>
    /// Updates a TT profile's display name and/or country code.
    /// Returns <see langword="null"/> if not found.
    /// Returns a failed result DTO if the new display name is already taken.
    /// </summary>
    Task<ProfileUpdateResultDto?> UpdateProfileAsync(int id, string? displayName, int? countryCode);

    /// <summary>
    /// Deletes a TT profile.
    /// Returns <see langword="null"/> if not found.
    /// Returns a failed result DTO if the profile still has submissions.
    /// </summary>
    Task<ProfileDeletionResultDto?> DeleteProfileAsync(int id);
}
