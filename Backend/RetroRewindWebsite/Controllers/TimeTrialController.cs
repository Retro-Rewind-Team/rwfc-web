using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Helpers;
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

                // Get FLAP for this track/CC
                var flapMs = await _timeTrialRepository.GetFastestLapForTrackAsync(trackId, cc);

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
                    PageSize = pagedResult.PageSize,
                    FastestLapMs = flapMs,
                    FastestLapDisplay = flapMs.HasValue ? FormatLapTime(flapMs.Value) : null
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

                if (!System.IO.File.Exists(submission.GhostFilePath))
                {
                    _logger.LogWarning("Ghost file not found on disk: {FilePath}", submission.GhostFilePath);
                    return NotFound("Ghost file not found");
                }

                // Convert "1:51.891" to "1m51s891.rkg"
                var fileName = submission.FinishTimeDisplay
                    .Replace(":", "m")
                    .Replace(".", "s") + ".rkg";

                var fileStream = new FileStream(submission.GhostFilePath, FileMode.Open, FileAccess.Read);

                return File(fileStream, "application/octet-stream", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading ghost {GhostId}", id);
                return StatusCode(500, "An error occurred while downloading ghost file");
            }
        }

        [HttpGet("profile/{ttProfileId}")]
        public async Task<ActionResult<TTProfileDto>> GetProfile(int ttProfileId)
        {
            try
            {
                var profile = await _timeTrialRepository.GetTTProfileByIdAsync(ttProfileId);
                if (profile == null)
                {
                    return NotFound($"Profile not found for ID {ttProfileId}");
                }

                return Ok(new TTProfileDto
                {
                    Id = profile.Id,
                    DisplayName = profile.DisplayName,
                    TotalSubmissions = profile.TotalSubmissions,
                    CurrentWorldRecords = profile.CurrentWorldRecords,
                    CountryCode = profile.CountryCode,
                    CountryAlpha2 = CountryCodeHelper.GetAlpha2Code(profile.CountryCode),
                    CountryName = CountryCodeHelper.GetCountryName(profile.CountryCode)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting profile {ProfileId}", ttProfileId);
                return StatusCode(500, "An error occurred while retrieving profile");
            }
        }

        [HttpGet("profile/{ttProfileId}/submissions")]
        public async Task<ActionResult<List<GhostSubmissionDto>>> GetProfileSubmissions(
            int ttProfileId,
            [FromQuery] int? trackId = null,
            [FromQuery] short? cc = null)
        {
            try
            {
                var profile = await _timeTrialRepository.GetTTProfileByIdAsync(ttProfileId);
                if (profile == null)
                {
                    return NotFound($"Profile not found for ID {ttProfileId}");
                }

                var submissions = await _timeTrialRepository.GetPlayerSubmissionsAsync(profile.Id, trackId, cc);
                var submissionDtos = submissions.Select(s => MapToDto(s)).ToList();

                return Ok(submissionDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting submissions for profile {ProfileId}", ttProfileId);
                return StatusCode(500, "An error occurred while retrieving submissions");
            }
        }

        [HttpGet("worldrecord/history")]
        public async Task<ActionResult<List<GhostSubmissionDto>>> GetWorldRecordHistory(
        [FromQuery] int trackId,
        [FromQuery] short cc)
        {
            try
            {
                if (cc != 150 && cc != 200)
                {
                    return BadRequest("CC must be either 150 or 200");
                }

                var wrHistory = await _timeTrialRepository.GetWorldRecordHistoryAsync(trackId, cc);
                var historyDtos = wrHistory.Select(s => MapToDto(s)).ToList();

                return Ok(historyDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting WR history for track {TrackId} {CC}cc", trackId, cc);
                return StatusCode(500, "An error occurred while retrieving world record history");
            }
        }

        [HttpGet("profile/{ttProfileId}/stats")]
        public async Task<ActionResult> GetPlayerStats(int ttProfileId)
        {
            try
            {
                var profile = await _timeTrialRepository.GetTTProfileByIdAsync(ttProfileId);
                if (profile == null)
                {
                    return NotFound($"Profile not found for ID {ttProfileId}");
                }

                var submissions = await _timeTrialRepository.GetPlayerSubmissionsAsync(profile.Id);

                var stats = new
                {
                    Profile = new
                    {
                        profile.Id,
                        profile.DisplayName,
                        profile.TotalSubmissions,
                        profile.CurrentWorldRecords,
                        profile.CountryCode
                    },
                    TotalTracks = submissions.Select(s => s.TrackId).Distinct().Count(),
                    Tracks150cc = submissions.Where(s => s.CC == 150).Select(s => s.TrackId).Distinct().Count(),
                    Tracks200cc = submissions.Where(s => s.CC == 200).Select(s => s.TrackId).Distinct().Count(),
                    AverageFinishPosition = await _timeTrialRepository.CalculateAverageFinishPositionAsync(profile.Id),
                    Top10Count = await _timeTrialRepository.CountTop10FinishesAsync(profile.Id),
                    RecentSubmissions = submissions.OrderByDescending(s => s.SubmittedAt).Take(5).Select(s => MapToDto(s)).ToList()
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting stats for profile {ProfileId}", ttProfileId);
                return StatusCode(500, "An error occurred while retrieving player stats");
            }
        }

        private GhostSubmissionDto MapToDto(GhostSubmissionEntity entity)
        {
            var lapSplitsMs = JsonSerializer.Deserialize<List<int>>(entity.LapSplitsMs) ?? [];

            return new GhostSubmissionDto
            {
                Id = entity.Id,
                TrackId = entity.TrackId,
                TrackName = entity.Track?.Name ?? "Unknown",
                TTProfileId = entity.TTProfileId,
                PlayerName = entity.TTProfile?.DisplayName ?? "Unknown",
                CountryCode = entity.TTProfile?.CountryCode ?? 0,
                CountryAlpha2 = entity.TTProfile?.CountryCode != null
                    ? CountryCodeHelper.GetAlpha2Code(entity.TTProfile.CountryCode)
                    : null,
                CountryName = entity.TTProfile?.CountryCode != null
                    ? CountryCodeHelper.GetCountryName(entity.TTProfile.CountryCode)
                    : null,
                CC = entity.CC,
                FinishTimeMs = entity.FinishTimeMs,
                FinishTimeDisplay = entity.FinishTimeDisplay,
                VehicleId = entity.VehicleId,
                CharacterId = entity.CharacterId,
                ControllerType = entity.ControllerType,
                DriftType = entity.DriftType,
                MiiName = entity.MiiName,
                LapCount = entity.LapCount,
                LapSplitsMs = lapSplitsMs,
                LapSplitsDisplay = FormatLapSplits(lapSplitsMs),
                FastestLapMs = GetFastestLap(lapSplitsMs),
                FastestLapDisplay = lapSplitsMs.Count > 0 ? FormatLapTime(GetFastestLap(lapSplitsMs)) : "",
                GhostFilePath = entity.GhostFilePath,
                DateSet = entity.DateSet,
                SubmittedAt = entity.SubmittedAt,
                Shroomless = entity.Shroomless,
                Glitch = entity.Glitch,
            };
        }

        private static string FormatLapTime(int milliseconds)
        {
            var totalSeconds = milliseconds / 1000.0;
            var minutes = (int)(totalSeconds / 60);
            var seconds = totalSeconds % 60;

            return $"{minutes}:{seconds:00.000}";
        }

        private static List<string> FormatLapSplits(List<int> lapSplitsMs)
        {
            return lapSplitsMs.Select(ms => FormatLapTime(ms)).ToList();
        }

        private static int GetFastestLap(List<int> lapSplitsMs)
        {
            return lapSplitsMs.Count > 0 ? lapSplitsMs.Min() : 0;
        }
    }
}