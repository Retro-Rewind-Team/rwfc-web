using Microsoft.AspNetCore.Mvc;
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

    private const int MinTopCount = 1;
    private const int MaxTopCount = 50;
    private const int DefaultTopCount = 10;
    private const int MinPage = 1;
    private const int MinPageSize = 1;
    private const int MaxPageSize = 100;
    private const int DefaultPageSize = 10;

    public TimeTrialController(ITimeTrialService timeTrialService)
    {
        _timeTrialService = timeTrialService;
    }

    // ===== TRACK ENDPOINTS =====

    [HttpGet("tracks")]
    [ProducesResponseType<List<TrackDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<TrackDto>>> GetAllTracks()
    {
        var result = await _timeTrialService.GetAllTracksAsync();
        // Set after the await: a header assigned first still rides on the 500 the exception
        // filter produces, telling intermediaries to cache an error.
        Response.Headers.CacheControl = "public, max-age=3600";
        return Ok(result);
    }

    [HttpGet("tracks/{id}")]
    [ProducesResponseType<TrackDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<TrackDto>> GetTrack(int id)
    {
        var track = await _timeTrialService.GetTrackAsync(id);
        if (track == null)
            return NotFound($"Track with ID {id} not found");

        Response.Headers.CacheControl = "public, max-age=3600";
        return Ok(track);
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
        var ccError = TimeTrialValidation.ValidateCc(cc);
        if (ccError != null) return BadRequest(ccError);

        page = Math.Max(MinPage, page);
        pageSize = Math.Clamp(pageSize, MinPageSize, MaxPageSize);

        var (shroomlessFilter, vehicleMin, vehicleMax) = TimeTrialValidation.ParseCategoryFilters(shroomless, vehicle);

        var result = await _timeTrialService.GetLeaderboardAsync(
            trackId, cc, glitchAllowed, shroomlessFilter, vehicle, vehicleMin, vehicleMax, page, pageSize);

        if (result == null)
            return NotFound($"Track with ID {trackId} not found");

        Response.Headers.CacheControl = "public, max-age=30";
        return Ok(result);
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
        var ccError = TimeTrialValidation.ValidateCc(cc);
        if (ccError != null) return BadRequest(ccError);

        page = Math.Max(MinPage, page);
        pageSize = Math.Clamp(pageSize, MinPageSize, MaxPageSize);

        var (shroomlessFilter, vehicleMin, vehicleMax) = TimeTrialValidation.ParseCategoryFilters(shroomless, vehicle);

        var result = await _timeTrialService.GetFlapLeaderboardAsync(
            trackId, cc, glitchAllowed, shroomlessFilter, vehicle, vehicleMin, vehicleMax, page, pageSize);

        if (result == null)
            return NotFound($"Track with ID {trackId} not found");

        Response.Headers.CacheControl = "public, max-age=30";
        return Ok(result);
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
        var ccError = TimeTrialValidation.ValidateCc(cc);
        if (ccError != null) return BadRequest(ccError);

        count = Math.Clamp(count, MinTopCount, MaxTopCount);

        var (shroomlessFilter, vehicleMin, vehicleMax) = TimeTrialValidation.ParseCategoryFilters(shroomless, vehicle);

        var result = await _timeTrialService.GetTopTimesAsync(
            trackId, cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax, count);

        // Set after the await: a header assigned first still rides on the 500 the exception
        // filter produces, telling intermediaries to cache an error.
        Response.Headers.CacheControl = "public, max-age=30";
        return Ok(result);
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
        var ccError = TimeTrialValidation.ValidateCc(cc);
        if (ccError != null) return BadRequest(ccError);

        var (shroomlessFilter, vehicleMin, vehicleMax) = TimeTrialValidation.ParseCategoryFilters(shroomless, vehicle);

        var result = await _timeTrialService.GetWorldRecordAsync(
            trackId, cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax);

        if (result == null)
            return NotFound($"No world record found for track {trackId} at {cc}cc");

        Response.Headers.CacheControl = "public, max-age=30";
        return Ok(result);
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
        var ccError = TimeTrialValidation.ValidateCc(cc);
        if (ccError != null) return BadRequest(ccError);

        var (shroomlessFilter, vehicleMin, vehicleMax) = TimeTrialValidation.ParseCategoryFilters(shroomless, vehicle);

        var result = await _timeTrialService.GetWorldRecordHistoryAsync(
            trackId, cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax);

        // Set after the await: a header assigned first still rides on the 500 the exception
        // filter produces, telling intermediaries to cache an error.
        Response.Headers.CacheControl = "public, max-age=30";
        return Ok(result);
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
        var ccError = TimeTrialValidation.ValidateCc(cc);
        if (ccError != null) return BadRequest(ccError);

        var (shroomlessFilter, vehicleMin, vehicleMax) = TimeTrialValidation.ParseCategoryFilters(shroomless, vehicle);

        var result = await _timeTrialService.GetFlapWorldRecordHistoryAsync(
            trackId, cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax);

        // Set after the await: a header assigned first still rides on the 500 the exception
        // filter produces, telling intermediaries to cache an error.
        Response.Headers.CacheControl = "public, max-age=30";
        return Ok(result);
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
        var ccError = TimeTrialValidation.ValidateCc(cc);
        if (ccError != null) return BadRequest(ccError);

        var (shroomlessFilter, vehicleMin, vehicleMax) = TimeTrialValidation.ParseCategoryFilters(shroomless, vehicle);

        var result = await _timeTrialService.GetAllWorldRecordsAsync(
            cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax);

        // Set after the await: a header assigned first still rides on the 500 the exception
        // filter produces, telling intermediaries to cache an error.
        Response.Headers.CacheControl = "public, max-age=30";
        return Ok(result);
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

        Response.Headers.CacheControl = "public, max-age=30";
        return Ok(result);
    }

    // ===== GHOST DOWNLOAD ENDPOINT =====

    [HttpGet("ghost/{id}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DownloadGhost(int id)
    {
        var info = await _timeTrialService.GetGhostDownloadInfoAsync(id);
        if (info == null)
            return NotFound("Ghost file not found");

        return File(info.Value.Data, "application/octet-stream", info.Value.FileName);
    }

    // ===== PROFILE ENDPOINTS =====

    [HttpGet("profile/{ttProfileId}")]
    [ProducesResponseType<TTProfileDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<TTProfileDto>> GetProfile(int ttProfileId)
    {
        var profile = await _timeTrialService.GetProfileAsync(ttProfileId);
        if (profile == null)
            return NotFound($"Profile not found for ID {ttProfileId}");

        Response.Headers.CacheControl = "public, max-age=30";
        return Ok(profile);
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

        Response.Headers.CacheControl = "public, max-age=30";
        return Ok(result);
    }

    [HttpGet("profile/{ttProfileId}/stats")]
    [ProducesResponseType<TTPlayerStatsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<TTPlayerStatsDto>> GetPlayerStats(int ttProfileId)
    {
        var stats = await _timeTrialService.GetPlayerStatsAsync(ttProfileId);
        if (stats == null)
            return NotFound($"Profile not found for ID {ttProfileId}");

        Response.Headers.CacheControl = "public, max-age=30";
        return Ok(stats);
    }

    [HttpGet("rankings")]
    [ProducesResponseType<TTPlayerRankingsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<TTPlayerRankingsDto>> GetPlayerRankings(
        [FromQuery] short cc,
        [FromQuery] bool glitchAllowed = true,
        [FromQuery] string? shroomless = null,
        [FromQuery] string? vehicle = null,
        [FromQuery] string? trackCategory = null,
        [FromQuery] int page = MinPage,
        [FromQuery] int pageSize = DefaultPageSize)
    {
        var ccError = TimeTrialValidation.ValidateCc(cc);
        if (ccError != null) return BadRequest(ccError);

        if (trackCategory != null && trackCategory != "retro" && trackCategory != "custom")
            return BadRequest("trackCategory must be 'retro', 'custom', or omitted");

        page = Math.Max(MinPage, page);
        pageSize = Math.Clamp(pageSize, MinPageSize, MaxPageSize);

        var (shroomlessFilter, vehicleMin, vehicleMax) = TimeTrialValidation.ParseCategoryFilters(shroomless, vehicle);

        var result = await _timeTrialService.GetPlayerRankingsAsync(
            cc, glitchAllowed, shroomlessFilter, vehicleMin, vehicleMax, trackCategory, page, pageSize);

        // Set after the await: a header assigned first still rides on the 500 the exception
        // filter produces, telling intermediaries to cache an error.
        Response.Headers.CacheControl = "public, max-age=30";
        return Ok(result);
    }

}
