using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Filters;
using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Services.Application;

namespace RetroRewindWebsite.Controllers;

/// <summary>
/// Exposes individual player profile and VR history endpoints under the leaderboard route prefix.
/// </summary>
[ApiController]
[Route("api/leaderboard")]
public class PlayerController : ControllerBase
{
    private readonly IPlayerService _playerService;
    private readonly ILogger<PlayerController> _logger;

    public PlayerController(IPlayerService playerService, ILogger<PlayerController> logger)
    {
        _playerService = playerService;
        _logger = logger;
    }

    // ===== PLAYER ENDPOINTS =====

    [HttpGet("player/{fc}")]
    [ProducesResponseType<PlayerDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PlayerDto>> GetPlayer(string fc)
    {
        try
        {
            var player = await _playerService.GetPlayerAsync(fc);
            if (player == null)
                return NotFound($"Player with friend code '{fc}' not found");

            return Ok(player);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving player {FriendCode}", fc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving player data");
        }
    }

    [HttpGet("player/{fc}/history")]
    [ProducesResponseType<VRHistoryRangeResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<VRHistoryRangeResponseDto>> GetPlayerHistory(
        string fc,
        [FromQuery] int? days,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        try
        {
            VRHistoryRangeResponseDto? response;

            if (from.HasValue || to.HasValue)
            {
                var now = DateTime.UtcNow;
                var resolvedFrom = (from?.ToUniversalTime() ?? now.AddDays(-30));
                var resolvedTo = (to?.ToUniversalTime() ?? now);

                if (resolvedTo > now) resolvedTo = now;
                if (resolvedFrom > now) return BadRequest("'from' date cannot be in the future");
                if (resolvedFrom > resolvedTo) (resolvedFrom, resolvedTo) = (resolvedTo, resolvedFrom);

                response = await _playerService.GetPlayerHistoryAsync(fc, resolvedFrom, resolvedTo);
            }
            else
            {
                response = await _playerService.GetPlayerHistoryAsync(fc, days);
            }

            if (response == null)
                return NotFound($"Player with friend code '{fc}' not found");

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving VR history for player {FriendCode}", fc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving VR history");
        }
    }

    [HttpGet("player/{fc}/history/recent")]
    [ProducesResponseType<List<VRHistoryDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<VRHistoryDto>>> GetPlayerRecentHistory(
        string fc,
        [FromQuery] int count = 50)
    {
        try
        {
            var history = await _playerService.GetPlayerRecentHistoryAsync(fc, count);
            if (history == null)
                return NotFound($"Player with friend code '{fc}' not found");

            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving recent VR history for player {FriendCode}", fc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving recent VR history");
        }
    }

    // ===== LEGACY ENDPOINTS =====

    [HttpGet("legacy/player/{friendCode}")]
    [RequireLegacySnapshot]
    [ProducesResponseType<PlayerDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PlayerDto>> GetLegacyPlayer(string friendCode)
    {
        try
        {
            var legacyPlayer = await _playerService.GetLegacyPlayerAsync(friendCode);
            if (legacyPlayer == null)
                return NotFound($"Player with friend code '{friendCode}' not found in legacy snapshot");

            return Ok(legacyPlayer);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving legacy player {FriendCode}", friendCode);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving legacy player data");
        }
    }
}
