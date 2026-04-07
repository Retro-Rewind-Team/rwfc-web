using Microsoft.AspNetCore.Mvc;
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

    public TimeTrialModerationController(
        ITimeTrialModerationService moderationService,
        ILogger<TimeTrialModerationController> logger)
    {
        _moderationService = moderationService;
        _logger = logger;
    }

    // ===== GHOST SUBMISSION ENDPOINTS =====

    [HttpPost("submit")]
    [ProducesResponseType<GhostSubmissionResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<GhostSubmissionResultDto>> SubmitTimeTrialGhost(
        [FromForm] GhostSubmissionRequest request)
    {
        try
        {
            var fileValidation = ValidateGhostFile(request.GhostFile);
            if (fileValidation != null) return fileValidation;

            var ccError = TimeTrialValidation.ValidateCc((short)request.Cc);
            if (ccError != null) return BadRequest(ccError);

            var result = await _moderationService.SubmitGhostAsync(
                request.GhostFile,
                request.TrackId,
                (short)request.Cc,
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
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while submitting the ghost");
        }
    }

    [HttpDelete("submission/{id}")]
    [ProducesResponseType<GhostDeletionResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<GhostDeletionResultDto>> DeleteGhostSubmission(int id)
    {
        try
        {
            var result = await _moderationService.DeleteGhostAsync(id);
            if (result == null)
                return NotFound(new GhostDeletionResultDto(false, $"Submission {id} not found"));

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting ghost submission {SubmissionId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while deleting the ghost submission");
        }
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
        try
        {
            var result = await _moderationService.SearchGhostSubmissionsAsync(
                ttProfileId, trackId, cc, glitch, shroomless, isFlap, driftCategory, limit);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching ghost submissions");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while searching submissions");
        }
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
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving BKT for track {TrackId} {CC}cc", trackId, cc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving the best known time");
        }
    }

    // ===== TT PROFILE ENDPOINTS =====

    [HttpPost("profile/create")]
    [ProducesResponseType<ProfileCreationResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ProfileCreationResultDto>> CreateTTProfile(
        [FromBody] CreateTTProfileRequest request)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating TT profile");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while creating the profile");
        }
    }

    [HttpGet("profiles")]
    [ProducesResponseType<ProfileListResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ProfileListResultDto>> GetAllTTProfiles()
    {
        try
        {
            var result = await _moderationService.GetAllProfilesAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving TT profiles");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving profiles");
        }
    }

    [HttpGet("profile/{id}")]
    [ProducesResponseType<ProfileViewResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ProfileViewResultDto>> GetTTProfile(int id)
    {
        try
        {
            var result = await _moderationService.GetProfileAsync(id);
            if (result == null)
                return NotFound(new ProfileViewResultDto(false, $"Profile {id} not found"));

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving TT profile {ProfileId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving the profile");
        }
    }

    [HttpPut("profile/{id}")]
    [ProducesResponseType<ProfileUpdateResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ProfileUpdateResultDto>> UpdateTTProfile(
        int id, [FromBody] UpdateTTProfileRequest request)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating TT profile {ProfileId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while updating the profile");
        }
    }

    [HttpDelete("profile/{id}")]
    [ProducesResponseType<ProfileDeletionResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ProfileDeletionResultDto>> DeleteTTProfile(int id)
    {
        try
        {
            var result = await _moderationService.DeleteProfileAsync(id);
            if (result == null)
                return NotFound(new ProfileDeletionResultDto(false, $"Profile {id} not found"));

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting TT profile {ProfileId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while deleting the profile");
        }
    }

    // ===== HELPER METHODS =====

    private BadRequestObjectResult? ValidateGhostFile(IFormFile? ghostFile)
    {
        if (ghostFile == null || ghostFile.Length == 0)
            return BadRequest("Ghost file is required");

        if (!ghostFile.FileName.EndsWith(".rkg", StringComparison.OrdinalIgnoreCase))
            return BadRequest("File must be a .rkg file");

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
