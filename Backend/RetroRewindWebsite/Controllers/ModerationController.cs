using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Helpers;
using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.Domain;
using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Models.DTOs.TimeTrial;
using RetroRewindWebsite.Models.Entities.TimeTrial;
using RetroRewindWebsite.Models.External;
using RetroRewindWebsite.Repositories.Player;
using RetroRewindWebsite.Repositories.TimeTrial;
using RetroRewindWebsite.Services.Domain;

namespace RetroRewindWebsite.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ModerationController : ControllerBase
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IVRHistoryRepository _vrHistoryRepository;
    private readonly IGhostFileService _ghostFileService;
    private readonly ITrackRepository _trackRepository;
    private readonly ITTProfileRepository _ttProfileRepository;
    private readonly IGhostSubmissionRepository _ghostSubmissionRepository;
    private readonly ILogger<ModerationController> _logger;

    private const short CC_150 = 150;
    private const short CC_200 = 200;
    private const int MinDisplayNameLength = 2;
    private const int MaxDisplayNameLength = 50;

    public ModerationController(
        IPlayerRepository playerRepository,
        IVRHistoryRepository vrHistoryRepository,
        IGhostFileService ghostFileService,
        ITrackRepository trackRepository,
        ITTProfileRepository ttProfileRepository,
        IGhostSubmissionRepository ghostSubmissionRepository,
        ILogger<ModerationController> logger)
    {
        _playerRepository = playerRepository;
        _vrHistoryRepository = vrHistoryRepository;
        _ghostFileService = ghostFileService;
        _trackRepository = trackRepository;
        _ttProfileRepository = ttProfileRepository;
        _ghostSubmissionRepository = ghostSubmissionRepository;
        _logger = logger;
    }

    // ===== PLAYER MODERATION ENDPOINTS =====

    [HttpPost("flag")]
    public async Task<ActionResult<ModerationActionResultDto>> FlagPlayer([FromBody] FlagRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Pid))
                return BadRequest("Player ID (Pid) is required");

            var player = await _playerRepository.GetByPidAsync(request.Pid);
            if (player == null)
                return NotFound($"Player with PID '{request.Pid}' not found");

            if (player.IsSuspicious)
            {
                return Ok(new ModerationActionResultDto(
                    true,
                    $"Player '{player.Name}' is already flagged as suspicious. Reason: '{request.Reason}'"
                ));
            }

            player.IsSuspicious = true;
            player.FlagReason = request.Reason;
            await _playerRepository.UpdateAsync(player);

            _logger.LogWarning(
                "Player flagged: {Name} ({FriendCode}) - PID: {Pid} - Reason: {Reason}",
                player.Name, player.Fc, player.Pid, player.FlagReason);

            return Ok(new ModerationActionResultDto(
                true,
                $"Player '{player.Name}' has been flagged as suspicious, reason: '{player.FlagReason}'",
                PlayerMapper.ToDto(player)
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error flagging player with PID {Pid}", request.Pid);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while flagging the player");
        }
    }

    [HttpPost("unflag")]
    public async Task<ActionResult<ModerationActionResultDto>> UnflagPlayer([FromBody] UnflagRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Pid))
                return BadRequest("Player ID (Pid) is required");

            var player = await _playerRepository.GetByPidAsync(request.Pid);
            if (player == null)
                return NotFound($"Player with PID '{request.Pid}' not found");

            if (!player.IsSuspicious)
            {
                return Ok(new ModerationActionResultDto(
                    true,
                    $"Player '{player.Name}' is not flagged as suspicious"
                ));
            }

            player.IsSuspicious = false;
            player.SuspiciousVRJumps = 0;
            player.UnflagReason = request.Reason;
            await _playerRepository.UpdateAsync(player);

            _logger.LogInformation(
                "Player unflagged: {Name} ({FriendCode}) - PID: {Pid} - Reason: {Reason}",
                player.Name, player.Fc, player.Pid, player.UnflagReason);

            return Ok(new ModerationActionResultDto(
                true,
                $"Player '{player.Name}' has been unflagged. Reason: '{player.UnflagReason}'",
                PlayerMapper.ToDto(player)
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unflagging player with PID {Pid}", request.Pid);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while unflagging the player");
        }
    }

    [HttpPost("ban")]
    public async Task<ActionResult<ModerationActionResultDto>> BanPlayer([FromBody] BanRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Pid))
                return BadRequest("Player ID (Pid) is required");

            var player = await _playerRepository.GetByPidAsync(request.Pid);
            if (player == null)
                return NotFound($"Player with PID '{request.Pid}' not found");

            await _playerRepository.DeleteAsync(player.Id);

            _logger.LogWarning("Player banned: {Name} ({FriendCode}) - PID: {Pid}",
                player.Name, player.Fc, player.Pid);

            return Ok(new ModerationActionResultDto(
                true,
                $"Player '{player.Name}' has been banned and removed from the leaderboard",
                PlayerMapper.ToDto(player)
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error banning player with PID {Pid}", request.Pid);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while banning the player");
        }
    }

    [HttpGet("suspicious-jumps/{pid}")]
    public async Task<ActionResult<SuspiciousJumpsResultDto>> GetSuspiciousJumps(string pid)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(pid))
                return BadRequest("Player ID (Pid) is required");

            var player = await _playerRepository.GetByPidAsync(pid);
            if (player == null)
                return NotFound($"Player with PID '{pid}' not found");

            var history = await _vrHistoryRepository.GetPlayerHistoryAsync(player.Pid);
            var suspiciousJumps = history
                .Where(h => Math.Abs(h.VRChange) >= 529)
                .OrderByDescending(h => h.Date)
                .Select(h => new VRJumpDto(h.Date, h.VRChange, h.TotalVR))
                .ToList();

            _logger.LogInformation(
                "Retrieved {Count} suspicious jumps for player: {Name} ({Pid})",
                suspiciousJumps.Count, player.Name, pid);

            return Ok(new SuspiciousJumpsResultDto(
                new PlayerBasicDto(
                    player.Pid,
                    player.Name,
                    player.Fc,
                    player.IsSuspicious,
                    player.SuspiciousVRJumps,
                    player.FlagReason,
                    player.UnflagReason
                ),
                suspiciousJumps,
                suspiciousJumps.Count
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving suspicious jumps for PID {Pid}", pid);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving suspicious jumps");
        }
    }

    [HttpGet("player-stats/{pid}")]
    public async Task<ActionResult<PlayerStatsResultDto>> GetPlayerStats(string pid)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(pid))
                return BadRequest("Player ID (Pid) is required");

            var player = await _playerRepository.GetByPidAsync(pid);
            if (player == null)
                return NotFound($"Player with PID '{pid}' not found");

            _logger.LogInformation("Retrieved stats for player: {Name} ({Pid})", player.Name, pid);

            return Ok(new PlayerStatsResultDto(
                true,
                new PlayerStatsDto(
                    player.Pid,
                    player.Name,
                    player.Fc,
                    player.Ev,
                    player.Rank,
                    player.LastSeen,
                    player.IsSuspicious,
                    player.SuspiciousVRJumps,
                    new VRStatsDto(
                        player.VRGainLast24Hours,
                        player.VRGainLastWeek,
                        player.VRGainLastMonth
                    )
                )
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving stats for PID {Pid}", pid);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving player stats");
        }
    }

    // ===== GHOST SUBMISSION ENDPOINTS =====

    [HttpPost("timetrial/submit")]
    public async Task<ActionResult<GhostSubmissionResultDto>> SubmitTimeTrialGhost(
        [FromForm] GhostSubmissionRequest request)
    {
        try
        {
            var fileValidation = ValidateGhostFile(request.GhostFile);
            if (fileValidation != null) return fileValidation;

            var ccValidation = ValidateCc((short)request.Cc);
            if (ccValidation != null) return ccValidation;

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

    [HttpDelete("timetrial/submission/{id}")]
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

    // ===== TT PROFILE ENDPOINTS =====

    [HttpPost("timetrial/profile/create")]
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
                    MapToTTProfileDto(existingProfile)
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
                MapToTTProfileDto(newProfile)
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating TT profile");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while creating the profile");
        }
    }

    [HttpGet("timetrial/profiles")]
    public async Task<ActionResult<ProfileListResultDto>> GetAllTTProfiles()
    {
        try
        {
            var profiles = await _ttProfileRepository.GetAllAsync();
            var profileDtos = profiles
                .OrderBy(p => p.DisplayName)
                .Select(MapToTTProfileDto)
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

    [HttpDelete("timetrial/profile/{id}")]
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

    [HttpPut("timetrial/profile/{id}")]
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
                MapToTTProfileDto(profile)
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating TT profile {ProfileId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while updating the profile");
        }
    }

    [HttpGet("timetrial/profile/{id}")]
    public async Task<ActionResult<ProfileViewResultDto>> GetTTProfile(int id)
    {
        try
        {
            var profile = await _ttProfileRepository.GetByIdAsync(id);
            if (profile == null)
                return NotFound(new ProfileViewResultDto(false, $"Profile {id} not found"));

            return Ok(new ProfileViewResultDto(true, string.Empty, MapToTTProfileDto(profile)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving TT profile {ProfileId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving the profile");
        }
    }

    // ===== UTILITY ENDPOINTS =====

    [HttpGet("countries")]
    public ActionResult<CountryListResultDto> GetCountries()
    {
        var countries = CountryCodeHelper.GetAllCountries()
            .Select(c => new CountryDto(c.NumericCode, c.Alpha2, c.Name))
            .ToList();

        return Ok(new CountryListResultDto(true, countries.Count, countries));
    }

    [HttpGet("timetrial/submissions/search")]
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

    [HttpGet("timetrial/bkt")]
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
            var ccValidation = ValidateCc(cc);
            if (ccValidation != null) return ccValidation;

            var track = await _trackRepository.GetByIdAsync(trackId);
            if (track == null)
                return NotFound($"Track with ID {trackId} not found");

            bool? shroomlessFilter = shroomless?.ToLower() switch
            {
                "only" => true,
                "exclude" => false,
                _ => null
            };

            short? driftTypeFilter = drift?.ToLower() switch
            {
                "manual" => (short)0,
                "hybrid" => (short)1,
                _ => null
            };

            short? driftCategoryFilter = driftCategory?.ToLower() switch
            {
                "outside" => (short)0,
                "inside" => (short)1,
                _ => null
            };

            short? minVehicleId = null;
            short? maxVehicleId = null;
            if (!string.IsNullOrWhiteSpace(vehicle))
            {
                switch (vehicle.ToLower())
                {
                    case "karts": minVehicleId = 0; maxVehicleId = 17; break;
                    case "bikes": minVehicleId = 18; maxVehicleId = 35; break;
                }
            }

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

    // ===== HELPER METHODS =====

    private static TTProfileDto MapToTTProfileDto(TTProfileEntity profile) => new(
        profile.Id,
        profile.DisplayName,
        profile.TotalSubmissions,
        profile.CurrentWorldRecords,
        profile.CountryCode,
        CountryCodeHelper.GetAlpha2Code(profile.CountryCode),
        CountryCodeHelper.GetCountryName(profile.CountryCode)
    );

    private BadRequestObjectResult? ValidateGhostFile(IFormFile? ghostFile)
    {
        if (ghostFile == null || ghostFile.Length == 0)
            return BadRequest("Ghost file is required");

        if (!ghostFile.FileName.EndsWith(".rkg", StringComparison.OrdinalIgnoreCase))
            return BadRequest("File must be a .rkg file");

        return null;
    }

    private BadRequestObjectResult? ValidateCc(short cc)
    {
        if (cc != CC_150 && cc != CC_200)
            return BadRequest($"CC must be either {CC_150} or {CC_200}");

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
