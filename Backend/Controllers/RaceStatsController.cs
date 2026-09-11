using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Helpers;
using RetroRewindWebsite.Models.DTOs.Common;
using RetroRewindWebsite.Models.DTOs.RaceStats;
using RetroRewindWebsite.Services.Application;

namespace RetroRewindWebsite.Controllers;

/// <summary>
/// Exposes per-player and global race statistics derived from RWFC room race-result data.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class RaceStatsController : ControllerBase
{
    private readonly IRaceStatsService _raceStatsService;

    private const int MinPageSize = 5;
    private const int MaxPageSize = 50;
    private const int DefaultPageSize = 20;

    public RaceStatsController(IRaceStatsService raceStatsService)
    {
        _raceStatsService = raceStatsService;
    }

    [HttpGet("player/{pid}")]
    [ProducesResponseType<PlayerRaceStatsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PlayerRaceStatsDto>> GetPlayerRaceStats(
        string pid,
        [FromQuery] int? days = null,
        [FromQuery] short? courseId = null,
        [FromQuery] short? engineClassId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = DefaultPageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, MinPageSize, MaxPageSize);

        var stats = await _raceStatsService.GetPlayerRaceStatsAsync(pid, days, courseId, engineClassId, page, pageSize);
        if (stats == null)
            return NotFound($"No race data found for player '{pid}'");

        Response.Headers.CacheControl = "public, max-age=60";
        return Ok(stats);
    }

    [HttpGet("player/{pid}/full")]
    [ProducesResponseType<PlayerStatsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PlayerStatsDto>> GetPlayerFullStats(string pid)
    {
        var stats = await _raceStatsService.GetPlayerFullStatsAsync(pid);
        if (stats == null)
            return NotFound($"Player '{pid}' not found");

        Response.Headers.CacheControl = "public, max-age=60";
        return Ok(stats);
    }

    [HttpGet("player/{pid}/analytics")]
    [ProducesResponseType<PlayerAnalyticsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PlayerAnalyticsDto>> GetPlayerAnalytics(
        string pid,
        [FromQuery] int? days = null,
        [FromQuery] short? engineClassId = null)
    {
        var analytics = await _raceStatsService.GetPlayerAnalyticsAsync(pid, days, engineClassId);
        if (analytics == null)
            return NotFound($"No race data found for player '{pid}'");
        Response.Headers.CacheControl = "public, max-age=60";
        return Ok(analytics);
    }

    [HttpGet("global")]
    [ProducesResponseType<GlobalRaceStatsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<GlobalRaceStatsDto>> GetGlobalRaceStats(
        [FromQuery] int? days = null)
    {
        var stats = await _raceStatsService.GetGlobalRaceStatsAsync(days);
        Response.Headers.CacheControl = "public, max-age=60";
        return Ok(stats);
    }

    [HttpGet("races")]
    [ProducesResponseType<PagedResult<RaceResultDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PagedResult<RaceResultDto>>> GetRaces(
        [FromQuery] string? roomId = null,
        [FromQuery] int? raceNumber = null,
        [FromQuery] short? courseId = null,
        [FromQuery] short? engineClassId = null,
        [FromQuery] string? friendCode = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = DefaultPageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, MinPageSize, MaxPageSize);

        var result = await _raceStatsService.GetRacesAsync(
            roomId, raceNumber, courseId, engineClassId, friendCode,
            UtcDateTime.From(from), UtcDateTime.From(to), page, pageSize);
        Response.Headers.CacheControl = "public, max-age=60";
        return Ok(result);
    }

    [HttpGet("track/{courseId}/online-bests")]
    [ProducesResponseType<TrackOnlineBestsResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<TrackOnlineBestsResultDto>> GetTrackOnlineBests(
        int courseId,
        [FromQuery] short? engineClassId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = DefaultPageSize)
    {
        // Narrowing an out-of-range courseId wraps, so the query would silently run against a
        // different course rather than reporting bad input.
        if (courseId is < short.MinValue or > short.MaxValue)
            return BadRequest("Invalid courseId");

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, MinPageSize, MaxPageSize);
        var result = await _raceStatsService.GetTrackOnlineBestsAsync(
            (short)courseId, engineClassId, page, pageSize);
        Response.Headers.CacheControl = "public, max-age=120";
        return Ok(result);
    }

    [HttpGet("player/{pid}/online-bests")]
    [ProducesResponseType<List<PlayerOnlineBestDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<PlayerOnlineBestDto>>> GetPlayerOnlineBests(string pid)
    {
        var result = await _raceStatsService.GetPlayerOnlineBestsAsync(pid);
        if (result == null)
            return NotFound($"Player '{pid}' not found");
        Response.Headers.CacheControl = "public, max-age=120";
        return Ok(result);
    }

}
