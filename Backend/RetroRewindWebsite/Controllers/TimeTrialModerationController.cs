using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Helpers;
using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.Domain;
using RetroRewindWebsite.Models.DTOs.TimeTrial;
using RetroRewindWebsite.Models.Entities.TimeTrial;
using RetroRewindWebsite.Repositories.TimeTrial;
using RetroRewindWebsite.Services.Domain;

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
    private readonly IGhostFileService _ghostFileService;
    private readonly ITrackRepository _trackRepository;
    private readonly ITTProfileRepository _ttProfileRepository;
    private readonly IGhostSubmissionRepository _ghostSubmissionRepository;
    private readonly ILogger<TimeTrialModerationController> _logger;

    private const int MinDisplayNameLength = 2;
    private const int MaxDisplayNameLength = 50;

    public TimeTrialModerationController(
        IGhostFileService ghostFileService,
        ITrackRepository trackRepository,
        ITTProfileRepository ttProfileRepository,
        IGhostSubmissionRepository ghostSubmissionRepository,
        ILogger<TimeTrialModerationController> logger)
    {
        _ghostFileService = ghostFileService;
        _trackRepository = trackRepository;
        _ttProfileRepository = ttProfileRepository;
        _ghostSubmissionRepository = ghostSubmissionRepository;
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

            var track = await _trackRepository.GetByIdAsync(request.TrackId);
            if (track == null)
                return BadRequest($"Track ID {request.TrackId} not found");

            if (request.Glitch && !track.SupportsGlitch)
                return BadRequest($"Glitch/shortcut runs are not allowed for {track.Name}");

            var ttProfile = await _ttProfileRepository.GetByIdAsync(request.TtProfileId);
            if (ttProfile == null)
                return BadRequest($"TT Profile with ID {request.TtProfileId} not found. Create the profile first.");

            GhostFileParseResult parseResult;
            using (var memoryStream = new MemoryStream())
            {
                await request.GhostFile.CopyToAsync(memoryStream);
                memoryStream.Position = 0;
                parseResult = await _ghostFileService.ParseGhostFileAsync(memoryStream);
            }

            if (parseResult is not GhostFileParseResult.Success ghostData)
                return BadRequest(((GhostFileParseResult.Failure)parseResult).ErrorMessage);

            string ghostFilePath;
            using (var fileStream = request.GhostFile.OpenReadStream())
            {
                ghostFilePath = await _ghostFileService.SaveGhostFileAsync(
                    fileStream, request.TrackId, (short)request.Cc, ttProfile.DisplayName);
            }

            var submission = new GhostSubmissionEntity
            {
                TrackId = request.TrackId,
                TTProfileId = ttProfile.Id,
                CC = (short)request.Cc,
                FinishTimeMs = ghostData.FinishTimeMs,
                FinishTimeDisplay = ghostData.FinishTimeDisplay,
                VehicleId = ghostData.VehicleId,
                CharacterId = ghostData.CharacterId,
                ControllerType = ghostData.ControllerType,
                DriftType = ghostData.DriftType,
                DriftCategory = ghostData.DriftCategory,
                MiiName = ghostData.MiiName,
                LapCount = ghostData.LapCount,
                LapSplitsMs = ghostData.LapSplitsMs,
                GhostFilePath = ghostFilePath,
                DateSet = ghostData.DateSet,
                SubmittedAt = DateTime.UtcNow,
                Shroomless = request.Shroomless,
                Glitch = request.Glitch,
                IsFlap = request.IsFlap
            };

            await _ghostSubmissionRepository.AddAsync(submission);

            ttProfile.TotalSubmissions =
                await _ghostSubmissionRepository.GetProfileSubmissionsCountAsync(ttProfile.Id);
            await _ttProfileRepository.UpdateAsync(ttProfile);
            await _ghostSubmissionRepository.UpdateWorldRecordCountsAsync();

            _logger.LogInformation(
                "Ghost submitted: Track {TrackId}, Player {PlayerName} (ID: {ProfileId}), Time {Time}ms, DriftCategory {DriftCategory}",
                request.TrackId, ttProfile.DisplayName, ttProfile.Id,
                ghostData.FinishTimeMs, ghostData.DriftCategory);

            return Ok(new GhostSubmissionResultDto(
                true,
                "Ghost submitted successfully",
                GhostSubmissionMapper.ToDto(submission)
            ));
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
            var submission = await _ghostSubmissionRepository.GetByIdAsync(id);
            if (submission == null)
                return NotFound(new GhostDeletionResultDto(false, $"Submission {id} not found"));

            if (System.IO.File.Exists(submission.GhostFilePath))
            {
                try { System.IO.File.Delete(submission.GhostFilePath); }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete ghost file: {FilePath}",
                        submission.GhostFilePath);
                }
            }

            await _ghostSubmissionRepository.DeleteAsync(submission.Id);

            var ttProfile = await _ttProfileRepository.GetByIdAsync(submission.TTProfileId);
            if (ttProfile != null)
            {
                ttProfile.TotalSubmissions =
                    await _ghostSubmissionRepository.GetProfileSubmissionsCountAsync(ttProfile.Id);
                await _ttProfileRepository.UpdateAsync(ttProfile);
            }
            else
            {
                _logger.LogWarning(
                    "TT Profile {ProfileId} not found when deleting submission {SubmissionId}",
                    submission.TTProfileId, id);
            }

            await _ghostSubmissionRepository.UpdateWorldRecordCountsAsync();

            _logger.LogInformation("Ghost submission {SubmissionId} deleted", id);

            return Ok(new GhostDeletionResultDto(true, "Ghost submission deleted successfully"));
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
            limit = Math.Clamp(limit, 1, 100);

            var submissions = await _ghostSubmissionRepository.SearchAsync(
                ttProfileId, trackId, cc, glitch, shroomless, isFlap, driftCategory, limit);

            var submissionDtos = submissions.Select(s => GhostSubmissionMapper.ToDto(s)).ToList();

            return Ok(new GhostSubmissionSearchResultDto(true, submissionDtos.Count, submissionDtos));
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

            var track = await _trackRepository.GetByIdAsync(trackId);
            if (track == null)
                return NotFound($"Track with ID {trackId} not found");

            var (shroomlessFilter, minVehicleId, maxVehicleId, driftTypeFilter, driftCategoryFilter) =
                TimeTrialValidation.ParseCategoryFiltersWithDrift(shroomless, vehicle, drift, driftCategory);

            bool glitchFilter = nonGlitchOnly || !track.SupportsGlitch;

            var bkt = await _ghostSubmissionRepository.GetBestKnownTimeAsync(
                trackId, cc, glitchFilter, shroomlessFilter,
                minVehicleId, maxVehicleId, driftTypeFilter, driftCategoryFilter);

            if (bkt == null)
                return NotFound("No times found matching the specified filters");

            return Ok(GhostSubmissionMapper.ToDto(bkt));
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

            var existingProfile = await _ttProfileRepository.GetByNameAsync(displayName);
            if (existingProfile != null)
            {
                return BadRequest(new ProfileCreationResultDto(
                    false,
                    $"Profile with name '{displayName}' already exists",
                    TTProfileMapper.ToDto(existingProfile)
                ));
            }

            var newProfile = new TTProfileEntity
            {
                DisplayName = displayName,
                TotalSubmissions = 0,
                CurrentWorldRecords = 0,
                CountryCode = request.CountryCode ?? 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _ttProfileRepository.AddAsync(newProfile);

            _logger.LogInformation("TT Profile created: {DisplayName} (ID: {ProfileId})",
                newProfile.DisplayName, newProfile.Id);

            return Ok(new ProfileCreationResultDto(
                true,
                "TT Profile created successfully",
                TTProfileMapper.ToDto(newProfile)
            ));
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
            var profiles = await _ttProfileRepository.GetAllAsync();
            var profileDtos = profiles
                .OrderBy(p => p.DisplayName)
                .Select(TTProfileMapper.ToDto)
                .ToList();

            return Ok(new ProfileListResultDto(true, profileDtos.Count, profileDtos));
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
            var profile = await _ttProfileRepository.GetByIdAsync(id);
            if (profile == null)
                return NotFound(new ProfileViewResultDto(false, $"Profile {id} not found"));

            return Ok(new ProfileViewResultDto(true, string.Empty, TTProfileMapper.ToDto(profile)));
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

            var profile = await _ttProfileRepository.GetByIdAsync(id);
            if (profile == null)
                return NotFound(new ProfileUpdateResultDto(false, $"Profile {id} not found"));

            if (!string.IsNullOrWhiteSpace(request.DisplayName))
            {
                var validation = ValidateDisplayName(request.DisplayName, out var displayName);
                if (validation != null) return validation;

                var existingProfile = await _ttProfileRepository.GetByNameAsync(displayName);
                if (existingProfile != null && existingProfile.Id != id)
                {
                    return BadRequest(new ProfileUpdateResultDto(
                        false,
                        $"Profile with name '{displayName}' already exists"
                    ));
                }

                profile.DisplayName = displayName;
            }

            if (request.CountryCode.HasValue)
                profile.CountryCode = request.CountryCode.Value;

            await _ttProfileRepository.UpdateAsync(profile);

            _logger.LogInformation("TT Profile updated: {DisplayName} (ID: {ProfileId})",
                profile.DisplayName, id);

            return Ok(new ProfileUpdateResultDto(
                true,
                "Profile updated successfully",
                TTProfileMapper.ToDto(profile)
            ));
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
            var profile = await _ttProfileRepository.GetByIdAsync(id);
            if (profile == null)
                return NotFound(new ProfileDeletionResultDto(false, $"Profile {id} not found"));

            var submissionCount =
                await _ghostSubmissionRepository.GetProfileSubmissionsCountAsync(id);
            if (submissionCount > 0)
            {
                return BadRequest(new ProfileDeletionResultDto(
                    false,
                    $"Cannot delete profile '{profile.DisplayName}' - it has {submissionCount} submission(s). Delete submissions first."
                ));
            }

            await _ttProfileRepository.DeleteAsync(id);

            _logger.LogInformation("TT Profile deleted: {DisplayName} (ID: {ProfileId})",
                profile.DisplayName, id);

            return Ok(new ProfileDeletionResultDto(
                true,
                $"Profile '{profile.DisplayName}' deleted successfully"
            ));
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
