using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
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

        // ===== CONSTANTS =====
        private const short CC_150 = 150;
        private const short CC_200 = 200;
        private const int MinTopCount = 1;
        private const int MaxTopCount = 50;
        private const int DefaultTopCount = 10;
        private const int MinPage = 1;
        private const int MinPageSize = 1;
        private const int MaxPageSize = 100;
        private const int DefaultPageSize = 10;

        public TimeTrialController(
            ITimeTrialRepository timeTrialRepository,
            IGhostFileService ghostFileService,
            ILogger<TimeTrialController> logger)
        {
            _timeTrialRepository = timeTrialRepository;
            _ghostFileService = ghostFileService;
            _logger = logger;
        }

        // ===== TRACK ENDPOINTS =====

        /// <summary>
        /// Retrieves all available tracks
        /// </summary>
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
                    CourseId = t.SlotId,
                    Category = t.Category,
                    Laps = t.Laps,
                    SupportsGlitch = t.SupportsGlitch
                }).ToList();

                return Ok(trackDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tracks");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving tracks");
            }
        }

        /// <summary>
        /// Retrieves a specific track by ID
        /// </summary>
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
                    CourseId = track.SlotId,
                    Category = track.Category,
                    Laps = track.Laps,
                    SupportsGlitch = track.SupportsGlitch
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving track {TrackId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving track");
            }
        }

        // ===== LEADERBOARD ENDPOINTS =====

        /// <summary>
        /// Retrieves paginated leaderboard for a specific track and CC
        /// </summary>
        [HttpGet("leaderboard")]
        public async Task<ActionResult<TrackLeaderboardDto>> GetLeaderboard(
            [FromQuery] int trackId,
            [FromQuery] short cc,
            [FromQuery] bool glitch = false,
            [FromQuery] int page = MinPage,
            [FromQuery] int pageSize = DefaultPageSize)
        {
            try
            {
                var ccValidation = ValidateCc(cc);
                if (ccValidation != null) return ccValidation;

                page = Math.Max(MinPage, page);
                pageSize = Math.Clamp(pageSize, MinPageSize, MaxPageSize);

                var track = await _timeTrialRepository.GetTrackByIdAsync(trackId);
                if (track == null)
                {
                    return NotFound($"Track with ID {trackId} not found");
                }

                var pagedResult = await _timeTrialRepository.GetTrackLeaderboardAsync(
                    trackId, cc, glitch, page, pageSize);

                var flapMs = await _timeTrialRepository.GetFastestLapForTrackAsync(trackId, cc, glitch);
                var submissionDtos = pagedResult.Items.Select(MapToDto).ToList();

                return Ok(new TrackLeaderboardDto
                {
                    Track = new TrackDto
                    {
                        Id = track.Id,
                        Name = track.Name,
                        TrackSlot = track.TrackSlot,
                        CourseId = track.SlotId,
                        Category = track.Category,
                        Laps = track.Laps,
                        SupportsGlitch = track.SupportsGlitch
                    },
                    CC = cc,
                    Glitch = glitch,
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
                _logger.LogError(ex, "Error retrieving leaderboard for track {TrackId} {CC}cc",
                    trackId, cc);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving leaderboard");
            }
        }

        /// <summary>
        /// Retrieves top N times for a specific track and CC
        /// </summary>
        [HttpGet("leaderboard/top")]
        public async Task<ActionResult<List<GhostSubmissionDto>>> GetTopTimes(
            [FromQuery] int trackId,
            [FromQuery] short cc,
            [FromQuery] bool glitch = false,
            [FromQuery] int count = DefaultTopCount)
        {
            try
            {
                var ccValidation = ValidateCc(cc);
                if (ccValidation != null) return ccValidation;

                count = Math.Clamp(count, MinTopCount, MaxTopCount);

                var submissions = await _timeTrialRepository.GetTopTimesForTrackAsync(
                    trackId, cc, glitch, count);
                var submissionDtos = submissions.Select(MapToDto).ToList();

                return Ok(submissionDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving top times for track {TrackId} {CC}cc",
                    trackId, cc);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving top times");
            }
        }

        // ===== WORLD RECORD ENDPOINTS =====

        /// <summary>
        /// Retrieves the current world record for a specific track and CC
        /// </summary>
        [HttpGet("worldrecord")]
        public async Task<ActionResult<GhostSubmissionDto>> GetWorldRecord(
            [FromQuery] int trackId,
            [FromQuery] short cc,
            [FromQuery] bool glitch = false)
        {
            try
            {
                var ccValidation = ValidateCc(cc);
                if (ccValidation != null) return ccValidation;

                var wr = await _timeTrialRepository.GetWorldRecordAsync(trackId, cc, glitch);
                if (wr == null)
                {
                    var category = glitch ? "glitch" : "no glitch";
                    return NotFound($"No world record found for track {trackId} at {cc}cc ({category})");
                }

                return Ok(MapToDto(wr));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving world record for track {TrackId} {CC}cc",
                    trackId, cc);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving world record");
            }
        }

        /// <summary>
        /// Retrieves world record history for a specific track and CC
        /// </summary>
        [HttpGet("worldrecord/history")]
        public async Task<ActionResult<List<GhostSubmissionDto>>> GetWorldRecordHistory(
            [FromQuery] int trackId,
            [FromQuery] short cc,
            [FromQuery] bool glitch = false)
        {
            try
            {
                var ccValidation = ValidateCc(cc);
                if (ccValidation != null) return ccValidation;

                var wrHistory = await _timeTrialRepository.GetWorldRecordHistoryAsync(trackId, cc, glitch);
                var historyDtos = wrHistory.Select(MapToDto).ToList();

                return Ok(historyDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving WR history for track {TrackId} {CC}cc",
                    trackId, cc);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving world record history");
            }
        }

        /// <summary>
        /// Retrieves all world records across all tracks (glitch and no-glitch)
        /// </summary>
        [HttpGet("worldrecords/all")]
        public async Task<ActionResult<List<TrackWorldRecordsDto>>> GetAllWorldRecords()
        {
            try
            {
                var tracks = await _timeTrialRepository.GetAllTracksAsync();
                var results = new List<TrackWorldRecordsDto>();

                foreach (var track in tracks)
                {
                    var wr150NoGlitch = await _timeTrialRepository.GetWorldRecordAsync(track.Id, CC_150, false);
                    var wr200NoGlitch = await _timeTrialRepository.GetWorldRecordAsync(track.Id, CC_200, false);

                    // Only get glitch WRs for tracks that support it
                    GhostSubmissionEntity? wr150Glitch = null;
                    GhostSubmissionEntity? wr200Glitch = null;
                    if (track.SupportsGlitch)
                    {
                        wr150Glitch = await _timeTrialRepository.GetWorldRecordAsync(track.Id, CC_150, true);
                        wr200Glitch = await _timeTrialRepository.GetWorldRecordAsync(track.Id, CC_200, true);
                    }

                    results.Add(new TrackWorldRecordsDto
                    {
                        TrackId = track.Id,
                        TrackName = track.Name,
                        WorldRecord150 = wr150NoGlitch != null ? MapToDto(wr150NoGlitch) : null,
                        WorldRecord200 = wr200NoGlitch != null ? MapToDto(wr200NoGlitch) : null,
                        WorldRecord150Glitch = wr150Glitch != null ? MapToDto(wr150Glitch) : null,
                        WorldRecord200Glitch = wr200Glitch != null ? MapToDto(wr200Glitch) : null
                    });
                }

                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all world records");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving world records");
            }
        }

        // ===== GHOST DOWNLOAD ENDPOINTS =====

        /// <summary>
        /// Downloads a ghost file by submission ID
        /// </summary>
        [HttpGet("ghost/{id}/download")]
        [EnableRateLimiting("GhostDownloadPolicy")]
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
                    _logger.LogWarning("Ghost file not found on disk: {FilePath}",
                        submission.GhostFilePath);
                    return NotFound("Ghost file not found");
                }

                var fileName = CreateGhostFileName(submission.FinishTimeDisplay);
                var fileStream = new FileStream(submission.GhostFilePath,
                    FileMode.Open, FileAccess.Read);

                return File(fileStream, "application/octet-stream", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading ghost {GhostId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while downloading ghost file");
            }
        }

        // ===== PROFILE ENDPOINTS =====

        /// <summary>
        /// Retrieves a Time Trial profile by ID
        /// </summary>
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
                _logger.LogError(ex, "Error retrieving profile {ProfileId}", ttProfileId);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving profile");
            }
        }

        /// <summary>
        /// Retrieves all submissions for a specific profile
        /// </summary>
        [HttpGet("profile/{ttProfileId}/submissions")]
        public async Task<ActionResult<List<GhostSubmissionDto>>> GetProfileSubmissions(
            int ttProfileId,
            [FromQuery] int? trackId = null,
            [FromQuery] short? cc = null)
        {
            try
            {
                if (cc.HasValue)
                {
                    var ccValidation = ValidateCc(cc.Value);
                    if (ccValidation != null) return ccValidation;
                }

                var profile = await _timeTrialRepository.GetTTProfileByIdAsync(ttProfileId);
                if (profile == null)
                {
                    return NotFound($"Profile not found for ID {ttProfileId}");
                }

                var submissions = await _timeTrialRepository.GetPlayerSubmissionsAsync(
                    profile.Id, trackId, cc);
                var submissionDtos = submissions.Select(MapToDto).ToList();

                return Ok(submissionDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving submissions for profile {ProfileId}",
                    ttProfileId);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving submissions");
            }
        }

        /// <summary>
        /// Retrieves statistics for a specific profile
        /// </summary>
        [HttpGet("profile/{ttProfileId}/stats")]
        public async Task<ActionResult<TTPlayerStats>> GetPlayerStats(int ttProfileId)
        {
            try
            {
                var profile = await _timeTrialRepository.GetTTProfileByIdAsync(ttProfileId);
                if (profile == null)
                {
                    return NotFound($"Profile not found for ID {ttProfileId}");
                }

                var submissions = await _timeTrialRepository.GetPlayerSubmissionsAsync(profile.Id);

                var stats = new TTPlayerStats
                {
                    Profile = new TTProfileDto
                    {
                        Id = profile.Id,
                        DisplayName = profile.DisplayName,
                        TotalSubmissions = profile.TotalSubmissions,
                        CurrentWorldRecords = profile.CurrentWorldRecords,
                        CountryCode = profile.CountryCode,
                        CountryAlpha2 = CountryCodeHelper.GetAlpha2Code(profile.CountryCode),
                        CountryName = CountryCodeHelper.GetCountryName(profile.CountryCode)
                    },
                    TotalTracks = submissions.Select(s => s.TrackId).Distinct().Count(),
                    Tracks150cc = submissions.Where(s => s.CC == CC_150)
                        .Select(s => s.TrackId).Distinct().Count(),
                    Tracks200cc = submissions.Where(s => s.CC == CC_200)
                        .Select(s => s.TrackId).Distinct().Count(),
                    AverageFinishPosition = await _timeTrialRepository
                        .CalculateAverageFinishPositionAsync(profile.Id),
                    Top10Count = await _timeTrialRepository.CountTop10FinishesAsync(profile.Id),
                    RecentSubmissions = [.. submissions
                        .OrderByDescending(s => s.SubmittedAt)
                        .Take(5)
                        .Select(MapToDto)]
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving stats for profile {ProfileId}", ttProfileId);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving player stats");
            }
        }

        // ===== HELPER METHODS =====

        private BadRequestObjectResult? ValidateCc(short cc)
        {
            if (cc != CC_150 && cc != CC_200)
            {
                return BadRequest($"CC must be either {CC_150} or {CC_200}");
            }
            return null;
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
                FastestLapDisplay = lapSplitsMs.Count > 0
                    ? FormatLapTime(GetFastestLap(lapSplitsMs))
                    : string.Empty,
                GhostFilePath = entity.GhostFilePath,
                DateSet = entity.DateSet,
                SubmittedAt = entity.SubmittedAt,
                Shroomless = entity.Shroomless,
                Glitch = entity.Glitch,
                DriftCategory = entity.DriftCategory,
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
            return [.. lapSplitsMs.Select(FormatLapTime)];
        }

        private static int GetFastestLap(List<int> lapSplitsMs)
        {
            return lapSplitsMs.DefaultIfEmpty(0).Min();
        }

        private static string CreateGhostFileName(string finishTimeDisplay)
        {
            // Convert "1:51.891" to "1m51s891.rkg"
            return $"{finishTimeDisplay.Replace(":", "m").Replace(".", "s")}.rkg";
        }
    }
}