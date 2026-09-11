using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Filters;
using RetroRewindWebsite.Helpers;
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
    private const int MinHistoryCount = 1;
    private const int MaxHistoryCount = 200;

    private readonly IPlayerService _playerService;

    public PlayerController(IPlayerService playerService)
    {
        _playerService = playerService;
    }

    // ===== PLAYER ENDPOINTS =====

    [HttpGet("player/{fc}")]
    [ProducesResponseType<PlayerDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PlayerDto>> GetPlayer(string fc)
    {
        var player = await _playerService.GetPlayerAsync(fc);
        if (player == null)
            return NotFound($"Player with friend code '{fc}' not found");

        return Ok(player);
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
        VRHistoryRangeResponseDto? response;

        if (from.HasValue || to.HasValue)
        {
            var now = DateTime.UtcNow;
            var resolvedFrom = UtcDateTime.From(from) ?? now.AddDays(-30);
            var resolvedTo = UtcDateTime.From(to) ?? now;

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

    [HttpGet("player/{fc}/history/recent")]
    [ProducesResponseType<List<VRHistoryDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<VRHistoryDto>>> GetPlayerRecentHistory(
        string fc,
        [FromQuery] int count = 50)
    {
        // A negative count reached Take() unguarded, which throws.
        count = Math.Clamp(count, MinHistoryCount, MaxHistoryCount);

        var history = await _playerService.GetPlayerRecentHistoryAsync(fc, count);
        if (history == null)
            return NotFound($"Player with friend code '{fc}' not found");

        return Ok(history);
    }

    // ===== LEGACY ENDPOINTS =====

    [HttpGet("legacy/player/{friendCode}")]
    [RequireLegacySnapshot]
    [ProducesResponseType<PlayerDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PlayerDto>> GetLegacyPlayer(string friendCode)
    {
        var legacyPlayer = await _playerService.GetLegacyPlayerAsync(friendCode);
        if (legacyPlayer == null)
            return NotFound($"Player with friend code '{friendCode}' not found in legacy snapshot");

        return Ok(legacyPlayer);
    }
}
