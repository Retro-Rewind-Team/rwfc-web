using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Models.External;
using RetroRewindWebsite.Repositories;

namespace RetroRewindWebsite.Controllers
{
    [ApiController]
    [Route("api/moderation")]
    public class ModerationController : ControllerBase
    {
        private readonly IPlayerRepository _playerRepository;
        private readonly ILogger<ModerationController> _logger;

        public ModerationController(
            IPlayerRepository playerRepository,
            ILogger<ModerationController> logger)
        {
            _playerRepository = playerRepository;
            _logger = logger;
        }

        [HttpPost("ban")]
        public async Task<ActionResult> BanUser([FromBody] BanRequest request)
        {
            try
            {
                _logger.LogWarning("Ban request received for PID: {Pid}", request.Pid);

                // Find the player by PID
                var player = await _playerRepository.GetByPidAsync(request.Pid);

                if (player == null)
                {
                    return NotFound(new { Error = $"Player with PID {request.Pid} not found" });
                }

                // Store player info before deletion for the response
                var playerInfo = new
                {
                    ProfileId = player.Pid,
                    player.Name,
                    Fc = player.Fc,
                    LastInGameSn = player.Name,
                    LastIPAddress = "Hidden"
                };

                // Delete the player from the database
                await _playerRepository.DeleteAsync(player.Id);

                _logger.LogWarning(
                    "Player {Name} ({Pid}) removed from leaderboard by moderator {Moderator}. Reason: {Reason}",
                    player.Name, player.Pid, request.Moderator, request.Reason);

                return Ok(new
                {
                    Success = true,
                    User = playerInfo
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing user with PID {Pid}", request.Pid);
                return StatusCode(500, new { Error = "An error occurred while removing the user" });
            }
        }
    }
}