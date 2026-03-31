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
        [FromQuery] bool glitchAllowed = true,
        [FromQuery] string? shroomless = null,
        [FromQuery] string? vehicle = null,
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

            var (shroomlessFilter, vehicleMin, vehicleMax) = ParseCategoryFilters(shroomless, vehicle);

            var pagedResult = await _ghostSubmissionRepository.GetTrackLeaderboardAsync(
                trackId, cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax, page, pageSize);

            var flapMs = await _ghostSubmissionRepository.GetFastestLapForTrackAsync(
                trackId, cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax);

            var pageOffset = (page - 1) * pageSize;
            var submissions = GhostSubmissionMapper.ToLeaderboardDtos(pagedResult.Items, pageOffset);

            return Ok(new TrackLeaderboardDto(
                MapToTrackDto(track),
                cc,
                glitchAllowed,
                shroomlessFilter,
                vehicle,
                IsFlap: false,
                [.. submissions.Cast<GhostSubmissionDto>()],
                pagedResult.TotalCount,
                pagedResult.CurrentPage,
                pagedResult.PageSize,
                pagedResult.TotalPages,
                flapMs,
                flapMs.HasValue ? GhostSubmissionMapper.FormatLapTime(flapMs.Value) : null
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving leaderboard for track {TrackId} {CC}cc", trackId, cc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving leaderboard");
        }
    }

    [HttpGet("leaderboard/flap")]
    public async Task<ActionResult<TrackLeaderboardDto>> GetFlapLeaderboard(
        [FromQuery] int trackId,
        [FromQuery] short cc,
        [FromQuery] bool glitchAllowed = true,
        [FromQuery] string? shroomless = null,
        [FromQuery] string? vehicle = null,
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

            var (shroomlessFilter, vehicleMin, vehicleMax) = ParseCategoryFilters(shroomless, vehicle);

            var pagedResult = await _ghostSubmissionRepository.GetFlapLeaderboardAsync(
                trackId, cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax, page, pageSize);

            var pageOffset = (page - 1) * pageSize;
            var submissions = GhostSubmissionMapper.ToFlapLeaderboardDtos(pagedResult.Items, pageOffset);

            // FLAP for flap leaderboard is just the fastest lap among flap submissions
            var flapMs = submissions.Count > 0
                ? submissions.Min(s => s.FastestLapMs)
                : (int?)null;

            return Ok(new TrackLeaderboardDto(
                MapToTrackDto(track),
                cc,
                glitchAllowed,
                shroomlessFilter,
                vehicle,
                IsFlap: true,
                [.. submissions.Cast<GhostSubmissionDto>()],
                pagedResult.TotalCount,
                pagedResult.CurrentPage,
                pagedResult.PageSize,
                pagedResult.TotalPages,
                flapMs,
                flapMs.HasValue ? GhostSubmissionMapper.FormatLapTime(flapMs.Value) : null
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving flap leaderboard for track {TrackId} {CC}cc", trackId, cc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving flap leaderboard");
        }
    }

    [HttpGet("leaderboard/top")]
    public async Task<ActionResult<List<GhostSubmissionDto>>> GetTopTimes(
        [FromQuery] int trackId,
        [FromQuery] short cc,
        [FromQuery] bool glitchAllowed = true,
        [FromQuery] string? shroomless = null,
        [FromQuery] string? vehicle = null,
        [FromQuery] int count = DefaultTopCount)
    {
        try
        {
            var ccValidation = ValidateCc(cc);
            if (ccValidation != null) return ccValidation;

            count = Math.Clamp(count, MinTopCount, MaxTopCount);

            var (shroomlessFilter, vehicleMin, vehicleMax) = ParseCategoryFilters(shroomless, vehicle);

            var submissions = await _ghostSubmissionRepository.GetTopTimesForTrackAsync(
                trackId, cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax, count);

            var dtos = GhostSubmissionMapper.ToLeaderboardDtos(submissions, 0);
            return Ok(dtos.Cast<GhostSubmissionDto>().ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving top times for track {TrackId} {CC}cc", trackId, cc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving top times");
        }
    }

    // ===== WORLD RECORD ENDPOINTS =====

    [HttpGet("worldrecord")]
    public async Task<ActionResult<GhostSubmissionDto>> GetWorldRecord(
        [FromQuery] int trackId,
        [FromQuery] short cc,
        [FromQuery] bool glitchAllowed = true,
        [FromQuery] string? shroomless = null,
        [FromQuery] string? vehicle = null)
    {
        try
        {
            var ccValidation = ValidateCc(cc);
            if (ccValidation != null) return ccValidation;

            var (shroomlessFilter, vehicleMin, vehicleMax) = ParseCategoryFilters(shroomless, vehicle);

            var wr = await _ghostSubmissionRepository.GetWorldRecordAsync(
                trackId, cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax);

            if (wr == null)
                return NotFound($"No world record found for track {trackId} at {cc}cc");

            return Ok(GhostSubmissionMapper.ToDto(wr, rank: 1));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving world record for track {TrackId} {CC}cc", trackId, cc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving world record");
        }
    }

    [HttpGet("worldrecord/history")]
    public async Task<ActionResult<List<GhostSubmissionDto>>> GetWorldRecordHistory(
        [FromQuery] int trackId,
        [FromQuery] short cc,
        [FromQuery] bool glitchAllowed = true,
        [FromQuery] string? shroomless = null,
        [FromQuery] string? vehicle = null)
    {
        try
        {
            var ccValidation = ValidateCc(cc);
            if (ccValidation != null) return ccValidation;

            var (shroomlessFilter, vehicleMin, vehicleMax) = ParseCategoryFilters(shroomless, vehicle);

            var wrHistory = await _ghostSubmissionRepository.GetWorldRecordHistoryAsync(
                trackId, cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax);

            return Ok(wrHistory.Select(g => GhostSubmissionMapper.ToDto(g)).ToList<GhostSubmissionDto>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving WR history for track {TrackId} {CC}cc", trackId, cc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving world record history");
        }
    }

    [HttpGet("worldrecord/history/flap")]
    public async Task<ActionResult<List<GhostSubmissionDto>>> GetFlapWorldRecordHistory(
        [FromQuery] int trackId,
        [FromQuery] short cc,
        [FromQuery] bool glitchAllowed = true,
        [FromQuery] string? shroomless = null,
        [FromQuery] string? vehicle = null)
    {
        try
        {
            var ccValidation = ValidateCc(cc);
            if (ccValidation != null) return ccValidation;

            var (shroomlessFilter, vehicleMin, vehicleMax) = ParseCategoryFilters(shroomless, vehicle);

            var history = await _ghostSubmissionRepository.GetFlapWorldRecordHistoryAsync(
                trackId, cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax);

            return Ok(history.Select(g => GhostSubmissionMapper.ToDto(g)).ToList<GhostSubmissionDto>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving flap WR history for track {TrackId} {CC}cc", trackId, cc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving flap world record history");
        }
    }

    [HttpGet("worldrecords/all")]
    public async Task<ActionResult<List<TrackWorldRecordsDto>>> GetAllWorldRecords(
        [FromQuery] short cc,
        [FromQuery] bool glitchAllowed = true,
        [FromQuery] string? shroomless = null,
        [FromQuery] string? vehicle = null)
    {
        try
        {
            var ccValidation = ValidateCc(cc);
            if (ccValidation != null) return ccValidation;

            var (shroomlessFilter, vehicleMin, vehicleMax) = ParseCategoryFilters(shroomless, vehicle);

            var tracks = await _trackRepository.GetAllTracksAsync();
            var results = new List<TrackWorldRecordsDto>();

            // TODO: Replace with a single query fetching all WRs at once (currently N DB calls)
            foreach (var track in tracks)
            {
                var wr = await _ghostSubmissionRepository.GetWorldRecordAsync(
                    track.Id, cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax);

                results.Add(new TrackWorldRecordsDto(
                    track.Id,
                    track.Name,
                    wr != null ? GhostSubmissionMapper.ToDto(wr, rank: 1) : null
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

    // ===== FLAP ENDPOINT =====

    [HttpGet("flap")]
    public async Task<ActionResult<FlapDto>> GetFastestLap(
        [FromQuery] int trackId,
        [FromQuery] short cc,
        [FromQuery] bool glitchAllowed = true,
        [FromQuery] string? shroomless = null,
        [FromQuery] string? vehicle = null)
    {
        try
        {
            var ccValidation = ValidateCc(cc);
            if (ccValidation != null) return ccValidation;

            var track = await _trackRepository.GetByIdAsync(trackId);
            if (track == null)
                return NotFound($"Track with ID {trackId} not found");

            var (shroomlessFilter, vehicleMin, vehicleMax) = ParseCategoryFilters(shroomless, vehicle);

            var flapMs = await _ghostSubmissionRepository.GetFastestLapForTrackAsync(
                trackId, cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax);

            if (flapMs == null)
                return NotFound("No lap times found for the specified category");

            return Ok(new FlapDto(
                flapMs.Value,
                GhostSubmissionMapper.FormatLapTime(flapMs.Value)
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving FLAP for track {TrackId} {CC}cc", trackId, cc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving fastest lap");
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
                _logger.LogWarning("Ghost file not found on disk: {FilePath}", submission.GhostFilePath);
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
    public async Task<ActionResult<PagedSubmissionsDto>> GetProfileSubmissions(
        int ttProfileId,
        [FromQuery] int? trackId = null,
        [FromQuery] short? cc = null,
        [FromQuery] bool? glitch = null,
        [FromQuery] string? shroomless = null,
        [FromQuery] string? vehicle = null,
        [FromQuery] int page = MinPage,
        [FromQuery] int pageSize = DefaultPageSize)
    {
        try
        {
            if (cc.HasValue)
            {
                var ccValidation = ValidateCc(cc.Value);
                if (ccValidation != null) return ccValidation;
            }

            page = Math.Max(MinPage, page);
            pageSize = Math.Clamp(pageSize, MinPageSize, MaxPageSize);

            var profile = await _ttProfileRepository.GetByIdAsync(ttProfileId);
            if (profile == null)
                return NotFound($"Profile not found for ID {ttProfileId}");

            var (shroomlessFilter, vehicleMin, vehicleMax) = ParseCategoryFilters(shroomless, vehicle);

            var pagedResult = await _ghostSubmissionRepository.GetPlayerSubmissionsAsync(
                profile.Id, page, pageSize, trackId, cc, glitch, shroomlessFilter, vehicleMin, vehicleMax);

            var submissions = pagedResult.Items
                .Select(g => GhostSubmissionMapper.ToDto(g))
                .ToList<GhostSubmissionDto>();

            return Ok(new PagedSubmissionsDto(
                submissions,
                pagedResult.TotalCount,
                pagedResult.CurrentPage,
                pagedResult.PageSize,
                pagedResult.TotalPages
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving submissions for profile {ProfileId}", ttProfileId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving submissions");
        }
    }

    [HttpGet("profile/{ttProfileId}/stats")]
    public async Task<ActionResult<TTPlayerStatsDto>> GetPlayerStats(int ttProfileId)
    {
        var profile = await _ttProfileRepository.GetByIdAsync(ttProfileId);
        if (profile == null)
            return NotFound($"Profile not found for ID {ttProfileId}");

        var tracks150 = await _ghostSubmissionRepository.CountDistinctTracksAsync(ttProfileId, CC_150);
        var tracks200 = await _ghostSubmissionRepository.CountDistinctTracksAsync(ttProfileId, CC_200);

        return Ok(new TTPlayerStatsDto(
            MapToTTProfileDto(profile),
            await _ghostSubmissionRepository.CountDistinctTracksAsync(ttProfileId),
            tracks150,
            tracks200,
            await _ghostSubmissionRepository.CalculateAverageFinishPositionAsync(ttProfileId),
            await _ghostSubmissionRepository.CountTop10FinishesAsync(ttProfileId)
        ));
    }

    // ===== HELPER METHODS =====

    private BadRequestObjectResult? ValidateCc(short cc)
    {
        if (cc != CC_150 && cc != CC_200)
            return BadRequest($"CC must be either {CC_150} or {CC_200}");

        return null;
    }

    private static (bool? shroomless, short? vehicleMin, short? vehicleMax) ParseCategoryFilters(
        string? shroomless,
        string? vehicle)
    {
        bool? shroomlessFilter = shroomless?.ToLower() switch
        {
            "only" => true,
            "exclude" => false,
            _ => null
        };

        short? vehicleMin = null;
        short? vehicleMax = null;
        switch (vehicle?.ToLower())
        {
            case "karts": vehicleMin = 0; vehicleMax = 17; break;
            case "bikes": vehicleMin = 18; vehicleMax = 35; break;
        }

        return (shroomlessFilter, vehicleMin, vehicleMax);
    }

    private static TrackDto MapToTrackDto(TrackEntity track) => new(
        track.Id,
        track.Name,
        track.CourseId,
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
