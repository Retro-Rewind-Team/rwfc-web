using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Models.DTOs;
using RetroRewindWebsite.Models.Entities;
using RetroRewindWebsite.Repositories;
using RetroRewindWebsite.Services.Domain;
using System.Text.Json;

namespace RetroRewindWebsite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TimeTrialController : ControllerBase
    {
        private readonly ITimeTrialRepository _timeTrialRepository;
        private readonly IGhostFileService _ghostFileService;
        private readonly ILogger<TimeTrialController> _logger;

        public TimeTrialController(
            ITimeTrialRepository timeTrialRepository,
            IGhostFileService ghostFileService,
            ILogger<TimeTrialController> logger)
        {
            _timeTrialRepository = timeTrialRepository;
            _ghostFileService = ghostFileService;
            _logger = logger;
        }

        [HttpGet("tracks")]
        public async Task<ActionResult<List<TrackDto>>> GetAllTracks()
        {
            try
            {
                var tracks = await _timeTrialRepository.GetAllTracksAsync();
                var trackDtos = tracks.Select(t => new TrackDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    TrackSlot = t.TrackSlot,
                    CourseId = t.CourseId,
                    Category = t.Category,
                    Laps = t.Laps
                }).ToList();

                return Ok(trackDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tracks");
                return StatusCode(500, "An error occurred while retrieving tracks");
            }
        }

        [HttpGet("tracks/{id}")]
        public async Task<ActionResult<TrackDto>> GetTrack(int id)
        {
            try
            {
                var track = await _timeTrialRepository.GetTrackByIdAsync(id);
                if (track == null)
                {
                    return NotFound($"Track with ID {id} not found");
                }

                return Ok(new TrackDto
                {
                    Id = track.Id,
                    Name = track.Name,
                    TrackSlot = track.TrackSlot,
                    CourseId = track.CourseId,
                    Category = track.Category,
                    Laps = track.Laps
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting track {TrackId}", id);
                return StatusCode(500, "An error occurred while retrieving track");
            }
        }

        [HttpGet("leaderboard")]
        public async Task<ActionResult<TrackLeaderboardDto>> GetLeaderboard(
            [FromQuery] int trackId,
            [FromQuery] short cc,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                if (cc != 150 && cc != 200)
                {
                    return BadRequest("CC must be either 150 or 200");
                }

                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 10;
                if (pageSize > 100) pageSize = 100;

                var track = await _timeTrialRepository.GetTrackByIdAsync(trackId);
                if (track == null)
                {
                    return NotFound($"Track with ID {trackId} not found");
                }

                var pagedResult = await _timeTrialRepository.GetTrackLeaderboardAsync(trackId, cc, page, pageSize);

                var submissionDtos = pagedResult.Items.Select(s => MapToDto(s)).ToList();

                return Ok(new TrackLeaderboardDto
                {
                    Track = new TrackDto
                    {
                        Id = track.Id,
                        Name = track.Name,
                        TrackSlot = track.TrackSlot,
                        CourseId = track.CourseId,
                        Category = track.Category,
                        Laps = track.Laps
                    },
                    CC = cc,
                    Submissions = submissionDtos,
                    TotalSubmissions = pagedResult.TotalCount,
                    CurrentPage = pagedResult.CurrentPage,
                    PageSize = pagedResult.PageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting leaderboard for track {TrackId} {CC}cc", trackId, cc);
                return StatusCode(500, "An error occurred while retrieving leaderboard");
            }
        }

        [HttpGet("leaderboard/top")]
        public async Task<ActionResult<List<GhostSubmissionDto>>> GetTopTimes(
            [FromQuery] int trackId,
            [FromQuery] short cc,
            [FromQuery] int count = 10)
        {
            try
            {
                if (cc != 150 && cc != 200)
                {
                    return BadRequest("CC must be either 150 or 200");
                }

                if (count < 1) count = 10;
                if (count > 50) count = 50;

                var submissions = await _timeTrialRepository.GetTopTimesForTrackAsync(trackId, cc, count);
                var submissionDtos = submissions.Select(s => MapToDto(s)).ToList();

                return Ok(submissionDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting top times for track {TrackId} {CC}cc", trackId, cc);
                return StatusCode(500, "An error occurred while retrieving top times");
            }
        }

        [HttpGet("worldrecord")]
        public async Task<ActionResult<GhostSubmissionDto>> GetWorldRecord(
            [FromQuery] int trackId,
            [FromQuery] short cc)
        {
            try
            {
                if (cc != 150 && cc != 200)
                {
                    return BadRequest("CC must be either 150 or 200");
                }

                var wr = await _timeTrialRepository.GetWorldRecordAsync(trackId, cc);
                if (wr == null)
                {
                    return NotFound($"No world record found for track {trackId} at {cc}cc");
                }

                return Ok(MapToDto(wr));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting world record for track {TrackId} {CC}cc", trackId, cc);
                return StatusCode(500, "An error occurred while retrieving world record");
            }
        }

        [HttpGet("ghost/{id}/download")]
        public async Task<IActionResult> DownloadGhost(int id)
        {
            try
            {
                var submission = await _timeTrialRepository.GetGhostSubmissionByIdAsync(id);
                if (submission == null)
                {
                    return NotFound("Ghost submission not found");
                }

                var filePath = _ghostFileService.GetGhostDownloadPath(submission.GhostFilePath);
                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogWarning("Ghost file not found on disk: {FilePath}", filePath);
                    return NotFound("Ghost file not found");
                }

                var fileName = $"{submission.Track?.Name ?? "ghost"}_{submission.CC}cc_{submission.FinishTimeDisplay.Replace(":", "-")}.rkg";
                var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);

                return File(fileStream, "application/octet-stream", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading ghost {GhostId}", id);
                return StatusCode(500, "An error occurred while downloading ghost file");
            }
        }

        [HttpGet("profile/{discordUserId}")]
        public async Task<ActionResult<TTProfileDto>> GetProfile(string discordUserId)
        {
            try
            {
                var profile = await _timeTrialRepository.GetTTProfileByDiscordIdAsync(discordUserId);
                if (profile == null)
                {
                    return NotFound($"Profile not found for Discord user {discordUserId}");
                }

                return Ok(new TTProfileDto
                {
                    Id = profile.Id,
                    DiscordUserId = profile.DiscordUserId,
                    DisplayName = profile.DisplayName,
                    TotalSubmissions = profile.TotalSubmissions,
                    CurrentWorldRecords = profile.CurrentWorldRecords
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting profile for Discord user {UserId}", discordUserId);
                return StatusCode(500, "An error occurred while retrieving profile");
            }
        }

        [HttpGet("profile/{discordUserId}/submissions")]
        public async Task<ActionResult<List<GhostSubmissionDto>>> GetProfileSubmissions(
            string discordUserId,
            [FromQuery] int? trackId = null,
            [FromQuery] short? cc = null)
        {
            try
            {
                var profile = await _timeTrialRepository.GetTTProfileByDiscordIdAsync(discordUserId);
                if (profile == null)
                {
                    return NotFound($"Profile not found for Discord user {discordUserId}");
                }

                var submissions = await _timeTrialRepository.GetPlayerSubmissionsAsync(profile.Id, trackId, cc);
                var submissionDtos = submissions.Select(s => MapToDto(s)).ToList();

                return Ok(submissionDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting submissions for Discord user {UserId}", discordUserId);
                return StatusCode(500, "An error occurred while retrieving submissions");
            }
        }

        // Helper method to map entity to DTO
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