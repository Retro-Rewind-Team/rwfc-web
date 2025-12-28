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
        private readonly IVRHistoryRepository _vrHistoryRepository;
        private readonly ILogger<ModerationController> _logger;

        public ModerationController(
            IPlayerRepository playerRepository,
            IVRHistoryRepository vrHistoryRepository,
            ILogger<ModerationController> logger)
        {
            _playerRepository = playerRepository;
            _vrHistoryRepository = vrHistoryRepository;
            _logger = logger;
        }

        [HttpPost("ban")]
        public async Task<ActionResult> BanUser([FromBody] BanRequest request)
        {
            try
            {
                _logger.LogWarning("Ban request received for PID: {Pid}", request.Pid);

                var player = await _playerRepository.GetByPidAsync(request.Pid);

                if (player == null)
                {
                    return NotFound(new { Error = $"Player with PID {request.Pid} not found" });
                }

                var playerInfo = new
                {
                    ProfileId = player.Pid,
                    player.Name,
                    player.Fc,
                    LastInGameSn = player.Name,
                    LastIPAddress = "Hidden"
                };

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

        [HttpPost("unflag")]
        public async Task<ActionResult> UnflagUser([FromBody] UnflagRequest request)
        {
            try
            {
                _logger.LogWarning("Unflag request received for PID: {Pid}", request.Pid);

                var player = await _playerRepository.GetByPidAsync(request.Pid);

                if (player == null)
                {
                    return NotFound(new { Error = $"Player with PID {request.Pid} not found" });
                }

                player.IsSuspicious = false;

                await _playerRepository.UpdateAsync(player);

                _logger.LogWarning("Player {Name} ({Pid}) unflagged by moderator {Moderator}",
                    player.Name, player.Pid, request.Moderator);

                return Ok(new
                {
                    Success = true,
                    User = new
                    {
                        ProfileId = player.Pid,
                        player.Name,
                        player.Fc,
                        player.IsSuspicious
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unflagging user with PID {Pid}", request.Pid);
                return StatusCode(500, new { Error = "An error occurred while unflagging the user" });
            }
        }

        [HttpPost("flag")]
        public async Task<ActionResult> FlagUser([FromBody] FlagRequest request)
        {
            try
            {
                _logger.LogWarning("Flag request received for PID: {Pid}", request.Pid);

                var player = await _playerRepository.GetByPidAsync(request.Pid);

                if (player == null)
                {
                    return NotFound(new { Error = $"Player with PID {request.Pid} not found" });
                }

                player.IsSuspicious = true;

                await _playerRepository.UpdateAsync(player);

                _logger.LogWarning("Player {Name} ({Pid}) flagged by moderator {Moderator}.",
                    player.Name, player.Pid, request.Moderator);

                return Ok(new
                {
                    Success = true,
                    User = new
                    {
                        ProfileId = player.Pid,
                        player.Name,
                        player.Fc,
                        player.IsSuspicious
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error flagging user with PID {Pid}", request.Pid);
                return StatusCode(500, new { Error = "An error occurred while flagging the user" });
            }
        }

        [HttpGet("suspicious-jumps/{pid}")]
        public async Task<ActionResult> GetSuspiciousJumps(string pid)
        {
            try
            {
                _logger.LogInformation("Suspicious jumps request for PID: {Pid}", pid);

                var player = await _playerRepository.GetByPidAsync(pid);

                if (player == null)
                {
                    return NotFound(new { Error = $"Player with PID {pid} not found" });
                }

                var history = await _vrHistoryRepository.GetPlayerHistoryAsync(player.Pid, 1000);

                var suspiciousJumps = history
                    .Where(h => Math.Abs(h.VRChange) >= 200)
                    .OrderByDescending(h => h.Date)
                    .Select(h => new
                    {
                        h.Date,
                        h.VRChange,
                        h.TotalVR
                    })
                    .ToList();

                return Ok(new
                {
                    Success = true,
                    Player = new
                    {
                        player.Pid,
                        player.Name,
                        player.Fc,
                        player.IsSuspicious,
                        player.SuspiciousVRJumps
                    },
                    SuspiciousJumps = suspiciousJumps,
                    suspiciousJumps.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting suspicious jumps for PID {Pid}", pid);
                return StatusCode(500, new { Error = "An error occurred while retrieving suspicious jumps" });
            }
        }

        [HttpGet("player-stats/{pid}")]
        public async Task<ActionResult> GetPlayerStats(string pid)
        {
            try
            {
                _logger.LogInformation("Player stats request for PID: {Pid}", pid);

                var player = await _playerRepository.GetByPidAsync(pid);

                if (player == null)
                {
                    return NotFound(new { Error = $"Player with PID {pid} not found" });
                }

                return Ok(new
                {
                    Success = true,
                    Player = new
                    {
                        player.Pid,
                        player.Name,
                        player.Fc,
                        VR = player.Ev,
                        player.Rank,
                        ActiveRank = player.IsActive ? player.ActiveRank : (int?)null,
                        player.LastSeen,
                        player.IsActive,
                        player.IsSuspicious,
                        player.SuspiciousVRJumps,
                        VRStats = new
                        {
                            Last24Hours = player.VRGainLast24Hours,
                            LastWeek = player.VRGainLastWeek,
                            LastMonth = player.VRGainLastMonth
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting stats for PID {Pid}", pid);
                return StatusCode(500, new { Error = "An error occurred while retrieving player stats" });
            }
        }
    }
}