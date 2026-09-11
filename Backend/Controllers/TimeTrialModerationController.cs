using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Filters;
using RetroRewindWebsite.Helpers;
using RetroRewindWebsite.Models.DTOs.TimeTrial;
using RetroRewindWebsite.Services.Application;

namespace RetroRewindWebsite.Controllers;

/// <summary>
/// Handles time trial moderation: ghost file submission and deletion, TT profile management,
/// submission search, and best-known-time lookups. Only used by RWFC bot.
/// All endpoints require Bearer token authentication via <see cref="Middleware.ApiKeyAuthenticationMiddleware"/>.
/// </summary>
[ApiController]
[Route("api/moderation/timetrial")]
public class TimeTrialModerationController : ControllerBase
{
    private readonly ITimeTrialModerationService _moderationService;
    private readonly ILogger<TimeTrialModerationController> _logger;

    private const int MinDisplayNameLength = 2;
    private const int MaxDisplayNameLength = 50;

    /// <summary>Smallest valid .rkg: the fixed header alone is 0x88 bytes.</summary>
    private const long MinGhostFileBytes = 0x88;

    /// <summary>
    /// Generous ceiling for a ghost. Real files are a few tens of KB; this is a sanity bound, not
    /// a tuning knob.
    /// </summary>
    private const long MaxGhostFileBytes = 512 * 1024;

    /// <summary>Whole-request cap, leaving room for the other form fields and multipart overhead.</summary>
    private const long MaxRequestBytes = MaxGhostFileBytes + (64 * 1024);

    public TimeTrialModerationController(
        ITimeTrialModerationService moderationService,
        ILogger<TimeTrialModerationController> logger)
    {
        _moderationService = moderationService;
        _logger = logger;
    }

    // ===== GHOST SUBMISSION ENDPOINTS =====

    [HttpPost("submit")]
    // Rejected by the server before the body is buffered, unlike the checks in ValidateGhostFile
    // which only run once the whole multipart payload has been read.
    [RequestSizeLimit(MaxRequestBytes)]
    [ProducesResponseType<GhostSubmissionResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<GhostSubmissionResultDto>> SubmitTimeTrialGhost(
        [FromForm] GhostSubmissionRequest request)
    {
        try
        {
            var fileValidation = ValidateGhostFile(request.GhostFile);
            if (fileValidation != null) return fileValidation;

            // Range-check before narrowing. Casting first wraps, so an int such as 65686 becomes
            // 150 and sails through validation as a legitimate cc.
            if (request.Cc is < short.MinValue or > short.MaxValue)
                return BadRequest("Invalid cc value");

            var cc = (short)request.Cc;
            var ccError = TimeTrialValidation.ValidateCc(cc);
            if (ccError != null) return BadRequest(ccError);

            var result = await _moderationService.SubmitGhostAsync(
                request.GhostFile,
                request.TrackId,
                cc,
                request.TtProfileId,
                request.Shroomless,
                request.Glitch,
                request.IsFlap);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting ghost for track {TrackId}", request.TrackId);
            return ApiExceptionFilter.ServerError();
        }
    }

    [HttpDelete("submission/{id}")]
    [ProducesResponseType<GhostDeletionResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<GhostDeletionResultDto>> DeleteGhostSubmission(int id)
    {
        var result = await _moderationService.DeleteGhostAsync(id);
        if (result == null)
            return NotFound(new GhostDeletionResultDto(false, $"Submission {id} not found"));

        return Ok(result);
    }

    [HttpGet("submissions/search")]
    [ProducesResponseType<GhostSubmissionSearchResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<GhostSubmissionSearchResultDto>> SearchGhostSubmissions(
        [FromQuery] int? ttProfileId = null,
        [FromQuery] int? trackId = null,
        [FromQuery] short? cc = null,
        [FromQuery] bool? glitch = null,
        [FromQuery] bool? shroomless = null,
        [FromQuery] bool? isFlap = null,
        [FromQuery] short? driftCategory = null,
        [FromQuery] int limit = 25)
    {
        var result = await _moderationService.SearchGhostSubmissionsAsync(
            ttProfileId, trackId, cc, glitch, shroomless, isFlap, driftCategory, limit);

        return Ok(result);
    }

    [HttpGet("bkt")]
    [ProducesResponseType<GhostSubmissionDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<GhostSubmissionDto>> GetFlexibleBKT(
        [FromQuery] int trackId,
        [FromQuery] short cc,
        [FromQuery] bool nonGlitchOnly = false,
        [FromQuery] string? shroomless = null,
        [FromQuery] string? vehicle = null,
        [FromQuery] string? drift = null,
        [FromQuery] string? driftCategory = null)
    {
        var ccError = TimeTrialValidation.ValidateCc(cc);
        if (ccError != null) return BadRequest(ccError);

        var (shroomlessFilter, minVehicleId, maxVehicleId, driftTypeFilter, driftCategoryFilter) =
            TimeTrialValidation.ParseCategoryFiltersWithDrift(shroomless, vehicle, drift, driftCategory);

        var bkt = await _moderationService.GetBestKnownTimeAsync(
            trackId, cc, nonGlitchOnly, shroomlessFilter,
            minVehicleId, maxVehicleId, driftTypeFilter, driftCategoryFilter);

        if (bkt == null)
            return NotFound("No times found matching the specified filters");

        return Ok(bkt);
    }

    // ===== TT PROFILE ENDPOINTS =====

    [HttpPost("profile/create")]
    [ProducesResponseType<ProfileCreationResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ProfileCreationResultDto>> CreateTTProfile(
        [FromBody] CreateTTProfileRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var validation = ValidateDisplayName(request.DisplayName, out var displayName);
        if (validation != null) return validation;

        var result = await _moderationService.CreateProfileAsync(displayName, request.CountryCode);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("profiles")]
    [ProducesResponseType<ProfileListResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ProfileListResultDto>> GetAllTTProfiles()
    {
        var result = await _moderationService.GetAllProfilesAsync();
        return Ok(result);
    }

    [HttpGet("profile/{id}")]
    [ProducesResponseType<ProfileViewResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ProfileViewResultDto>> GetTTProfile(int id)
    {
        var result = await _moderationService.GetProfileAsync(id);
        if (result == null)
            return NotFound(new ProfileViewResultDto(false, $"Profile {id} not found"));

        return Ok(result);
    }

    [HttpPut("profile/{id}")]
    [ProducesResponseType<ProfileUpdateResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ProfileUpdateResultDto>> UpdateTTProfile(
        int id, [FromBody] UpdateTTProfileRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        string? displayName = null;
        if (!string.IsNullOrWhiteSpace(request.DisplayName))
        {
            var validation = ValidateDisplayName(request.DisplayName, out var trimmed);
            if (validation != null) return validation;
            displayName = trimmed;
        }

        var result = await _moderationService.UpdateProfileAsync(id, displayName, request.CountryCode);
        if (result == null)
            return NotFound(new ProfileUpdateResultDto(false, $"Profile {id} not found"));

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpDelete("profile/{id}")]
    [ProducesResponseType<ProfileDeletionResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ProfileDeletionResultDto>> DeleteTTProfile(int id)
    {
        var result = await _moderationService.DeleteProfileAsync(id);
        if (result == null)
            return NotFound(new ProfileDeletionResultDto(false, $"Profile {id} not found"));

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    // ===== HELPER METHODS =====

    private BadRequestObjectResult? ValidateGhostFile(IFormFile? ghostFile)
    {
        if (ghostFile == null || ghostFile.Length == 0)
            return BadRequest("Ghost file is required");

        if (!ghostFile.FileName.EndsWith(".rkg", StringComparison.OrdinalIgnoreCase))
            return BadRequest("File must be a .rkg file");

        // A real ghost is a few tens of KB. Without this the framework's multipart default (about
        // 128MB) applied, and the upload is buffered into memory and then copied again before the
        // header is even read.
        if (ghostFile.Length < MinGhostFileBytes)
            return BadRequest("Ghost file is too small to be a valid .rkg file");

        if (ghostFile.Length > MaxGhostFileBytes)
            return BadRequest($"Ghost file must be {MaxGhostFileBytes / 1024}KB or smaller");

        return null;
    }

    private BadRequestObjectResult? ValidateDisplayName(string displayName, out string trimmed)
    {
        trimmed = displayName.Trim();

        if (trimmed.Length < MinDisplayNameLength)
            return BadRequest($"Display name must be at least {MinDisplayNameLength} characters");

        if (trimmed.Length > MaxDisplayNameLength)
            return BadRequest($"Display name must be {MaxDisplayNameLength} characters or less");

        return null;
    }
}
