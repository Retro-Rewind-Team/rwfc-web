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

        [HttpPost("ban")]
        public async Task<ActionResult> BanUser([FromBody] BanRequest request)
        {
            try
            {
                _logger.LogWarning("Ban request received for PID: {Pid}", request.Pid);

                var player = await _playerRepository.GetByPidAsync(request.Pid);

                if (player == null)
                {
                    return NotFound(new { Error = $"Player with PID {request.Pid} not found" });
                }

                var playerInfo = new
                {
                    ProfileId = player.Pid,
                    player.Name,
                    player.Fc,
                    LastInGameSn = player.Name,
                    LastIPAddress = "Hidden"
                };

                await _playerRepository.DeleteAsync(player.Id);

                _logger.LogWarning(
                    "Player {Name} ({Pid}) removed from leaderboard by moderator {Moderator}. Reason: {Reason}",
                    player.Name, player.Pid, request.Moderator, request.Reason);

                return Ok(new
                {
                    Success = true,
                    User = playerInfo
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing user with PID {Pid}", request.Pid);
                return StatusCode(500, new { Error = "An error occurred while removing the user" });
            }
        }

        [HttpPost("unflag")]
        public async Task<ActionResult> UnflagUser([FromBody] UnflagRequest request)
        {
            try
            {
                _logger.LogWarning("Unflag request received for PID: {Pid}", request.Pid);

                var player = await _playerRepository.GetByPidAsync(request.Pid);

                if (player == null)
                {
                    return NotFound(new { Error = $"Player with PID {request.Pid} not found" });
                }

                player.IsSuspicious = false;

                await _playerRepository.UpdateAsync(player);

                _logger.LogWarning("Player {Name} ({Pid}) unflagged by moderator {Moderator}",
                    player.Name, player.Pid, request.Moderator);

                return Ok(new
                {
                    Success = true,
                    User = new
                    {
                        ProfileId = player.Pid,
                        player.Name,
                        player.Fc,
                        player.IsSuspicious
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unflagging user with PID {Pid}", request.Pid);
                return StatusCode(500, new { Error = "An error occurred while unflagging the user" });
            }
        }

        [HttpGet("suspicious-jumps/{pid}")]
        public async Task<ActionResult> GetSuspiciousJumps(string pid)
        {
            try
            {
                _logger.LogInformation("Suspicious jumps request for PID: {Pid}", pid);

                var player = await _playerRepository.GetByPidAsync(pid);

                if (player == null)
                {
                    return NotFound(new { Error = $"Player with PID {pid} not found" });
                }

                var history = await _vrHistoryRepository.GetPlayerHistoryAsync(player.Pid, 1000);

                var suspiciousJumps = history
                    .Where(h => Math.Abs(h.VRChange) >= 200)
                    .OrderByDescending(h => h.Date)
                    .Select(h => new
                    {
                        h.Date,
                        h.VRChange,
                        h.TotalVR
                    })
                    .ToList();

                return Ok(new
                {
                    Success = true,
                    Player = new
                    {
                        player.Pid,
                        player.Name,
                        player.Fc,
                        player.IsSuspicious,
                        player.SuspiciousVRJumps
                    },
                    SuspiciousJumps = suspiciousJumps,
                    suspiciousJumps.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting suspicious jumps for PID {Pid}", pid);
                return StatusCode(500, new { Error = "An error occurred while retrieving suspicious jumps" });
            }
        }

        [HttpGet("player-stats/{pid}")]
        public async Task<ActionResult> GetPlayerStats(string pid)
        {
            try
            {
                _logger.LogInformation("Player stats request for PID: {Pid}", pid);

                var player = await _playerRepository.GetByPidAsync(pid);

                if (player == null)
                {
                    return NotFound(new { Error = $"Player with PID {pid} not found" });
                }

                return Ok(new
                {
                    Success = true,
                    Player = new
                    {
                        player.Pid,
                        player.Name,
                        player.Fc,
                        VR = player.Ev,
                        player.Rank,
                        ActiveRank = player.IsActive ? player.ActiveRank : (int?)null,
                        player.LastSeen,
                        player.IsActive,
                        player.IsSuspicious,
                        player.SuspiciousVRJumps,
                        VRStats = new
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
                _logger.LogError(ex, "Error getting stats for PID {Pid}", pid);
                return StatusCode(500, new { Error = "An error occurred while retrieving player stats" });
            }
        }

        [HttpPost("timetrial/submit")]
        public async Task<IActionResult> SubmitTimeTrialGhost(
            IFormFile ghostFile,
            int trackId,
            int cc,
            string discordId)
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
                        Message = $"Track slot mismatch: This ghost was recorded on '{rkgTrackSlotName}' but you submitted it for '{track.Name}' which uses '{track.TrackSlot}'"
                    });
                }

                // Get or create TT Profile
                var ttProfile = await _timeTrialRepository.GetTTProfileByDiscordIdAsync(discordId);

                if (ttProfile == null)
                {
                    ttProfile = new TTProfileEntity
                    {
                        DiscordUserId = discordId,
                        DisplayName = ghostData.MiiName,
                        TotalSubmissions = 0,
                        CurrentWorldRecords = 0,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    await _timeTrialRepository.AddTTProfileAsync(ttProfile);
                }

                string ghostFilePath;
                using (var fileStream = ghostFile.OpenReadStream())
                {
                    ghostFilePath = await _ghostFileService.SaveGhostFileAsync(
                        fileStream,
                        trackId,
                        (short)cc,
                        discordId);
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
                    LapSplitsMs = System.Text.Json.JsonSerializer.Serialize(ghostData.LapSplitsMs), // Serialize to JSON
                    GhostFilePath = ghostFilePath,
                    DateSet = ghostData.DateSet,
                    SubmittedByDiscordId = discordId,
                    SubmittedAt = DateTime.UtcNow
                };

                await _timeTrialRepository.AddGhostSubmissionAsync(submission);

                // Update profile stats
                ttProfile.TotalSubmissions++;
                await _timeTrialRepository.UpdateTTProfileAsync(ttProfile);

                _logger.LogInformation(
                    "Ghost submitted successfully: Track {TrackId}, Player {PlayerId}, Time {Time}ms",
                    trackId, ttProfile.Id, ghostData.FinishTimeMs);

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
                        submittedAt = submission.SubmittedAt
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
    }
}