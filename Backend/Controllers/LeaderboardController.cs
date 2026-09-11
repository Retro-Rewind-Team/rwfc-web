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

    private const int MinTopPlayersCount = 1;
    private const int MaxTopPlayersCount = 100;
    private const int DefaultTopPlayersCount = 10;

    public LeaderboardController(
        ILeaderboardService leaderboardService)
    {
        _leaderboardService = leaderboardService;
    }

    // ===== LEADERBOARD ENDPOINTS =====

    [HttpGet]
    [ProducesResponseType<LeaderboardResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<LeaderboardResponseDto>> GetLeaderboard(
        [FromQuery] LeaderboardRequest request)
    {
        var response = await _leaderboardService.GetLeaderboardAsync(request);
        Response.Headers.CacheControl = "public, max-age=60";
        return Ok(response);
    }

    [HttpGet("in-game")]
    [ProducesResponseType<LeaderboardInGameResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<LeaderboardInGameResponseDto>> GetLeaderboardInGame(
        [FromQuery] int page = 1)
    {
        // Unvalidated, so a negative or huge page reached the offset calculation directly.
        page = Math.Max(1, page);

        var response = await _leaderboardService.GetLeaderboardInGameAsync(page);
        Response.Headers.CacheControl = "public, max-age=60";
        return Ok(response);
    }

    [HttpGet("top/{count}")]
    [ProducesResponseType<List<PlayerDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<PlayerDto>>> GetTopPlayers(int count = DefaultTopPlayersCount)
    {
        count = Math.Clamp(count, MinTopPlayersCount, MaxTopPlayersCount);
        var players = await _leaderboardService.GetTopPlayersAsync(count);
        Response.Headers.CacheControl = "public, max-age=60";
        return Ok(players);
    }

    [HttpGet("top/in-game/{count}")]
    [ProducesResponseType<List<InGamePlayerDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<InGamePlayerDto>>> GetTopPlayersInGame(int count = DefaultTopPlayersCount)
    {
        count = Math.Clamp(count, MinTopPlayersCount, MaxTopPlayersCount);
        var players = await _leaderboardService.GetTopPlayersInGameAsync(count);
        Response.Headers.CacheControl = "public, max-age=60";
        return Ok(players);
    }

    [HttpGet("stats")]
    [ProducesResponseType<LeaderboardStatsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<LeaderboardStatsDto>> GetStats()
    {
        var stats = await _leaderboardService.GetStatsAsync();
        Response.Headers.CacheControl = "public, max-age=60";
        return Ok(stats);
    }

    // ===== LEGACY ENDPOINTS =====

    [HttpGet("legacy/available")]
    [ProducesResponseType<bool>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<bool>> IsLegacyAvailable()
    {
        var hasSnapshot = await _leaderboardService.HasLegacySnapshotAsync();
        Response.Headers.CacheControl = "public, max-age=300";
        return Ok(hasSnapshot);
    }

    [HttpGet("legacy")]
    [RequireLegacySnapshot]
    [ProducesResponseType<LeaderboardResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<LeaderboardResponseDto>> GetLegacyLeaderboard(
        [FromQuery] LeaderboardRequest request)
    {
        var response = await _leaderboardService.GetLegacyLeaderboardAsync(request);
        Response.Headers.CacheControl = "public, max-age=300";
        return Ok(response);
    }
}
