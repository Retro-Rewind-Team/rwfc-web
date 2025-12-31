using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Models.DTOs;
using RetroRewindWebsite.Models.External;
using RetroRewindWebsite.Repositories;

namespace RetroRewindWebsite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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

        // ===== FLAG OPERATIONS =====

        [HttpPost("flag")]
        public async Task<ActionResult> FlagPlayer([FromBody] FlagRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Pid))
                {
                    return BadRequest("Player ID (Pid) is required");
                }

                var player = await _playerRepository.GetByPidAsync(request.Pid);
                if (player == null)
                {
                    return NotFound($"Player with PID '{request.Pid}' not found");
                }

                if (player.IsSuspicious)
                {
                    return Ok(new { message = $"Player '{player.Name}' is already flagged as suspicious" });
                }

                player.IsSuspicious = true;
                await _playerRepository.UpdateAsync(player);

                _logger.LogWarning(
                    "Player manually flagged as suspicious: {Name} ({FriendCode}) - PID: {Pid} by moderation",
                    player.Name, player.Fc, player.Pid);

                return Ok(new
                {
                    message = $"Player '{player.Name}' has been flagged as suspicious",
                    player = new
                    {
                        player.Pid,
                        player.Name,
                        player.Fc,
                        player.Ev,
                        player.IsSuspicious
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error flagging player with PID {Pid}", request.Pid);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while flagging the player");
            }
        }

        [HttpPost("unflag")]
        public async Task<ActionResult> UnflagPlayer([FromBody] UnflagRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Pid))
                {
                    return BadRequest("Player ID (Pid) is required");
                }

                var player = await _playerRepository.GetByPidAsync(request.Pid);
                if (player == null)
                {
                    return NotFound($"Player with PID '{request.Pid}' not found");
                }

                if (!player.IsSuspicious)
                {
                    return Ok(new { message = $"Player '{player.Name}' is not flagged as suspicious" });
                }

                player.IsSuspicious = false;
                player.SuspiciousVRJumps = 0;
                await _playerRepository.UpdateAsync(player);

                _logger.LogInformation(
                    "Player unflagged: {Name} ({FriendCode}) - PID: {Pid} by moderation",
                    player.Name, player.Fc, player.Pid);

                return Ok(new
                {
                    message = $"Player '{player.Name}' has been unflagged",
                    player = new
                    {
                        player.Pid,
                        player.Name,
                        player.Fc,
                        player.Ev,
                        player.IsSuspicious,
                        player.SuspiciousVRJumps
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unflagging player with PID {Pid}", request.Pid);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while unflagging the player");
            }
        }

        // ===== BAN OPERATIONS =====

        [HttpPost("ban")]
        public async Task<ActionResult> BanPlayer([FromBody] BanRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Pid))
                {
                    return BadRequest("Player ID (Pid) is required");
                }

                var player = await _playerRepository.GetByPidAsync(request.Pid);
                if (player == null)
                {
                    return NotFound($"Player with PID '{request.Pid}' not found");
                }

                await _playerRepository.DeleteAsync(player.Id);

                _logger.LogWarning(
                    "Player banned and removed: {Name} ({FriendCode}) - PID: {Pid} by moderation",
                    player.Name, player.Fc, player.Pid);

                return Ok(new
                {
                    message = $"Player '{player.Name}' has been banned and removed from the leaderboard",
                    player = new
                    {
                        player.Pid,
                        player.Name,
                        player.Fc
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error banning player with PID {Pid}", request.Pid);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while banning the player");
            }
        }

        // ===== QUERY OPERATIONS =====

        [HttpGet("suspicious")]
        public async Task<ActionResult<List<PlayerDto>>> GetSuspiciousPlayers()
        {
            try
            {
                var players = await _playerRepository.GetAllAsync();
                var suspiciousPlayers = players
                    .Where(p => p.IsSuspicious)
                    .OrderByDescending(p => p.Ev)
                    .Select(p => new PlayerDto
                    {
                        Pid = p.Pid,
                        Name = p.Name,
                        FriendCode = p.Fc,
                        VR = p.Ev,
                        Rank = p.Rank,
                        LastSeen = p.LastSeen,
                        IsSuspicious = p.IsSuspicious,
                        VRStats = new VRStatsDto
                        {
                            Last24Hours = p.VRGainLast24Hours,
                            LastWeek = p.VRGainLastWeek,
                            LastMonth = p.VRGainLastMonth
                        },
                        MiiImageBase64 = p.MiiImageBase64,
                        MiiData = p.MiiData
                    })
                    .ToList();

                return Ok(suspiciousPlayers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving suspicious players");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving suspicious players");
            }
        }
    }
}