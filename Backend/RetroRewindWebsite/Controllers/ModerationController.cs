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

        // ===== CONSTANTS =====
        private const short CC_150 = 150;
        private const short CC_200 = 200;
        private const int MIN_DISPLAY_NAME_LENGTH = 2;
        private const int MAX_DISPLAY_NAME_LENGTH = 50;

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

        // ===== PLAYER MODERATION ENDPOINTS =====

        /// <summary>
        /// Flags a player as suspicious
        /// </summary>
        [HttpPost("flag")]
        public async Task<ActionResult<ModerationActionResultDto>> FlagPlayer([FromBody] FlagRequest request)
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
                    return Ok(new ModerationActionResultDto
                    {
                        Success = true,
                        Message = $"Player '{player.Name}' is already flagged as suspicious"
                    });
                }

                player.IsSuspicious = true;
                await _playerRepository.UpdateAsync(player);

                _logger.LogWarning(
                    "Player flagged as suspicious: {Name} ({FriendCode}) - PID: {Pid}",
                    player.Name, player.Fc, player.Pid);

                return Ok(new ModerationActionResultDto
                {
                    Success = true,
                    Message = $"Player '{player.Name}' has been flagged as suspicious",
                    Player = new PlayerDto
                    {
                        Pid = player.Pid,
                        Name = player.Name,
                        FriendCode = player.Fc,
                        VR = player.Ev,
                        Rank = player.Rank,
                        LastSeen = player.LastSeen,
                        IsSuspicious = player.IsSuspicious,
                        VRStats = new VRStatsDto
                        {
                            Last24Hours = player.VRGainLast24Hours,
                            LastWeek = player.VRGainLastWeek,
                            LastMonth = player.VRGainLastMonth
                        },
                        MiiImageBase64 = player.MiiImageBase64,
                        MiiData = player.MiiData
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

        /// <summary>
        /// Unflags a suspicious player
        /// </summary>
        [HttpPost("unflag")]
        public async Task<ActionResult<ModerationActionResultDto>> UnflagPlayer([FromBody] UnflagRequest request)
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
                    return Ok(new ModerationActionResultDto
                    {
                        Success = true,
                        Message = $"Player '{player.Name}' is not flagged as suspicious"
                    });
                }

                player.IsSuspicious = false;
                player.SuspiciousVRJumps = 0;
                await _playerRepository.UpdateAsync(player);

                _logger.LogInformation(
                    "Player unflagged: {Name} ({FriendCode}) - PID: {Pid}",
                    player.Name, player.Fc, player.Pid);

                return Ok(new ModerationActionResultDto
                {
                    Success = true,
                    Message = $"Player '{player.Name}' has been unflagged",
                    Player = new PlayerDto
                    {
                        Pid = player.Pid,
                        Name = player.Name,
                        FriendCode = player.Fc,
                        VR = player.Ev,
                        Rank = player.Rank,
                        LastSeen = player.LastSeen,
                        IsSuspicious = player.IsSuspicious,
                        VRStats = new VRStatsDto
                        {
                            Last24Hours = player.VRGainLast24Hours,
                            LastWeek = player.VRGainLastWeek,
                            LastMonth = player.VRGainLastMonth
                        },
                        MiiImageBase64 = player.MiiImageBase64,
                        MiiData = player.MiiData
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

        /// <summary>
        /// Bans a player and removes them from the leaderboard
        /// </summary>
        [HttpPost("ban")]
        public async Task<ActionResult<ModerationActionResultDto>> BanPlayer([FromBody] BanRequest request)
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
                    "Player banned: {Name} ({FriendCode}) - PID: {Pid}",
                    player.Name, player.Fc, player.Pid);

                return Ok(new ModerationActionResultDto
                {
                    Success = true,
                    Message = $"Player '{player.Name}' has been banned and removed from the leaderboard",
                    Player = new PlayerDto
                    {
                        Pid = player.Pid,
                        Name = player.Name,
                        FriendCode = player.Fc,
                        VR = player.Ev,
                        Rank = player.Rank,
                        LastSeen = player.LastSeen,
                        IsSuspicious = player.IsSuspicious,
                        VRStats = new VRStatsDto(),
                        MiiImageBase64 = player.MiiImageBase64,
                        MiiData = player.MiiData
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

        /// <summary>
        /// Retrieves suspicious VR jumps for a specific player
        /// </summary>
        [HttpGet("suspicious-jumps/{pid}")]
        public async Task<ActionResult<SuspiciousJumpsResultDto>> GetSuspiciousJumps(string pid)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(pid))
                {
                    return BadRequest("Player ID (Pid) is required");
                }

                var player = await _playerRepository.GetByPidAsync(pid);
                if (player == null)
                {
                    return NotFound($"Player with PID '{pid}' not found");
                }

                var history = await _vrHistoryRepository.GetPlayerHistoryAsync(player.Pid, 1000);
                var suspiciousJumps = history
                    .Where(h => Math.Abs(h.VRChange) >= 200)
                    .OrderByDescending(h => h.Date)
                    .Select(h => new VRJumpDto
                    {
                        Date = h.Date,
                        VRChange = h.VRChange,
                        TotalVR = h.TotalVR
                    })
                    .ToList();

                _logger.LogInformation(
                    "Retrieved {Count} suspicious jumps for player: {Name} ({Pid})",
                    suspiciousJumps.Count, player.Name, pid);

                return Ok(new SuspiciousJumpsResultDto
                {
                    Success = true,
                    Player = new PlayerBasicDto
                    {
                        Pid = player.Pid,
                        Name = player.Name,
                        FriendCode = player.Fc,
                        IsSuspicious = player.IsSuspicious,
                        SuspiciousVRJumps = player.SuspiciousVRJumps
                    },
                    SuspiciousJumps = suspiciousJumps,
                    Count = suspiciousJumps.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving suspicious jumps for PID {Pid}", pid);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving suspicious jumps");
            }
        }

        /// <summary>
        /// Retrieves comprehensive stats for a specific player
        /// </summary>
        [HttpGet("player-stats/{pid}")]
        public async Task<ActionResult<PlayerStatsResultDto>> GetPlayerStats(string pid)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(pid))
                {
                    return BadRequest("Player ID (Pid) is required");
                }

                var player = await _playerRepository.GetByPidAsync(pid);
                if (player == null)
                {
                    return NotFound($"Player with PID '{pid}' not found");
                }

                _logger.LogInformation(
                    "Retrieved stats for player: {Name} ({Pid})",
                    player.Name, pid);

                return Ok(new PlayerStatsResultDto
                {
                    Success = true,
                    Player = new PlayerStatsDto
                    {
                        Pid = player.Pid,
                        Name = player.Name,
                        FriendCode = player.Fc,
                        VR = player.Ev,
                        Rank = player.Rank,
                        LastSeen = player.LastSeen,
                        IsSuspicious = player.IsSuspicious,
                        SuspiciousVRJumps = player.SuspiciousVRJumps,
                        VRStats = new VRStatsDto
                        {
                            Last24Hours = player.VRGainLast24Hours,
                            LastWeek = player.VRGainLastWeek,
                            LastMonth = player.VRGainLastMonth
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving stats for PID {Pid}", pid);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving player stats");
            }
        }

        // ===== TIME TRIAL GHOST SUBMISSION =====

        /// <summary>
        /// Submits a new Time Trial ghost
        /// </summary>
        [HttpPost("timetrial/submit")]
        public async Task<ActionResult<GhostSubmissionResultDto>> SubmitTimeTrialGhost(
            [FromForm] GhostSubmissionRequest request)
        {
            try
            {
                // Validate file
                var fileValidation = ValidateGhostFile(request.GhostFile);
                if (fileValidation != null) return fileValidation;

                // Validate CC
                var ccValidation = ValidateCc((short)request.Cc);
                if (ccValidation != null) return ccValidation;

                // Validate track exists
                var track = await _timeTrialRepository.GetTrackByIdAsync(request.TrackId);
                if (track == null)
                {
                    return BadRequest($"Track ID {request.TrackId} not found");
                }

                // Validate glitch category for tracks that don't support it
                if (request.Glitch && !track.SupportsGlitch)
                {
                    return BadRequest($"Glitch/shortcut runs are not allowed for {track.Name}");
                }

                // Validate profile exists
                var ttProfile = await _timeTrialRepository.GetTTProfileByIdAsync(request.TtProfileId);
                if (ttProfile == null)
                {
                    return BadRequest($"TT Profile with ID {request.TtProfileId} not found. Create the profile first.");
                }

                // Validate drift category
                if (request.DriftCategory < 0 || request.DriftCategory > 1)
                {
                    return BadRequest("Drift category must be 0 (Outside) or 1 (Inside)");
                }

                // Parse ghost file
                GhostFileParseResult ghostData;
                using (var memoryStream = new MemoryStream())
                {
                    await request.GhostFile.CopyToAsync(memoryStream);
                    memoryStream.Position = 0;
                    ghostData = await _ghostFileService.ParseGhostFileAsync(memoryStream);
                }

                if (!ghostData.Success)
                {
                    return BadRequest(ghostData.ErrorMessage);
                }

                // Validate track slot matches
                var trackSlotValidation = ValidateTrackSlotMatch(ghostData.CourseId, track);
                if (trackSlotValidation != null) return trackSlotValidation;

                // Save ghost file
                string ghostFilePath;
                using (var fileStream = request.GhostFile.OpenReadStream())
                {
                    ghostFilePath = await _ghostFileService.SaveGhostFileAsync(
                        fileStream,
                        request.TrackId,
                        (short)request.Cc,
                        ttProfile.DisplayName);
                }

                // Create submission entity
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
                    DriftCategory = request.DriftCategory,
                    MiiName = ghostData.MiiName,
                    LapCount = ghostData.LapCount,
                    LapSplitsMs = System.Text.Json.JsonSerializer.Serialize(ghostData.LapSplitsMs),
                    GhostFilePath = ghostFilePath,
                    DateSet = ghostData.DateSet,
                    SubmittedAt = DateTime.UtcNow,
                    Shroomless = request.Shroomless,
                    Glitch = request.Glitch,
                };

                // Add to database
                await _timeTrialRepository.AddGhostSubmissionAsync(submission);

                // Update profile submission count
                ttProfile.TotalSubmissions = await _timeTrialRepository.GetProfileSubmissionsCountAsync(ttProfile.Id);
                await _timeTrialRepository.UpdateTTProfileAsync(ttProfile);

                // Update all world record counts for every profile
                await _timeTrialRepository.UpdateWorldRecordCounts();

                _logger.LogInformation(
                    "Ghost submitted: Track {TrackId}, Player {PlayerName} (ID: {ProfileId}), Time {Time}ms",
                    request.TrackId, ttProfile.DisplayName, ttProfile.Id, ghostData.FinishTimeMs);

                return Ok(new GhostSubmissionResultDto
                {
                    Success = true,
                    Message = "Ghost submitted successfully",
                    Submission = new GhostSubmissionDetailDto
                    {
                        Id = submission.Id,
                        TrackId = submission.TrackId,
                        TrackName = track.Name,
                        TTProfileId = submission.TTProfileId,
                        PlayerName = ttProfile.DisplayName,
                        CountryCode = ttProfile.CountryCode,
                        CountryAlpha2 = CountryCodeHelper.GetAlpha2Code(ttProfile.CountryCode),
                        CountryName = CountryCodeHelper.GetCountryName(ttProfile.CountryCode),
                        CC = submission.CC,
                        FinishTimeMs = submission.FinishTimeMs,
                        FinishTimeDisplay = submission.FinishTimeDisplay,
                        VehicleId = submission.VehicleId,
                        CharacterId = submission.CharacterId,
                        ControllerType = submission.ControllerType,
                        DriftType = submission.DriftType,
                        VehicleName = MarioKartMappings.GetVehicleName(submission.VehicleId),
                        CharacterName = MarioKartMappings.GetCharacterName(submission.CharacterId),
                        ControllerName = MarioKartMappings.GetControllerName(submission.ControllerType),
                        DriftTypeName = MarioKartMappings.GetDriftTypeName(submission.DriftType),
                        DriftCategoryName = MarioKartMappings.GetDriftCategoryName(submission.DriftCategory),
                        TrackSlotName = MarioKartMappings.GetTrackSlotName(ghostData.CourseId),
                        MiiName = submission.MiiName,
                        LapCount = submission.LapCount,
                        LapSplitsMs = ghostData.LapSplitsMs,
                        LapSplitsDisplay = [.. ghostData.LapSplitsMs.Select(FormatLapTime)],
                        FastestLapMs = ghostData.LapSplitsMs.DefaultIfEmpty(0).Min(),
                        FastestLapDisplay = ghostData.LapSplitsMs.Count > 0
                            ? FormatLapTime(ghostData.LapSplitsMs.Min())
                            : "",
                        GhostFilePath = submission.GhostFilePath,
                        DateSet = submission.DateSet,
                        SubmittedAt = submission.SubmittedAt,
                        Shroomless = submission.Shroomless,
                        Glitch = submission.Glitch,
                        DriftCategory = submission.DriftCategory
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting ghost for track {TrackId}", request.TrackId);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while submitting the ghost");
            }
        }

        /// <summary>
        /// Deletes a ghost submission
        /// </summary>
        [HttpDelete("timetrial/submission/{id}")]
        public async Task<ActionResult<GhostDeletionResultDto>> DeleteGhostSubmission(int id)
        {
            try
            {
                var submission = await _timeTrialRepository.GetGhostSubmissionByIdAsync(id);
                if (submission == null)
                {
                    return NotFound(new GhostDeletionResultDto
                    {
                        Success = false,
                        Message = $"Submission {id} not found"
                    });
                }

                // Delete ghost file from disk
                if (System.IO.File.Exists(submission.GhostFilePath))
                {
                    try
                    {
                        System.IO.File.Delete(submission.GhostFilePath);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to delete ghost file: {FilePath}",
                            submission.GhostFilePath);
                    }
                }

                // Delete from database
                await _timeTrialRepository.DeleteGhostSubmissionAsync(id);

                // Update profile submission count
                var ttProfile = await _timeTrialRepository.GetTTProfileByIdAsync(submission.TTProfileId);
                if (ttProfile != null)
                {
                    ttProfile.TotalSubmissions = await _timeTrialRepository.GetProfileSubmissionsCountAsync(ttProfile.Id);
                    await _timeTrialRepository.UpdateTTProfileAsync(ttProfile);
                }
                else
                {
                    _logger.LogWarning("TT Profile {ProfileId} not found when deleting submission {SubmissionId}",
                        submission.TTProfileId, id);
                }

                // Update all world record counts for every profile (in case a WR was deleted)
                await _timeTrialRepository.UpdateWorldRecordCounts();

                _logger.LogInformation("Ghost submission {SubmissionId} deleted", id);

                return Ok(new GhostDeletionResultDto
                {
                    Success = true,
                    Message = "Ghost submission deleted successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting ghost submission {SubmissionId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while deleting the ghost submission");
            }
        }

        // ===== TT PROFILE MANAGEMENT =====

        /// <summary>
        /// Creates a new Time Trial profile
        /// </summary>
        [HttpPost("timetrial/profile/create")]
        public async Task<ActionResult<ProfileCreationResultDto>> CreateTTProfile([FromBody] CreateTTProfileRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var validation = ValidateDisplayName(request.DisplayName, out var displayName);
                if (validation != null) return validation;

                // Check if profile already exists
                var existingProfile = await _timeTrialRepository.GetTTProfileByNameAsync(displayName);
                if (existingProfile != null)
                {
                    return BadRequest(new ProfileCreationResultDto
                    {
                        Success = false,
                        Message = $"Profile with name '{displayName}' already exists",
                        Profile = new TTProfileDto
                        {
                            Id = existingProfile.Id,
                            DisplayName = existingProfile.DisplayName,
                            TotalSubmissions = existingProfile.TotalSubmissions,
                            CurrentWorldRecords = existingProfile.CurrentWorldRecords,
                            CountryCode = existingProfile.CountryCode,
                            CountryAlpha2 = CountryCodeHelper.GetAlpha2Code(existingProfile.CountryCode),
                            CountryName = CountryCodeHelper.GetCountryName(existingProfile.CountryCode)
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

                return Ok(new ProfileCreationResultDto
                {
                    Success = true,
                    Message = "TT Profile created successfully",
                    Profile = new TTProfileDto
                    {
                        Id = newProfile.Id,
                        DisplayName = newProfile.DisplayName,
                        TotalSubmissions = newProfile.TotalSubmissions,
                        CurrentWorldRecords = newProfile.CurrentWorldRecords,
                        CountryCode = newProfile.CountryCode,
                        CountryAlpha2 = CountryCodeHelper.GetAlpha2Code(newProfile.CountryCode),
                        CountryName = CountryCodeHelper.GetCountryName(newProfile.CountryCode)
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating TT profile");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while creating the profile");
            }
        }

        /// <summary>
        /// Retrieves all Time Trial profiles
        /// </summary>
        [HttpGet("timetrial/profiles")]
        public async Task<ActionResult<ProfileListResultDto>> GetAllTTProfiles()
        {
            try
            {
                var profiles = await _timeTrialRepository.GetAllTTProfilesAsync();

                var profileDtos = profiles
                    .OrderBy(p => p.DisplayName)
                    .Select(p => new TTProfileDto
                    {
                        Id = p.Id,
                        DisplayName = p.DisplayName,
                        TotalSubmissions = p.TotalSubmissions,
                        CurrentWorldRecords = p.CurrentWorldRecords,
                        CountryCode = p.CountryCode,
                        CountryAlpha2 = CountryCodeHelper.GetAlpha2Code(p.CountryCode),
                        CountryName = CountryCodeHelper.GetCountryName(p.CountryCode)
                    })
                    .ToList();

                return Ok(new ProfileListResultDto
                {
                    Success = true,
                    Count = profileDtos.Count,
                    Profiles = profileDtos
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving TT profiles");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving profiles");
            }
        }

        /// <summary>
        /// Deletes a Time Trial profile
        /// </summary>
        [HttpDelete("timetrial/profile/{id}")]
        public async Task<ActionResult<ProfileDeletionResultDto>> DeleteTTProfile(int id)
        {
            try
            {
                var profile = await _timeTrialRepository.GetTTProfileByIdAsync(id);
                if (profile == null)
                {
                    return NotFound(new ProfileDeletionResultDto
                    {
                        Success = false,
                        Message = $"Profile {id} not found"
                    });
                }

                // Check if profile has submissions
                var submissionCount = await _timeTrialRepository.GetProfileSubmissionsCountAsync(id);
                if (submissionCount > 0)
                {
                    return BadRequest(new ProfileDeletionResultDto
                    {
                        Success = false,
                        Message = $"Cannot delete profile '{profile.DisplayName}' - it has {submissionCount} submission(s). Delete submissions first."
                    });
                }

                await _timeTrialRepository.DeleteTTProfileAsync(id);

                _logger.LogInformation(
                    "TT Profile deleted: {DisplayName} (ID: {ProfileId})",
                    profile.DisplayName, id);

                return Ok(new ProfileDeletionResultDto
                {
                    Success = true,
                    Message = $"Profile '{profile.DisplayName}' deleted successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting TT profile {ProfileId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while deleting the profile");
            }
        }

        /// <summary>
        /// Updates a Time Trial profile
        /// </summary>
        [HttpPut("timetrial/profile/{id}")]
        public async Task<ActionResult<ProfileUpdateResultDto>> UpdateTTProfile(int id, [FromBody] UpdateTTProfileRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var profile = await _timeTrialRepository.GetTTProfileByIdAsync(id);
                if (profile == null)
                {
                    return NotFound(new ProfileUpdateResultDto
                    {
                        Success = false,
                        Message = $"Profile {id} not found"
                    });
                }

                // Update display name if provided
                if (!string.IsNullOrWhiteSpace(request.DisplayName))
                {
                    var validation = ValidateDisplayName(request.DisplayName, out var displayName);
                    if (validation != null) return validation;

                    // Check if new name already exists
                    var existingProfile = await _timeTrialRepository.GetTTProfileByNameAsync(displayName);
                    if (existingProfile != null && existingProfile.Id != id)
                    {
                        return BadRequest(new ProfileUpdateResultDto
                        {
                            Success = false,
                            Message = $"Profile with name '{displayName}' already exists"
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

                return Ok(new ProfileUpdateResultDto
                {
                    Success = true,
                    Message = "Profile updated successfully",
                    Profile = new TTProfileDto
                    {
                        Id = profile.Id,
                        DisplayName = profile.DisplayName,
                        TotalSubmissions = profile.TotalSubmissions,
                        CurrentWorldRecords = profile.CurrentWorldRecords,
                        CountryCode = profile.CountryCode,
                        CountryAlpha2 = CountryCodeHelper.GetAlpha2Code(profile.CountryCode),
                        CountryName = CountryCodeHelper.GetCountryName(profile.CountryCode)
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating TT profile {ProfileId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while updating the profile");
            }
        }

        // ===== UTILITY ENDPOINTS =====

        /// <summary>
        /// Retrieves all available country codes
        /// </summary>
        [HttpGet("countries")]
        public ActionResult<CountryListResultDto> GetCountries()
        {
            var countries = CountryCodeHelper.GetAllCountries()
                .Select(c => new CountryDto
                {
                    NumericCode = c.NumericCode,
                    Alpha2 = c.Alpha2,
                    Name = c.Name
                })
                .ToList();

            return Ok(new CountryListResultDto
            {
                Success = true,
                Count = countries.Count,
                Countries = countries
            });
        }

        /// <summary>
        /// Searches ghost submissions with flexible filters
        /// </summary>
        [HttpGet("timetrial/submissions/search")]
        public async Task<ActionResult<GhostSubmissionSearchResultDto>> SearchGhostSubmissions(
            [FromQuery] int? ttProfileId = null,
            [FromQuery] int? trackId = null,
            [FromQuery] short? cc = null,
            [FromQuery] bool? glitch = null,
            [FromQuery] bool? shroomless = null,
            [FromQuery] short? driftCategory = null,
            [FromQuery] int limit = 25)
        {
            try
            {
                limit = Math.Clamp(limit, 1, 100);

                var submissions = await _timeTrialRepository.SearchGhostSubmissionsAsync(
                    ttProfileId, trackId, cc, glitch, shroomless, driftCategory, limit);

                var submissionDtos = submissions.Select(s => new GhostSubmissionDetailDto
                {
                    Id = s.Id,
                    TrackId = s.TrackId,
                    TrackName = s.Track?.Name ?? "Unknown",
                    TTProfileId = s.TTProfileId,
                    PlayerName = s.TTProfile?.DisplayName ?? "Unknown",
                    CountryCode = s.TTProfile?.CountryCode ?? 0,
                    CountryAlpha2 = CountryCodeHelper.GetAlpha2Code(s.TTProfile?.CountryCode ?? 0),
                    CountryName = CountryCodeHelper.GetCountryName(s.TTProfile?.CountryCode ?? 0),
                    CC = s.CC,
                    FinishTimeMs = s.FinishTimeMs,
                    FinishTimeDisplay = s.FinishTimeDisplay,
                    VehicleId = s.VehicleId,
                    CharacterId = s.CharacterId,
                    ControllerType = s.ControllerType,
                    DriftType = s.DriftType,
                    VehicleName = MarioKartMappings.GetVehicleName(s.VehicleId),
                    CharacterName = MarioKartMappings.GetCharacterName(s.CharacterId),
                    ControllerName = MarioKartMappings.GetControllerName(s.ControllerType),
                    DriftTypeName = MarioKartMappings.GetDriftTypeName(s.DriftType),
                    DriftCategoryName = MarioKartMappings.GetDriftCategoryName(s.DriftCategory),
                    TrackSlotName = MarioKartMappings.GetTrackSlotName(s.Track?.CourseId ?? 0),
                    MiiName = s.MiiName,
                    LapCount = s.LapCount,
                    LapSplitsMs = System.Text.Json.JsonSerializer.Deserialize<List<int>>(s.LapSplitsMs) ?? [],
                    LapSplitsDisplay = [],
                    FastestLapMs = 0,
                    FastestLapDisplay = "",
                    GhostFilePath = s.GhostFilePath,
                    DateSet = s.DateSet,
                    SubmittedAt = s.SubmittedAt,
                    Shroomless = s.Shroomless,
                    Glitch = s.Glitch,
                    DriftCategory = s.DriftCategory
                }).ToList();

                return Ok(new GhostSubmissionSearchResultDto
                {
                    Success = true,
                    Count = submissionDtos.Count,
                    Submissions = submissionDtos
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching ghost submissions");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while searching submissions");
            }
        }

        // ===== FLEXIBLE BKT ENDPOINT =====

        /// <summary>
        /// Retrieves the Best Known Time (BKT) for a specific track with flexible filtering
        /// </summary>
        [HttpGet("timetrial/bkt")]
        public async Task<ActionResult<GhostSubmissionDto>> GetFlexibleBKT(
            [FromQuery] int trackId,
            [FromQuery] short cc,
            [FromQuery] bool nonGlitchOnly = false,
            [FromQuery] string? shroomless = null,  // "only" or "exclude" or null (all)
            [FromQuery] string? vehicle = null,     // "bikes" or "karts" or null (all)
            [FromQuery] string? drift = null,       // "manual" or "hybrid" or null (all)
            [FromQuery] string? driftCategory = null) // "inside" or "outside" or null (all)
        {
            try
            {
                var ccValidation = ValidateCc(cc);
                if (ccValidation != null) return ccValidation;

                var track = await _timeTrialRepository.GetTrackByIdAsync(trackId);
                if (track == null)
                {
                    return NotFound($"Track with ID {trackId} not found");
                }

                bool? shroomlessFilter = null;
                if (!string.IsNullOrWhiteSpace(shroomless))
                {
                    shroomlessFilter = shroomless.ToLower() switch
                    {
                        "only" => true,
                        "exclude" => false,
                        _ => null
                    };
                }

                short? driftTypeFilter = null;
                if (!string.IsNullOrWhiteSpace(drift))
                {
                    driftTypeFilter = drift.ToLower() switch
                    {
                        "manual" => (short)0,
                        "hybrid" => (short)1,
                        _ => null
                    };
                }

                short? driftCategoryFilter = null;
                if (!string.IsNullOrWhiteSpace(driftCategory))
                {
                    driftCategoryFilter = driftCategory.ToLower() switch
                    {
                        "outside" => (short)0,
                        "inside" => (short)1,
                        _ => null
                    };
                }

                // Determine vehicle ID range
                short? minVehicleId = null;
                short? maxVehicleId = null;
                if (!string.IsNullOrWhiteSpace(vehicle))
                {
                    switch (vehicle.ToLower())
                    {
                        case "karts":
                            minVehicleId = 0;   // Karts: 0x00 (0) through 0x11 (17)
                            maxVehicleId = 17;
                            break;
                        case "bikes":
                            minVehicleId = 18;  // Bikes: 0x12 (18) through 0x23 (35)
                            maxVehicleId = 35;
                            break;
                    }
                }

                // Apply non-glitch filter (force it for tracks that don't support glitch)
                bool glitchFilter = nonGlitchOnly || !track.SupportsGlitch;

                var bkt = await _timeTrialRepository.GetBestKnownTimeAsync(
                    trackId: trackId,
                    cc: cc,
                    nonGlitchOnly: glitchFilter,
                    shroomless: shroomlessFilter,
                    minVehicleId: minVehicleId,
                    maxVehicleId: maxVehicleId,
                    driftType: driftTypeFilter,
                    driftCategory: driftCategoryFilter);

                if (bkt == null)
                {
                    return NotFound("No times found matching the specified filters");
                }

                var lapSplitsMs = System.Text.Json.JsonSerializer.Deserialize<List<int>>(bkt.LapSplitsMs) ?? [];

                return Ok(new GhostSubmissionDetailDto
                {
                    Id = bkt.Id,
                    TrackId = bkt.TrackId,
                    TrackName = bkt.Track?.Name ?? track.Name,
                    TTProfileId = bkt.TTProfileId,
                    PlayerName = bkt.TTProfile?.DisplayName ?? "Unknown",
                    CountryCode = bkt.TTProfile?.CountryCode ?? 0,
                    CountryAlpha2 = bkt.TTProfile?.CountryCode != null
                        ? CountryCodeHelper.GetAlpha2Code(bkt.TTProfile.CountryCode)
                        : null,
                    CountryName = bkt.TTProfile?.CountryCode != null
                        ? CountryCodeHelper.GetCountryName(bkt.TTProfile.CountryCode)
                        : null,
                    CC = bkt.CC,
                    FinishTimeMs = bkt.FinishTimeMs,
                    FinishTimeDisplay = bkt.FinishTimeDisplay,
                    VehicleId = bkt.VehicleId,
                    CharacterId = bkt.CharacterId,
                    ControllerType = bkt.ControllerType,
                    DriftType = bkt.DriftType,
                    VehicleName = MarioKartMappings.GetVehicleName(bkt.VehicleId),
                    CharacterName = MarioKartMappings.GetCharacterName(bkt.CharacterId),
                    ControllerName = MarioKartMappings.GetControllerName(bkt.ControllerType),
                    DriftTypeName = MarioKartMappings.GetDriftTypeName(bkt.DriftType),
                    DriftCategoryName = MarioKartMappings.GetDriftCategoryName(bkt.DriftCategory),
                    MiiName = bkt.MiiName,
                    LapCount = bkt.LapCount,
                    LapSplitsMs = lapSplitsMs,
                    LapSplitsDisplay = [.. lapSplitsMs.Select(FormatLapTime)],
                    FastestLapMs = lapSplitsMs.DefaultIfEmpty(0).Min(),
                    FastestLapDisplay = lapSplitsMs.Count > 0
                        ? FormatLapTime(lapSplitsMs.Min())
                        : string.Empty,
                    GhostFilePath = bkt.GhostFilePath,
                    DateSet = bkt.DateSet,
                    SubmittedAt = bkt.SubmittedAt,
                    Shroomless = bkt.Shroomless,
                    Glitch = bkt.Glitch,
                    DriftCategory = bkt.DriftCategory,
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving BKT for track {TrackId} {CC}cc", trackId, cc);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving the best known time");
            }
        }

        // ===== HELPER METHODS =====

        private BadRequestObjectResult? ValidateGhostFile(IFormFile? ghostFile)
        {
            if (ghostFile == null || ghostFile.Length == 0)
            {
                return BadRequest("Ghost file is required");
            }

            if (!ghostFile.FileName.EndsWith(".rkg", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("File must be a .rkg file");
            }

            return null;
        }

        private BadRequestObjectResult? ValidateCc(short cc)
        {
            if (cc != CC_150 && cc != CC_200)
            {
                return BadRequest($"CC must be either {CC_150} or {CC_200}");
            }
            return null;
        }

        private BadRequestObjectResult? ValidateTrackSlotMatch(short courseId, TrackEntity track)
        {
            var rkgTrackSlotName = MarioKartMappings.GetTrackSlotName(courseId);
            if (rkgTrackSlotName == null)
            {
                return BadRequest($"Invalid course ID in ghost file: {courseId}");
            }

            if (rkgTrackSlotName != track.TrackSlot)
            {
                _logger.LogWarning(
                    "Track slot mismatch: Ghost has {GhostSlot} but track {TrackName} uses {TrackSlot}",
                    rkgTrackSlotName, track.Name, track.TrackSlot);

                return BadRequest($"Track slot mismatch: This ghost uses the track slot of '{rkgTrackSlotName}' but you submitted it for '{track.Name}' which uses '{track.TrackSlot}'");
            }

            return null;
        }

        private BadRequestObjectResult? ValidateDisplayName(string displayName, out string trimmed)
        {
            trimmed = displayName.Trim();

            if (trimmed.Length < MIN_DISPLAY_NAME_LENGTH)
            {
                return BadRequest($"Display name must be at least {MIN_DISPLAY_NAME_LENGTH} characters");
            }

            if (trimmed.Length > MAX_DISPLAY_NAME_LENGTH)
            {
                return BadRequest($"Display name must be {MAX_DISPLAY_NAME_LENGTH} characters or less");
            }

            return null;
        }

        private static string FormatLapTime(int milliseconds)
        {
            var totalSeconds = milliseconds / 1000.0;
            var minutes = (int)(totalSeconds / 60);
            var seconds = totalSeconds % 60;

            return $"{minutes}:{seconds:00.000}";
        }
    }
}