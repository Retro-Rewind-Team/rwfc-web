using Microsoft.AspNetCore.Mvc;
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
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = DefaultPageSize)
    {
        try
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, MinPageSize, MaxPageSize);

            var stats = await _raceStatsService.GetPlayerRaceStatsAsync(pid, days, courseId, page, pageSize);
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
}
