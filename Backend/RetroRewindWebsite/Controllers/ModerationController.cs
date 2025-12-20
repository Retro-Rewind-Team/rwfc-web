using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Models.DTOs;
using RetroRewindWebsite.Models.Entities;
using RetroRewindWebsite.Models.External;
using RetroRewindWebsite.Repositories;
using RetroRewindWebsite.Services.Domain;
using System.Text.Json;

namespace RetroRewindWebsite.Controllers
{
    [ApiController]
    [Route("api/moderation")]
    public class ModerationController : ControllerBase
    {
        private readonly IPlayerRepository _playerRepository;
        private readonly IVRHistoryRepository _vrHistoryRepository;
        private readonly ILogger<ModerationController> _logger;
        private readonly ITimeTrialRepository _timeTrialRepository;
        private readonly IGhostFileService _ghostFileService;

        public ModerationController(
            IPlayerRepository playerRepository,
            IVRHistoryRepository vrHistoryRepository,
            ITimeTrialRepository timeTrialRepository,
            IGhostFileService ghostFileService,
            ILogger<ModerationController> logger)
        {
            _playerRepository = playerRepository;
            _vrHistoryRepository = vrHistoryRepository;
            _timeTrialRepository = timeTrialRepository;
            _ghostFileService = ghostFileService;
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
        public async Task<ActionResult<GhostSubmissionResponse>> SubmitGhost(
    [FromForm] int trackId,
    [FromForm] short cc,
    [FromForm] string discordUserId,
    [FromForm] IFormFile ghostFile)
        {
            try
            {
                // Validate inputs
                if (cc != 150 && cc != 200)
                {
                    return BadRequest(new GhostSubmissionResponse
                    {
                        Success = false,
                        Message = "CC must be either 150 or 200"
                    });
                }

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

                // Verify track exists
                var track = await _timeTrialRepository.GetTrackByIdAsync(trackId);
                if (track == null)
                {
                    return NotFound(new GhostSubmissionResponse
                    {
                        Success = false,
                        Message = $"Track with ID {trackId} not found"
                    });
                }

                // Parse ghost file
                using var fileStream = ghostFile.OpenReadStream();
                var parseResult = await _ghostFileService.ParseGhostFileAsync(fileStream);

                if (!parseResult.Success)
                {
                    return BadRequest(new GhostSubmissionResponse
                    {
                        Success = false,
                        Message = parseResult.ErrorMessage ?? "Failed to parse ghost file"
                    });
                }

                // Validate course ID matches track
                if (parseResult.CourseId != track.CourseId)
                {
                    return BadRequest(new GhostSubmissionResponse
                    {
                        Success = false,
                        Message = $"Ghost file course ID ({parseResult.CourseId}) does not match selected track (expected {track.CourseId})"
                    });
                }

                // Get or create TT profile
                var profile = await _timeTrialRepository.GetTTProfileByDiscordIdAsync(discordUserId);
                if (profile == null)
                {
                    profile = new TTProfileEntity
                    {
                        DiscordUserId = discordUserId,
                        DisplayName = discordUserId // Default to Discord ID, can be updated later
                    };
                    await _timeTrialRepository.AddTTProfileAsync(profile);
                }

                // Save ghost file
                fileStream.Seek(0, SeekOrigin.Begin);
                var filePath = await _ghostFileService.SaveGhostFileAsync(fileStream, trackId, cc, discordUserId);

                // Create submission entity
                var submission = new GhostSubmissionEntity
                {
                    TrackId = trackId,
                    TTProfileId = profile.Id,
                    CC = cc,
                    FinishTimeMs = parseResult.FinishTimeMs,
                    FinishTimeDisplay = parseResult.FinishTimeDisplay,
                    VehicleId = parseResult.VehicleId,
                    CharacterId = parseResult.CharacterId,
                    ControllerType = parseResult.ControllerType,
                    DriftType = parseResult.DriftType,
                    MiiName = parseResult.MiiName,
                    LapCount = parseResult.LapCount,
                    LapSplitsMs = JsonSerializer.Serialize(parseResult.LapSplitsMs),
                    GhostFilePath = filePath,
                    DateSet = parseResult.DateSet,
                    SubmittedByDiscordId = discordUserId
                };

                await _timeTrialRepository.AddGhostSubmissionAsync(submission);

                // Update profile stats
                profile.TotalSubmissions = await _timeTrialRepository.GetProfileSubmissionsCountAsync(profile.Id);
                profile.CurrentWorldRecords = await _timeTrialRepository.GetProfileWorldRecordsCountAsync(profile.Id);
                await _timeTrialRepository.UpdateTTProfileAsync(profile);

                _logger.LogInformation(
                    "Ghost submission successful: Track {TrackId}, CC {CC}, Time {Time}, User {UserId}",
                    trackId, cc, parseResult.FinishTimeDisplay, discordUserId);

                // Reload submission with navigation properties
                var savedSubmission = await _timeTrialRepository.GetGhostSubmissionByIdAsync(submission.Id);

                return Ok(new GhostSubmissionResponse
                {
                    Success = true,
                    Message = "Ghost submitted successfully",
                    Submission = savedSubmission != null ? MapToDto(savedSubmission) : null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting ghost for track {TrackId}", trackId);
                return StatusCode(500, new GhostSubmissionResponse
                {
                    Success = false,
                    Message = "An error occurred while submitting ghost"
                });
            }
        }

        [HttpDelete("timetrial/ghost/{id}")]
        public async Task<IActionResult> DeleteGhost(int id)
        {
            try
            {
                var submission = await _timeTrialRepository.GetGhostSubmissionByIdAsync(id);
                if (submission == null)
                {
                    return NotFound(new { Error = "Ghost submission not found" });
                }

                // Delete file from disk
                var filePath = _ghostFileService.GetGhostDownloadPath(submission.GhostFilePath);
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }

                // Delete from database
                await _timeTrialRepository.DeleteGhostSubmissionAsync(id);

                _logger.LogWarning("Deleted ghost submission {GhostId} for track {TrackId}", id, submission.TrackId);

                return Ok(new { Success = true, Message = "Ghost submission deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting ghost {GhostId}", id);
                return StatusCode(500, new { Error = "An error occurred while deleting ghost" });
            }
        }

        private static GhostSubmissionDto MapToDto(GhostSubmissionEntity entity)
        {
            return new GhostSubmissionDto
            {
                Id = entity.Id,
                TrackId = entity.TrackId,
                TrackName = entity.Track?.Name ?? "Unknown",
                TTProfileId = entity.TTProfileId,
                PlayerName = entity.TTProfile?.DisplayName ?? "Unknown",
                CC = entity.CC,
                FinishTimeMs = entity.FinishTimeMs,
                FinishTimeDisplay = entity.FinishTimeDisplay,
                VehicleId = entity.VehicleId,
                CharacterId = entity.CharacterId,
                ControllerType = entity.ControllerType,
                DriftType = entity.DriftType,
                MiiName = entity.MiiName,
                LapCount = entity.LapCount,
                LapSplitsMs = JsonSerializer.Deserialize<List<int>>(entity.LapSplitsMs) ?? [],
                GhostFilePath = entity.GhostFilePath,
                DateSet = entity.DateSet,
                SubmittedAt = entity.SubmittedAt
            };
        }
    }
}