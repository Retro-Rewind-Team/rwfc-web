using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Models.External;
using RetroRewindWebsite.Repositories.Player;

namespace RetroRewindWebsite.Controllers;

[ApiController]
[Route("api/badges")]
public class BadgeController : ControllerBase
{
    private readonly IPlayerRepository _playerRepository;
    private readonly ILogger<BadgeController> _logger;

    public BadgeController(IPlayerRepository playerRepository, ILogger<BadgeController> logger)
    {
        _playerRepository = playerRepository;
        _logger = logger;
    }

    [HttpGet("by_pid/{pid}")]
    [ProducesResponseType<BadgeDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<BadgeDto>> BadgesByPid(string pid)
    {
        try
        {
            var player = await _playerRepository.GetByPidAsync(pid);
            if (player == null)
                return NotFound($"Player with PID '${pid}' not found");

            return Ok(new BadgeDto(player.Badges ?? []));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error querying badges for player with PID {Pid}", pid);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while querying the player");
        }
    }

    [HttpPost("by_pids")]
    [ProducesResponseType<BatchBadgeDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<BatchBadgeDto>> BadgesByPids([FromBody] BatchBadgeRequest request)
    {
        try
        {
            if (request.Pids == null || request.Pids.Count == 0)
                return BadRequest("Player IDs (Pids) are required");

            var players = await _playerRepository.GetPlayersByPidsAsync(request.Pids);
            var badgeMap = new Dictionary<string, ICollection<int>>();

            foreach (var player in players)
                badgeMap.Add(player.Pid, player.Badges ?? []);

            return Ok(new BatchBadgeDto(badgeMap));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error querying badges for players with PIDs {Pids}", request.Pids);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while querying the players");
        }
    }

    [HttpGet("all")]
    [ProducesResponseType<BatchBadgeDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<BatchBadgeDto>> AllBadges()
    {
        try
        {
            var badges = await _playerRepository.GetAllBadgedPlayersAsync();
            return Ok(new BatchBadgeDto(badges));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error querying all badged players");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while querying the badges");
        }
    }
}
