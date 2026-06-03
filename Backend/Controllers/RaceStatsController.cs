using Microsoft.AspNetCore.Mvc;
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
    private readonly ILogger<RaceStatsController> _logger;

    private const int MinPageSize = 5;
    private const int MaxPageSize = 50;
    private const int DefaultPageSize = 20;

    public RaceStatsController(IRaceStatsService raceStatsService, ILogger<RaceStatsController> logger)
    {
        _raceStatsService = raceStatsService;
        _logger = logger;
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
        try
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, MinPageSize, MaxPageSize);

            var stats = await _raceStatsService.GetPlayerRaceStatsAsync(pid, days, courseId, engineClassId, page, pageSize);
            if (stats == null)
                return NotFound($"No race data found for player '{pid}'");

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving race stats for player {Pid}", pid);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving race stats");
        }
    }

    [HttpGet("player/{pid}/full")]
    [ProducesResponseType<PlayerStatsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PlayerStatsDto>> GetPlayerFullStats(string pid)
    {
        try
        {
            var stats = await _raceStatsService.GetPlayerFullStatsAsync(pid);
            if (stats == null)
                return NotFound($"Player '{pid}' not found");

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving full stats for player {Pid}", pid);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving player stats");
        }
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
        try
        {
            var analytics = await _raceStatsService.GetPlayerAnalyticsAsync(pid, days, engineClassId);
            if (analytics == null)
                return NotFound($"No race data found for player '{pid}'");
            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving analytics for player {Pid}", pid);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving player analytics");
        }
    }

    [HttpGet("global")]
    [ProducesResponseType<GlobalRaceStatsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<GlobalRaceStatsDto>> GetGlobalRaceStats(
        [FromQuery] int? days = null)
    {
        try
        {
            var stats = await _raceStatsService.GetGlobalRaceStatsAsync(days);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving global race stats");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving global race stats");
        }
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
        try
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, MinPageSize, MaxPageSize);

            var result = await _raceStatsService.GetRacesAsync(
                roomId, raceNumber, courseId, engineClassId, friendCode, from, to, page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving races");
            return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while retrieving races");
        }
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
        try
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, MinPageSize, MaxPageSize);
            var result = await _raceStatsService.GetTrackOnlineBestsAsync(
                (short)courseId, engineClassId, page, pageSize);
            Response.Headers.CacheControl = "public, max-age=120";
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving online bests for course {CourseId}", courseId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving online bests");
        }
    }

    [HttpGet("player/{pid}/online-bests")]
    [ProducesResponseType<List<PlayerOnlineBestDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<PlayerOnlineBestDto>>> GetPlayerOnlineBests(string pid)
    {
        try
        {
            var result = await _raceStatsService.GetPlayerOnlineBestsAsync(pid);
            if (result == null)
                return NotFound($"Player '{pid}' not found");
            Response.Headers.CacheControl = "public, max-age=120";
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving online bests for player {Pid}", pid);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving player online bests");
        }
    }
}
