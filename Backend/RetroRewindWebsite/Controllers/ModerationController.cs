using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Helpers;
using RetroRewindWebsite.Models.DTOs;
using RetroRewindWebsite.Models.Entities;
using RetroRewindWebsite.Models.External;
using RetroRewindWebsite.Repositories;
using RetroRewindWebsite.Services.Domain;

namespace RetroRewindWebsite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ModerationController : ControllerBase
    {
        private readonly IPlayerRepository _playerRepository;
        private readonly IVRHistoryRepository _vrHistoryRepository;
        private readonly IGhostFileService _ghostFileService;
        private readonly ITimeTrialRepository _timeTrialRepository;
        private readonly ILogger<ModerationController> _logger;

        public ModerationController(
            IPlayerRepository playerRepository,
            IVRHistoryRepository vrHistoryRepository,
            IGhostFileService ghostFileService,
            ITimeTrialRepository timeTrialRepository,
            ILogger<ModerationController> logger)
        {
            _playerRepository = playerRepository;
            _vrHistoryRepository = vrHistoryRepository;
            _ghostFileService = ghostFileService;
            _timeTrialRepository = timeTrialRepository;
            _logger = logger;
        }

        // ===== FLAG OPERATIONS =====

        [HttpPost("flag")]
        public async Task<ActionResult> FlagPlayer([FromBody] FlagRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Pid))
                {
                    return BadRequest("Player ID (Pid) is required");
                }

                var player = await _playerRepository.GetByPidAsync(request.Pid);
                if (player == null)
                {
                    return NotFound($"Player with PID '{request.Pid}' not found");
                }

                if (player.IsSuspicious)
                {
                    return Ok(new { message = $"Player '{player.Name}' is already flagged as suspicious" });
                }

                player.IsSuspicious = true;
                await _playerRepository.UpdateAsync(player);

                _logger.LogWarning(
                    "Player manually flagged as suspicious: {Name} ({FriendCode}) - PID: {Pid} by moderation",
                    player.Name, player.Fc, player.Pid);

                return Ok(new
                {
                    message = $"Player '{player.Name}' has been flagged as suspicious",
                    player = new
                    {
                        player.Pid,
                        player.Name,
                        player.Fc,
                        player.Ev,
                        player.IsSuspicious
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error flagging player with PID {Pid}", request.Pid);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while flagging the player");
            }
        }

        [HttpPost("unflag")]
        public async Task<ActionResult> UnflagPlayer([FromBody] UnflagRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Pid))
                {
                    return BadRequest("Player ID (Pid) is required");
                }

                var player = await _playerRepository.GetByPidAsync(request.Pid);
                if (player == null)
                {
                    return NotFound($"Player with PID '{request.Pid}' not found");
                }

                if (!player.IsSuspicious)
                {
                    return Ok(new { message = $"Player '{player.Name}' is not flagged as suspicious" });
                }

                player.IsSuspicious = false;
                player.SuspiciousVRJumps = 0;
                await _playerRepository.UpdateAsync(player);

                _logger.LogInformation(
                    "Player unflagged: {Name} ({FriendCode}) - PID: {Pid} by moderation",
                    player.Name, player.Fc, player.Pid);

                return Ok(new
                {
                    message = $"Player '{player.Name}' has been unflagged",
                    player = new
                    {
                        player.Pid,
                        player.Name,
                        player.Fc,
                        player.Ev,
                        player.IsSuspicious,
                        player.SuspiciousVRJumps
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unflagging player with PID {Pid}", request.Pid);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while unflagging the player");
            }
        }

        // ===== BAN OPERATIONS =====

        [HttpPost("ban")]
        public async Task<ActionResult> BanPlayer([FromBody] BanRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Pid))
                {
                    return BadRequest("Player ID (Pid) is required");
                }

                var player = await _playerRepository.GetByPidAsync(request.Pid);
                if (player == null)
                {
                    return NotFound($"Player with PID '{request.Pid}' not found");
                }

                await _playerRepository.DeleteAsync(player.Id);

                _logger.LogWarning(
                    "Player banned and removed: {Name} ({FriendCode}) - PID: {Pid} by moderation",
                    player.Name, player.Fc, player.Pid);

                return Ok(new
                {
                    message = $"Player '{player.Name}' has been banned and removed from the leaderboard",
                    player = new
                    {
                        player.Pid,
                        player.Name,
                        player.Fc
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error banning player with PID {Pid}", request.Pid);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while banning the player");
            }
        }

        // ===== QUERY OPERATIONS =====

        [HttpGet("suspicious")]
        public async Task<ActionResult<List<PlayerDto>>> GetSuspiciousPlayers()
        {
            try
            {
                var players = await _playerRepository.GetAllAsync();
                var suspiciousPlayers = players
                    .Where(p => p.IsSuspicious)
                    .OrderByDescending(p => p.Ev)
                    .Select(p => new PlayerDto
                    {
                        Pid = p.Pid,
                        Name = p.Name,
                        FriendCode = p.Fc,
                        VR = p.Ev,
                        Rank = p.Rank,
                        LastSeen = p.LastSeen,
                        IsSuspicious = p.IsSuspicious,
                        VRStats = new VRStatsDto
                        {
                            Last24Hours = p.VRGainLast24Hours,
                            LastWeek = p.VRGainLastWeek,
                            LastMonth = p.VRGainLastMonth
                        },
                        MiiImageBase64 = p.MiiImageBase64,
                        MiiData = p.MiiData
                    })
                    .ToList();

                return Ok(suspiciousPlayers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving suspicious players");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving suspicious players");
            }
        }

        [HttpPost("timetrial/submit")]
        public async Task<IActionResult> SubmitTimeTrialGhost(
            IFormFile ghostFile,
            int trackId,
            int cc,
            int ttProfileId,
            bool shroomless = false,
            bool glitch = false)
        {
            try
            {
                if (ghostFile == null || ghostFile.Length == 0)
                {
                    return BadRequest(new GhostSubmissionResponse
                    {
                        Success = false,
                        Message = "Ghost file is required"
                    });
                }

                if (!ghostFile.FileName.EndsWith(".rkg", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new GhostSubmissionResponse
                    {
                        Success = false,
                        Message = "File must be a .rkg file"
                    });
                }

                if (cc != 150 && cc != 200)
                {
                    return BadRequest(new GhostSubmissionResponse
                    {
                        Success = false,
                        Message = "CC must be either 150 or 200"
                    });
                }

                var track = await _timeTrialRepository.GetTrackByIdAsync(trackId);
                if (track == null)
                {
                    return BadRequest(new GhostSubmissionResponse
                    {
                        Success = false,
                        Message = $"Track ID {trackId} not found"
                    });
                }

                if (track.Category.Equals("retro", StringComparison.OrdinalIgnoreCase) && glitch)
                {
                    return BadRequest(new GhostSubmissionResponse
                    {
                        Success = false,
                        Message = "Glitch runs are not allowed for Retro Tracks"
                    });
                }

                // Get TT Profile - must already exist
                var ttProfile = await _timeTrialRepository.GetTTProfileByIdAsync(ttProfileId);
                if (ttProfile == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = $"TT Profile with ID {ttProfileId} not found. Create the profile first."
                    });
                }

                // Parse ghost file
                GhostFileParseResult ghostData;
                using (var memoryStream = new MemoryStream())
                {
                    await ghostFile.CopyToAsync(memoryStream);
                    memoryStream.Position = 0;
                    ghostData = await _ghostFileService.ParseGhostFileAsync(memoryStream);
                }

                if (!ghostData.Success)
                {
                    return BadRequest(new GhostSubmissionResponse
                    {
                        Success = false,
                        Message = ghostData.ErrorMessage
                    });
                }

                // Validate track slot matches
                var rkgTrackSlotName = MarioKartMappings.GetTrackSlotName(ghostData.CourseId);
                if (rkgTrackSlotName == null)
                {
                    return BadRequest(new GhostSubmissionResponse
                    {
                        Success = false,
                        Message = $"Invalid course ID in ghost file: {ghostData.CourseId}"
                    });
                }

                if (rkgTrackSlotName != track.TrackSlot)
                {
                    _logger.LogWarning(
                        "Track slot mismatch: Ghost has {GhostSlot} but track {TrackName} uses {TrackSlot}",
                        rkgTrackSlotName, track.Name, track.TrackSlot);

                    return BadRequest(new GhostSubmissionResponse
                    {
                        Success = false,
                        Message = $"Track slot mismatch: This ghost uses the track slot of '{rkgTrackSlotName}' but you submitted it for '{track.Name}' which uses '{track.TrackSlot}'"
                    });
                }

                // Save ghost file using profile display name
                string ghostFilePath;
                using (var fileStream = ghostFile.OpenReadStream())
                {
                    ghostFilePath = await _ghostFileService.SaveGhostFileAsync(
                        fileStream,
                        trackId,
                        (short)cc,
                        ttProfile.DisplayName);
                }

                var submission = new GhostSubmissionEntity
                {
                    TrackId = trackId,
                    TTProfileId = ttProfile.Id,
                    CC = (short)cc,
                    FinishTimeMs = ghostData.FinishTimeMs,
                    FinishTimeDisplay = ghostData.FinishTimeDisplay,
                    VehicleId = ghostData.VehicleId,
                    CharacterId = ghostData.CharacterId,
                    ControllerType = ghostData.ControllerType,
                    DriftType = ghostData.DriftType,
                    MiiName = ghostData.MiiName,
                    LapCount = ghostData.LapCount,
                    LapSplitsMs = System.Text.Json.JsonSerializer.Serialize(ghostData.LapSplitsMs),
                    GhostFilePath = ghostFilePath,
                    DateSet = ghostData.DateSet,
                    SubmittedAt = DateTime.UtcNow,
                    Shroomless = shroomless,
                    Glitch = !track.Category.Equals("retro", StringComparison.OrdinalIgnoreCase) && glitch
                };

                await _timeTrialRepository.AddGhostSubmissionAsync(submission);

                // Update profile stats
                int totalSubmissions = await _timeTrialRepository.GetProfileSubmissionsCountAsync(ttProfile.Id);
                if (totalSubmissions > 0)
                    {
                    ttProfile.TotalSubmissions = totalSubmissions;
                }
                else
                {
                    ttProfile.TotalSubmissions = 1;
                }

                await _timeTrialRepository.UpdateTTProfileAsync(ttProfile);

                _logger.LogInformation(
                    "Ghost submitted successfully: Track {TrackId}, Player {PlayerName} (ID: {ProfileId}), Time {Time}ms",
                    trackId, ttProfile.DisplayName, ttProfile.Id, ghostData.FinishTimeMs);

                return Ok(new
                {
                    success = true,
                    message = "Ghost submitted successfully",
                    submission = new
                    {
                        id = submission.Id,
                        trackId = submission.TrackId,
                        trackName = track.Name,
                        ttProfileId = submission.TTProfileId,
                        playerName = ttProfile.DisplayName,
                        cc = submission.CC,
                        finishTimeMs = submission.FinishTimeMs,
                        finishTimeDisplay = submission.FinishTimeDisplay,

                        // Raw IDs
                        vehicleId = submission.VehicleId,
                        characterId = submission.CharacterId,
                        controllerType = submission.ControllerType,
                        driftType = submission.DriftType,
                        trackSlot = ghostData.CourseId,

                        // Human-readable names
                        vehicleName = MarioKartMappings.GetVehicleName(submission.VehicleId),
                        characterName = MarioKartMappings.GetCharacterName(submission.CharacterId),
                        controllerName = MarioKartMappings.GetControllerName(submission.ControllerType),
                        driftTypeName = MarioKartMappings.GetDriftTypeName(submission.DriftType),
                        trackSlotName = MarioKartMappings.GetTrackSlotName(ghostData.CourseId),

                        miiName = submission.MiiName,
                        lapCount = submission.LapCount,
                        lapSplitsMs = ghostData.LapSplitsMs, 
                        ghostFilePath = submission.GhostFilePath,
                        dateSet = submission.DateSet,
                        submittedAt = submission.SubmittedAt,
                        shroomless = submission.Shroomless,
                        glitch = submission.Glitch
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting ghost for track {TrackId}", trackId);
                return StatusCode(500, new { error = "An error occurred while submitting the ghost" });
            }
        }

        [HttpDelete("timetrial/submission/{id}")]
        public async Task<IActionResult> DeleteGhostSubmission(int id)
        {
            try
            {
                var submission = await _timeTrialRepository.GetGhostSubmissionByIdAsync(id);
                if (submission == null)
                    return NotFound(new { error = $"Submission {id} not found" });

                // Update profile stats
                var ttProfile = await _timeTrialRepository.GetTTProfileByIdAsync(submission.TTProfileId);
                if (ttProfile == null)
                    {
                    _logger.LogWarning("TT Profile {ProfileId} not found when deleting submission {SubmissionId}",
                        submission.TTProfileId, id);
                }
                else
                {
                    int totalSubmissions = await _timeTrialRepository.GetProfileSubmissionsCountAsync(ttProfile.Id);
                    ttProfile.TotalSubmissions = Math.Max(0, totalSubmissions - 1);
                    await _timeTrialRepository.UpdateTTProfileAsync(ttProfile);
                }

                if (System.IO.File.Exists(submission.GhostFilePath))
                {
                    System.IO.File.Delete(submission.GhostFilePath);
                }

                await _timeTrialRepository.DeleteGhostSubmissionAsync(id);


                _logger.LogInformation("Ghost submission {SubmissionId} deleted", id);

                return Ok(new { success = true, message = "Ghost submission deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting ghost submission {SubmissionId}", id);
                return StatusCode(500, new { error = "An error occurred while deleting the ghost submission" });
            }
        }

        // ===== TT PROFILE MANAGEMENT =====

        [HttpPost("timetrial/profile/create")]
        public async Task<IActionResult> CreateTTProfile([FromBody] CreateTTProfileRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.DisplayName))
                {
                    return BadRequest(new { success = false, message = "Display name is required" });
                }

                // Trim and validate display name
                var displayName = request.DisplayName.Trim();

                if (displayName.Length < 2)
                {
                    return BadRequest(new { success = false, message = "Display name must be at least 2 characters" });
                }

                if (displayName.Length > 50)
                {
                    return BadRequest(new { success = false, message = "Display name must be 50 characters or less" });
                }

                // Check if profile already exists
                var existingProfile = await _timeTrialRepository.GetTTProfileByNameAsync(displayName);
                if (existingProfile != null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = $"Profile with name '{displayName}' already exists",
                        existingProfile = new
                        {
                            existingProfile.Id,
                            existingProfile.DisplayName,
                            existingProfile.TotalSubmissions,
                            existingProfile.CurrentWorldRecords
                        }
                    });
                }

                // Create new profile
                var newProfile = new TTProfileEntity
                {
                    DisplayName = displayName,
                    TotalSubmissions = 0,
                    CurrentWorldRecords = 0,
                    CountryCode = request.CountryCode ?? 0,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _timeTrialRepository.AddTTProfileAsync(newProfile);

                _logger.LogInformation(
                    "TT Profile created: {DisplayName} (ID: {ProfileId})",
                    newProfile.DisplayName, newProfile.Id);

                return Ok(new
                {
                    success = true,
                    message = "TT Profile created successfully",
                    profile = new
                    {
                        newProfile.Id,
                        newProfile.DisplayName,
                        newProfile.TotalSubmissions,
                        newProfile.CurrentWorldRecords,
                        newProfile.CountryCode,
                        newProfile.CreatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating TT profile");
                return StatusCode(500, new { success = false, message = "An error occurred while creating the profile" });
            }
        }

        [HttpGet("timetrial/profiles")]
        public async Task<IActionResult> GetAllTTProfiles()
        {
            try
            {
                var profiles = await _timeTrialRepository.GetAllTTProfilesAsync();

                var profileDtos = profiles
                    .OrderBy(p => p.DisplayName)
                    .Select(p => new
                    {
                        p.Id,
                        p.DisplayName,
                        p.TotalSubmissions,
                        p.CurrentWorldRecords,
                        p.CountryCode,
                        p.CreatedAt
                    })
                    .ToList();

                return Ok(new
                {
                    success = true,
                    count = profileDtos.Count,
                    profiles = profileDtos
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting TT profiles");
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving profiles" });
            }
        }

        [HttpDelete("timetrial/profile/{id}")]
        public async Task<IActionResult> DeleteTTProfile(int id)
        {
            try
            {
                var profile = await _timeTrialRepository.GetTTProfileByIdAsync(id);
                if (profile == null)
                {
                    return NotFound(new { success = false, message = $"Profile {id} not found" });
                }

                // Check if profile has submissions
                var submissionCount = await _timeTrialRepository.GetProfileSubmissionsCountAsync(id);
                if (submissionCount > 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = $"Cannot delete profile '{profile.DisplayName}' - it has {submissionCount} submission(s). Delete submissions first."
                    });
                }

                await _timeTrialRepository.DeleteTTProfileAsync(id);

                _logger.LogInformation(
                    "TT Profile deleted: {DisplayName} (ID: {ProfileId})",
                    profile.DisplayName, id);

                return Ok(new
                {
                    success = true,
                    message = $"Profile '{profile.DisplayName}' deleted successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting TT profile {ProfileId}", id);
                return StatusCode(500, new { success = false, message = "An error occurred while deleting the profile" });
            }
        }

        [HttpPut("timetrial/profile/{id}")]
        public async Task<IActionResult> UpdateTTProfile(int id, [FromBody] UpdateTTProfileRequest request)
        {
            try
            {
                var profile = await _timeTrialRepository.GetTTProfileByIdAsync(id);
                if (profile == null)
                {
                    return NotFound(new { success = false, message = $"Profile {id} not found" });
                }

                var displayName = request.DisplayName?.Trim();

                // Update display name if provided
                if (!string.IsNullOrWhiteSpace(displayName))
                {
                    if (displayName.Length < 2 || displayName.Length > 50)
                    {
                        return BadRequest(new { success = false, message = "Display name must be between 2 and 50 characters" });
                    }

                    // Check if new name already exists (and it's not the same profile)
                    var existingProfile = await _timeTrialRepository.GetTTProfileByNameAsync(displayName);
                    if (existingProfile != null && existingProfile.Id != id)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = $"Profile with name '{displayName}' already exists"
                        });
                    }

                    profile.DisplayName = displayName;
                }

                // Update country code if provided
                if (request.CountryCode.HasValue)
                {
                    profile.CountryCode = request.CountryCode.Value;
                }

                await _timeTrialRepository.UpdateTTProfileAsync(profile);

                _logger.LogInformation(
                    "TT Profile updated: {DisplayName} (ID: {ProfileId})",
                    profile.DisplayName, id);

                return Ok(new
                {
                    success = true,
                    message = "Profile updated successfully",
                    profile = new
                    {
                        profile.Id,
                        profile.DisplayName,
                        profile.TotalSubmissions,
                        profile.CurrentWorldRecords,
                        profile.CountryCode,
                        profile.UpdatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating TT profile {ProfileId}", id);
                return StatusCode(500, new { success = false, message = "An error occurred while updating the profile" });
            }
        }

        [HttpGet("countries")]
        public IActionResult GetCountries()
        {
            var countries = CountryCodeHelper.GetAllCountries()
                .Select(c => new
                {
                    numericCode = c.NumericCode,
                    alpha2 = c.Alpha2,
                    name = c.Name
                })
                .ToList();

            return Ok(new
            {
                success = true,
                count = countries.Count,
                countries
            });
        }
    }
}