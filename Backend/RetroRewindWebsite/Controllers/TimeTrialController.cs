using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using RetroRewindWebsite.Helpers;
using RetroRewindWebsite.Models.DTOs.TimeTrial;
using RetroRewindWebsite.Services.Application;

namespace RetroRewindWebsite.Controllers;

/// <summary>
/// Exposes the time trial leaderboard, track listings, ghost file downloads, TT profiles,
/// and world record history.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TimeTrialController : ControllerBase
{
    private readonly ITimeTrialService _timeTrialService;
    private readonly ILogger<TimeTrialController> _logger;

    private const int MinTopCount = 1;
    private const int MaxTopCount = 50;
    private const int DefaultTopCount = 10;
    private const int MinPage = 1;
    private const int MinPageSize = 1;
    private const int MaxPageSize = 100;
    private const int DefaultPageSize = 10;

    public TimeTrialController(ITimeTrialService timeTrialService, ILogger<TimeTrialController> logger)
    {
        _timeTrialService = timeTrialService;
        _logger = logger;
    }

    // ===== TRACK ENDPOINTS =====

    [HttpGet("tracks")]
    [ProducesResponseType<List<TrackDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<TrackDto>>> GetAllTracks()
    {
        try
        {
            return Ok(await _timeTrialService.GetAllTracksAsync());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving tracks");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving tracks");
        }
    }

    [HttpGet("tracks/{id}")]
    [ProducesResponseType<TrackDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<TrackDto>> GetTrack(int id)
    {
        try
        {
            var track = await _timeTrialService.GetTrackAsync(id);
            if (track == null)
                return NotFound($"Track with ID {id} not found");

            return Ok(track);
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
    [ProducesResponseType<TrackLeaderboardDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
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
            var ccError = TimeTrialValidation.ValidateCc(cc);
            if (ccError != null) return BadRequest(ccError);

            page = Math.Max(MinPage, page);
            pageSize = Math.Clamp(pageSize, MinPageSize, MaxPageSize);

            var (shroomlessFilter, vehicleMin, vehicleMax) = TimeTrialValidation.ParseCategoryFilters(shroomless, vehicle);

            var result = await _timeTrialService.GetLeaderboardAsync(
                trackId, cc, glitchAllowed, shroomlessFilter, vehicle, vehicleMin, vehicleMax, page, pageSize);

            if (result == null)
                return NotFound($"Track with ID {trackId} not found");

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving leaderboard for track {TrackId} {CC}cc", trackId, cc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving leaderboard");
        }
    }

    [HttpGet("leaderboard/flap")]
    [ProducesResponseType<TrackLeaderboardDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
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
            var ccError = TimeTrialValidation.ValidateCc(cc);
            if (ccError != null) return BadRequest(ccError);

            page = Math.Max(MinPage, page);
            pageSize = Math.Clamp(pageSize, MinPageSize, MaxPageSize);

            var (shroomlessFilter, vehicleMin, vehicleMax) = TimeTrialValidation.ParseCategoryFilters(shroomless, vehicle);

            var result = await _timeTrialService.GetFlapLeaderboardAsync(
                trackId, cc, glitchAllowed, shroomlessFilter, vehicle, vehicleMin, vehicleMax, page, pageSize);

            if (result == null)
                return NotFound($"Track with ID {trackId} not found");

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving flap leaderboard for track {TrackId} {CC}cc", trackId, cc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving flap leaderboard");
        }
    }

    [HttpGet("leaderboard/top")]
    [ProducesResponseType<List<GhostSubmissionDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
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
            var ccError = TimeTrialValidation.ValidateCc(cc);
            if (ccError != null) return BadRequest(ccError);

            count = Math.Clamp(count, MinTopCount, MaxTopCount);

            var (shroomlessFilter, vehicleMin, vehicleMax) = TimeTrialValidation.ParseCategoryFilters(shroomless, vehicle);

            return Ok(await _timeTrialService.GetTopTimesAsync(
                trackId, cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax, count));
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
    [ProducesResponseType<GhostSubmissionDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<GhostSubmissionDto>> GetWorldRecord(
        [FromQuery] int trackId,
        [FromQuery] short cc,
        [FromQuery] bool glitchAllowed = true,
        [FromQuery] string? shroomless = null,
        [FromQuery] string? vehicle = null)
    {
        try
        {
            var ccError = TimeTrialValidation.ValidateCc(cc);
            if (ccError != null) return BadRequest(ccError);

            var (shroomlessFilter, vehicleMin, vehicleMax) = TimeTrialValidation.ParseCategoryFilters(shroomless, vehicle);

            var result = await _timeTrialService.GetWorldRecordAsync(
                trackId, cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax);

            if (result == null)
                return NotFound($"No world record found for track {trackId} at {cc}cc");

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving world record for track {TrackId} {CC}cc", trackId, cc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving world record");
        }
    }

    [HttpGet("worldrecord/history")]
    [ProducesResponseType<List<GhostSubmissionDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<GhostSubmissionDto>>> GetWorldRecordHistory(
        [FromQuery] int trackId,
        [FromQuery] short cc,
        [FromQuery] bool glitchAllowed = true,
        [FromQuery] string? shroomless = null,
        [FromQuery] string? vehicle = null)
    {
        try
        {
            var ccError = TimeTrialValidation.ValidateCc(cc);
            if (ccError != null) return BadRequest(ccError);

            var (shroomlessFilter, vehicleMin, vehicleMax) = TimeTrialValidation.ParseCategoryFilters(shroomless, vehicle);

            return Ok(await _timeTrialService.GetWorldRecordHistoryAsync(
                trackId, cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving WR history for track {TrackId} {CC}cc", trackId, cc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving world record history");
        }
    }

    [HttpGet("worldrecord/history/flap")]
    [ProducesResponseType<List<GhostSubmissionDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<GhostSubmissionDto>>> GetFlapWorldRecordHistory(
        [FromQuery] int trackId,
        [FromQuery] short cc,
        [FromQuery] bool glitchAllowed = true,
        [FromQuery] string? shroomless = null,
        [FromQuery] string? vehicle = null)
    {
        try
        {
            var ccError = TimeTrialValidation.ValidateCc(cc);
            if (ccError != null) return BadRequest(ccError);

            var (shroomlessFilter, vehicleMin, vehicleMax) = TimeTrialValidation.ParseCategoryFilters(shroomless, vehicle);

            return Ok(await _timeTrialService.GetFlapWorldRecordHistoryAsync(
                trackId, cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving flap WR history for track {TrackId} {CC}cc", trackId, cc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving flap world record history");
        }
    }

    [HttpGet("worldrecords/all")]
    [ProducesResponseType<List<TrackWorldRecordsDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<TrackWorldRecordsDto>>> GetAllWorldRecords(
        [FromQuery] short cc,
        [FromQuery] bool glitchAllowed = true,
        [FromQuery] string? shroomless = null,
        [FromQuery] string? vehicle = null)
    {
        try
        {
            var ccError = TimeTrialValidation.ValidateCc(cc);
            if (ccError != null) return BadRequest(ccError);

            var (shroomlessFilter, vehicleMin, vehicleMax) = TimeTrialValidation.ParseCategoryFilters(shroomless, vehicle);

            return Ok(await _timeTrialService.GetAllWorldRecordsAsync(
                cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax));
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
    [ProducesResponseType<FlapDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<FlapDto>> GetFastestLap(
        [FromQuery] int trackId,
        [FromQuery] short cc,
        [FromQuery] bool glitchAllowed = true,
        [FromQuery] string? shroomless = null,
        [FromQuery] string? vehicle = null)
    {
        try
        {
            var ccError = TimeTrialValidation.ValidateCc(cc);
            if (ccError != null) return BadRequest(ccError);

            var track = await _timeTrialService.GetTrackAsync(trackId);
            if (track == null)
                return NotFound($"Track with ID {trackId} not found");

            var (shroomlessFilter, vehicleMin, vehicleMax) = TimeTrialValidation.ParseCategoryFilters(shroomless, vehicle);

            var result = await _timeTrialService.GetFastestLapAsync(
                trackId, cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax);

            if (result == null)
                return NotFound("No lap times found for the specified category");

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving FLAP for track {TrackId} {CC}cc", trackId, cc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving fastest lap");
        }
    }

    // ===== GHOST DOWNLOAD ENDPOINT =====

    [HttpGet("ghost/{id}/download")]
    [EnableRateLimiting("GhostDownloadPolicy")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DownloadGhost(int id)
    {
        try
        {
            var info = await _timeTrialService.GetGhostDownloadInfoAsync(id);
            if (info == null)
                return NotFound("Ghost file not found");

            var fileStream = new FileStream(info.Value.FilePath, FileMode.Open, FileAccess.Read);
            return File(fileStream, "application/octet-stream", info.Value.FileName);
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
    [ProducesResponseType<TTProfileDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<TTProfileDto>> GetProfile(int ttProfileId)
    {
        try
        {
            var profile = await _timeTrialService.GetProfileAsync(ttProfileId);
            if (profile == null)
                return NotFound($"Profile not found for ID {ttProfileId}");

            return Ok(profile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving profile {ProfileId}", ttProfileId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving profile");
        }
    }

    [HttpGet("profile/{ttProfileId}/submissions")]
    [ProducesResponseType<PagedSubmissionsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
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
                var ccError = TimeTrialValidation.ValidateCc(cc.Value);
                if (ccError != null) return BadRequest(ccError);
            }

            page = Math.Max(MinPage, page);
            pageSize = Math.Clamp(pageSize, MinPageSize, MaxPageSize);

            var (shroomlessFilter, vehicleMin, vehicleMax) = TimeTrialValidation.ParseCategoryFilters(shroomless, vehicle);

            var result = await _timeTrialService.GetProfileSubmissionsAsync(
                ttProfileId, trackId, cc, glitch, shroomlessFilter, vehicleMin, vehicleMax, page, pageSize);

            if (result == null)
                return NotFound($"Profile not found for ID {ttProfileId}");

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving submissions for profile {ProfileId}", ttProfileId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving submissions");
        }
    }

    [HttpGet("profile/{ttProfileId}/stats")]
    [ProducesResponseType<TTPlayerStatsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<TTPlayerStatsDto>> GetPlayerStats(int ttProfileId)
    {
        try
        {
            var stats = await _timeTrialService.GetPlayerStatsAsync(ttProfileId);
            if (stats == null)
                return NotFound($"Profile not found for ID {ttProfileId}");

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving stats for profile {ProfileId}", ttProfileId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving player stats");
        }
    }

}
