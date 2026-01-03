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
        private const string CATEGORY_RETRO = "retro";
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
            IFormFile ghostFile,
            int trackId,
            int cc,
            int ttProfileId,
            bool shroomless = false,
            bool glitch = false)
        {
            try
            {
                // Validate file
                var fileValidation = ValidateGhostFile(ghostFile);
                if (fileValidation != null) return fileValidation;

                // Validate CC
                var ccValidation = ValidateCc((short)cc);
                if (ccValidation != null) return ccValidation;

                // Validate track exists
                var track = await _timeTrialRepository.GetTrackByIdAsync(trackId);
                if (track == null)
                {
                    return BadRequest($"Track ID {trackId} not found");
                }

                // Validate glitch runs for retro tracks
                if (track.Category.Equals(CATEGORY_RETRO, StringComparison.OrdinalIgnoreCase) && glitch)
                {
                    return BadRequest("Glitch runs are not allowed for Retro Tracks");
                }

                // Validate profile exists
                var ttProfile = await _timeTrialRepository.GetTTProfileByIdAsync(ttProfileId);
                if (ttProfile == null)
                {
                    return BadRequest($"TT Profile with ID {ttProfileId} not found. Create the profile first.");
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
                    return BadRequest(ghostData.ErrorMessage);
                }

                // Validate track slot matches
                var trackSlotValidation = ValidateTrackSlotMatch(ghostData.CourseId, track);
                if (trackSlotValidation != null) return trackSlotValidation;

                // Save ghost file
                string ghostFilePath;
                using (var fileStream = ghostFile.OpenReadStream())
                {
                    ghostFilePath = await _ghostFileService.SaveGhostFileAsync(
                        fileStream,
                        trackId,
                        (short)cc,
                        ttProfile.DisplayName);
                }

                // Create submission entity
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
                    Glitch = !track.Category.Equals(CATEGORY_RETRO, StringComparison.OrdinalIgnoreCase) && glitch
                };

                // Add to database
                await _timeTrialRepository.AddGhostSubmissionAsync(submission);

                // Update profile submission count
                ttProfile.TotalSubmissions = await _timeTrialRepository.GetProfileSubmissionsCountAsync(ttProfile.Id);
                await _timeTrialRepository.UpdateTTProfileAsync(ttProfile);

                _logger.LogInformation(
                    "Ghost submitted: Track {TrackId}, Player {PlayerName} (ID: {ProfileId}), Time {Time}ms",
                    trackId, ttProfile.DisplayName, ttProfile.Id, ghostData.FinishTimeMs);

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
                        Glitch = submission.Glitch
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting ghost for track {TrackId}", trackId);
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