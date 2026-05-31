using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Filters;
using RetroRewindWebsite.Models.DTOs.Leaderboard;
using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Services.Application;

namespace RetroRewindWebsite.Controllers;

/// <summary>
/// Exposes the VR leaderboard and legacy leaderboard endpoints.
/// </summary>
[ApiController]
[Route("api/leaderboard")]
public class LeaderboardController : ControllerBase
{
    private readonly ILeaderboardService _leaderboardService;
    private readonly ILogger<LeaderboardController> _logger;

    private const int MinTopPlayersCount = 1;
    private const int MaxTopPlayersCount = 100;
    private const int DefaultTopPlayersCount = 10;

    public LeaderboardController(
        ILeaderboardService leaderboardService,
        ILogger<LeaderboardController> logger)
    {
        _leaderboardService = leaderboardService;
        _logger = logger;
    }

    // ===== LEADERBOARD ENDPOINTS =====

    [HttpGet]
    [ProducesResponseType<LeaderboardResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<LeaderboardResponseDto>> GetLeaderboard(
        [FromQuery] LeaderboardRequest request)
    {
        try
        {
            var response = await _leaderboardService.GetLeaderboardAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving leaderboard data");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving leaderboard data");
        }
    }

    [HttpGet("in-game")]
    [ProducesResponseType<LeaderboardInGameResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<LeaderboardInGameResponseDto>> GetLeaderboardInGame(
        [FromQuery] int page = 1)
    {
        try
        {
            var response = await _leaderboardService.GetLeaderboardInGameAsync(page);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving in-game leaderboard data");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving in-game leaderboard data");
        }
    }

    [HttpGet("top/{count}")]
    [ProducesResponseType<List<PlayerDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<PlayerDto>>> GetTopPlayers(int count = DefaultTopPlayersCount)
    {
        try
        {
            count = Math.Clamp(count, MinTopPlayersCount, MaxTopPlayersCount);
            var players = await _leaderboardService.GetTopPlayersAsync(count);
            return Ok(players);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving top {Count} players", count);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving top players");
        }
    }

    [HttpGet("top/in-game/{count}")]
    [ProducesResponseType<List<InGamePlayerDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<InGamePlayerDto>>> GetTopPlayersInGame(int count = DefaultTopPlayersCount)
    {
        try
        {
            count = Math.Clamp(count, MinTopPlayersCount, MaxTopPlayersCount);
            var players = await _leaderboardService.GetTopPlayersInGameAsync(count);
            return Ok(players);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving top {Count} in-game players", count);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving top players");
        }
    }

    [HttpGet("stats")]
    [ProducesResponseType<LeaderboardStatsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<LeaderboardStatsDto>> GetStats()
    {
        try
        {
            var stats = await _leaderboardService.GetStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving leaderboard stats");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving stats");
        }
    }

    // ===== LEGACY ENDPOINTS =====

    [HttpGet("legacy/available")]
    [ProducesResponseType<bool>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<bool>> IsLegacyAvailable()
    {
        try
        {
            var hasSnapshot = await _leaderboardService.HasLegacySnapshotAsync();
            return Ok(hasSnapshot);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking legacy snapshot availability");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while checking legacy snapshot");
        }
    }

    [HttpGet("legacy")]
    [RequireLegacySnapshot]
    [ProducesResponseType<LeaderboardResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<LeaderboardResponseDto>> GetLegacyLeaderboard(
        [FromQuery] LeaderboardRequest request)
    {
        try
        {
            var response = await _leaderboardService.GetLegacyLeaderboardAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving legacy leaderboard data");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving legacy leaderboard data");
        }
    }
}
