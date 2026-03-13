using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using RetroRewindWebsite.Helpers;
using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.DTOs.TimeTrial;
using RetroRewindWebsite.Models.Entities.TimeTrial;
using RetroRewindWebsite.Repositories.TimeTrial;
using RetroRewindWebsite.Services.Domain;

namespace RetroRewindWebsite.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TimeTrialController : ControllerBase
{
    private readonly ITrackRepository _trackRepository;
    private readonly ITTProfileRepository _ttProfileRepository;
    private readonly IGhostSubmissionRepository _ghostSubmissionRepository;
    private readonly IGhostFileService _ghostFileService;
    private readonly ILogger<TimeTrialController> _logger;

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
        ITrackRepository trackRepository,
        ITTProfileRepository ttProfileRepository,
        IGhostSubmissionRepository ghostSubmissionRepository,
        IGhostFileService ghostFileService,
        ILogger<TimeTrialController> logger)
    {
        _trackRepository = trackRepository;
        _ttProfileRepository = ttProfileRepository;
        _ghostSubmissionRepository = ghostSubmissionRepository;
        _ghostFileService = ghostFileService;
        _logger = logger;
    }

    // ===== TRACK ENDPOINTS =====

    [HttpGet("tracks")]
    public async Task<ActionResult<List<TrackDto>>> GetAllTracks()
    {
        try
        {
            var tracks = await _trackRepository.GetAllTracksAsync();
            return Ok(tracks.Select(MapToTrackDto).ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving tracks");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving tracks");
        }
    }

    [HttpGet("tracks/{id}")]
    public async Task<ActionResult<TrackDto>> GetTrack(int id)
    {
        try
        {
            var track = await _trackRepository.GetByIdAsync(id);
            if (track == null)
                return NotFound($"Track with ID {id} not found");

            return Ok(MapToTrackDto(track));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving track {TrackId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving track");
        }
    }

    // ===== LEADERBOARD ENDPOINTS =====

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

            var track = await _trackRepository.GetByIdAsync(trackId);
            if (track == null)
                return NotFound($"Track with ID {trackId} not found");

            var pagedResult = await _ghostSubmissionRepository.GetTrackLeaderboardAsync(
                trackId, cc, glitch, page, pageSize);
            var flapMs = await _ghostSubmissionRepository.GetFastestLapForTrackAsync(
                trackId, cc, glitch);

            return Ok(new TrackLeaderboardDto(
                MapToTrackDto(track),
                cc,
                glitch,
                pagedResult.Items.Select(GhostSubmissionMapper.ToDto).ToList<GhostSubmissionDto>(),
                pagedResult.TotalCount,
                pagedResult.CurrentPage,
                pagedResult.PageSize,
                flapMs,
                flapMs.HasValue ? GhostSubmissionMapper.FormatLapTime(flapMs.Value) : null
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving leaderboard for track {TrackId} {CC}cc",
                trackId, cc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving leaderboard");
        }
    }

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

            var submissions = await _ghostSubmissionRepository.GetTopTimesForTrackAsync(
                trackId, cc, glitch, count);

            return Ok(submissions.Select(GhostSubmissionMapper.ToDto).ToList<GhostSubmissionDto>());
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

            var wr = await _ghostSubmissionRepository.GetWorldRecordAsync(trackId, cc, glitch);
            if (wr == null)
            {
                var category = glitch ? "glitch" : "no glitch";
                return NotFound($"No world record found for track {trackId} at {cc}cc ({category})");
            }

            return Ok(GhostSubmissionMapper.ToDto(wr));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving world record for track {TrackId} {CC}cc",
                trackId, cc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving world record");
        }
    }

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

            var wrHistory = await _ghostSubmissionRepository.GetWorldRecordHistoryAsync(
                trackId, cc, glitch);

            return Ok(wrHistory.Select(GhostSubmissionMapper.ToDto).ToList<GhostSubmissionDto>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving WR history for track {TrackId} {CC}cc",
                trackId, cc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving world record history");
        }
    }

    [HttpGet("worldrecords/all")]
    public async Task<ActionResult<List<TrackWorldRecordsDto>>> GetAllWorldRecords()
    {
        try
        {
            var tracks = await _trackRepository.GetAllTracksAsync();
            var results = new List<TrackWorldRecordsDto>();

            // TODO: Replace with a single query fetching all WRs at once (currently N×4 DB calls)
            foreach (var track in tracks)
            {
                var wr150 = await _ghostSubmissionRepository.GetWorldRecordAsync(track.Id, CC_150, false);
                var wr200 = await _ghostSubmissionRepository.GetWorldRecordAsync(track.Id, CC_200, false);

                GhostSubmissionEntity? wr150Glitch = null;
                GhostSubmissionEntity? wr200Glitch = null;
                if (track.SupportsGlitch)
                {
                    wr150Glitch = await _ghostSubmissionRepository.GetWorldRecordAsync(track.Id, CC_150, true);
                    wr200Glitch = await _ghostSubmissionRepository.GetWorldRecordAsync(track.Id, CC_200, true);
                }

                results.Add(new TrackWorldRecordsDto(
                    track.Id,
                    track.Name,
                    wr150 != null ? GhostSubmissionMapper.ToDto(wr150) : null,
                    wr200 != null ? GhostSubmissionMapper.ToDto(wr200) : null,
                    wr150Glitch != null ? GhostSubmissionMapper.ToDto(wr150Glitch) : null,
                    wr200Glitch != null ? GhostSubmissionMapper.ToDto(wr200Glitch) : null
                ));
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

    [HttpGet("ghost/{id}/download")]
    [EnableRateLimiting("GhostDownloadPolicy")]
    public async Task<IActionResult> DownloadGhost(int id)
    {
        try
        {
            var submission = await _ghostSubmissionRepository.GetByIdAsync(id);
            if (submission == null)
                return NotFound("Ghost submission not found");

            if (!System.IO.File.Exists(submission.GhostFilePath))
            {
                _logger.LogWarning("Ghost file not found on disk: {FilePath}",
                    submission.GhostFilePath);
                return NotFound("Ghost file not found");
            }

            var fileName = CreateGhostFileName(submission.FinishTimeDisplay);
            var fileStream = new FileStream(
                submission.GhostFilePath, FileMode.Open, FileAccess.Read);

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

    [HttpGet("profile/{ttProfileId}")]
    public async Task<ActionResult<TTProfileDto>> GetProfile(int ttProfileId)
    {
        try
        {
            var profile = await _ttProfileRepository.GetByIdAsync(ttProfileId);
            if (profile == null)
                return NotFound($"Profile not found for ID {ttProfileId}");

            return Ok(MapToTTProfileDto(profile));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving profile {ProfileId}", ttProfileId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving profile");
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
            if (cc.HasValue)
            {
                var ccValidation = ValidateCc(cc.Value);
                if (ccValidation != null) return ccValidation;
            }

            var profile = await _ttProfileRepository.GetByIdAsync(ttProfileId);
            if (profile == null)
                return NotFound($"Profile not found for ID {ttProfileId}");

            var submissions = await _ghostSubmissionRepository.GetPlayerSubmissionsAsync(
                profile.Id, trackId, cc);

            return Ok(submissions.Select(GhostSubmissionMapper.ToDto).ToList<GhostSubmissionDto>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving submissions for profile {ProfileId}",
                ttProfileId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving submissions");
        }
    }

    [HttpGet("profile/{ttProfileId}/stats")]
    public async Task<ActionResult<TTPlayerStatsDto>> GetPlayerStats(int ttProfileId)
    {
        try
        {
            var profile = await _ttProfileRepository.GetByIdAsync(ttProfileId);
            if (profile == null)
                return NotFound($"Profile not found for ID {ttProfileId}");

            var submissions = await _ghostSubmissionRepository.GetPlayerSubmissionsAsync(profile.Id);

            return Ok(new TTPlayerStatsDto(
                MapToTTProfileDto(profile),
                submissions.Select(s => s.TrackId).Distinct().Count(),
                submissions.Where(s => s.CC == CC_150).Select(s => s.TrackId).Distinct().Count(),
                submissions.Where(s => s.CC == CC_200).Select(s => s.TrackId).Distinct().Count(),
                await _ghostSubmissionRepository.CalculateAverageFinishPositionAsync(profile.Id),
                await _ghostSubmissionRepository.CountTop10FinishesAsync(profile.Id),
                submissions
                    .OrderByDescending(s => s.SubmittedAt)
                    .Take(5)
                    .Select(GhostSubmissionMapper.ToDto)
                    .ToList<GhostSubmissionDto>()
            ));
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
            return BadRequest($"CC must be either {CC_150} or {CC_200}");

        return null;
    }

    private static TrackDto MapToTrackDto(TrackEntity track) => new(
        track.Id,
        track.Name,
        track.TrackSlot,
        track.SlotId,
        track.Category,
        track.Laps,
        track.SupportsGlitch,
        track.SortOrder
    );

    private static TTProfileDto MapToTTProfileDto(TTProfileEntity profile) => new(
        profile.Id,
        profile.DisplayName,
        profile.TotalSubmissions,
        profile.CurrentWorldRecords,
        profile.CountryCode,
        CountryCodeHelper.GetAlpha2Code(profile.CountryCode),
        CountryCodeHelper.GetCountryName(profile.CountryCode)
    );

    private static string CreateGhostFileName(string finishTimeDisplay)
        => $"{finishTimeDisplay.Replace(":", "m").Replace(".", "s")}.rkg";
}
