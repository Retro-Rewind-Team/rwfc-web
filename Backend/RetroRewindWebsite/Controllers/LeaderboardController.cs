using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Models.DTOs;
using RetroRewindWebsite.Repositories;
using RetroRewindWebsite.Services.Application;
using RetroRewindWebsite.Services.External;

namespace RetroRewindWebsite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeaderboardController : ControllerBase
    {
        private readonly ILeaderboardManager _leaderboardManager;
        private readonly IRetroWFCApiClient _retroWFCApiClient;
        private readonly IVRHistoryRepository _vrHistoryRepository;
        private readonly ILogger<LeaderboardController> _logger;

        public LeaderboardController(
            ILeaderboardManager leaderboardManager,
            IRetroWFCApiClient retroWFCApiClient,
            IVRHistoryRepository vrHistoryRepository,
            ILogger<LeaderboardController> logger)
        {
            _leaderboardManager = leaderboardManager;
            _retroWFCApiClient = retroWFCApiClient;
            _vrHistoryRepository = vrHistoryRepository;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<LeaderboardResponseDto>> GetLeaderboard([FromQuery] LeaderboardRequest request)
        {
            try
            {
                var response = await _leaderboardManager.GetLeaderboardAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting leaderboard data");
                return StatusCode(500, "An error occurred while retrieving leaderboard data");
            }
        }

        [HttpGet("top/{count}")]
        public async Task<ActionResult<List<PlayerDto>>> GetTopPlayers(
            int count = 10,
            [FromQuery] bool activeOnly = false)
        {
            try
            {
                if (count < 1) count = 10;
                if (count > 50) count = 50;

                var players = await _leaderboardManager.GetTopPlayersAsync(count, activeOnly);
                return Ok(players);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting top players");
                return StatusCode(500, "An error occurred while retrieving top players");
            }
        }

        [HttpGet("player/{fc}")]
        public async Task<ActionResult<PlayerDto>> GetPlayer(string fc)
        {
            try
            {
                var player = await _leaderboardManager.GetPlayerAsync(fc);

                if (player == null)
                {
                    return NotFound($"Player with Friend Code '{fc}' not found");
                }

                return Ok(player);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting player {fc}", fc);
                return StatusCode(500, "An error occurred while retrieving player data");
            }
        }

        [HttpGet("player/{fc}/mii")]
        public async Task<ActionResult<MiiResponseDto>> GetPlayerMii(string fc)
        {
            try
            {
                var miiImage = await _leaderboardManager.GetPlayerMiiAsync(fc);

                if (miiImage == null)
                {
                    return NotFound($"Mii image not found for player with Friend Code '{fc}'");
                }

                // Set aggressive caching headers for Mii images
                Response.Headers.CacheControl = "public, max-age=3600"; // 1 hour
                Response.Headers.ETag = $"\"{fc.GetHashCode()}\"";

                return Ok(new MiiResponseDto
                {
                    FriendCode = fc,
                    MiiImageBase64 = miiImage
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Mii for player {fc}", fc);
                return StatusCode(500, "An error occurred while retrieving Mii image");
            }
        }

        [HttpPost("miis/batch")]
        public async Task<ActionResult<BatchMiiResponseDto>> GetPlayerMiisBatch([FromBody] BatchMiiRequestDto request)
        {
            try
            {
                if (request.FriendCodes == null || request.FriendCodes.Count == 0)
                {
                    return BadRequest("Friend codes list cannot be empty");
                }

                // Limit batch size to prevent abuse and reduce load
                if (request.FriendCodes.Count > 25) // Reduced from 50 to be safer
                {
                    return BadRequest("Maximum 25 friend codes allowed per batch request");
                }

                // Remove duplicates and null/empty values
                var cleanFriendCodes = request.FriendCodes
                    .Where(fc => !string.IsNullOrWhiteSpace(fc))
                    .Distinct()
                    .ToList();

                if (cleanFriendCodes.Count == 0)
                {
                    return Ok(new BatchMiiResponseDto { Miis = [] });
                }

                var miiImages = await _leaderboardManager.GetPlayerMiisBatchAsync(cleanFriendCodes);

                // Set caching headers
                Response.Headers.CacheControl = "public, max-age=1800"; // 30 minutes

                return Ok(new BatchMiiResponseDto
                {
                    Miis = miiImages.Where(kvp => kvp.Value != null)
                                   .ToDictionary(kvp => kvp.Key, kvp => kvp.Value!)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting batch Mii images for {Count} friend codes",
                    request.FriendCodes?.Count ?? 0);
                return StatusCode(500, "An error occurred while retrieving Mii images");
            }
        }

        [HttpGet("stats")]
        public async Task<ActionResult<LeaderboardStatsDto>> GetStats()
        {
            try
            {
                var stats = await _leaderboardManager.GetStatsAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting leaderboard stats");
                return StatusCode(500, "An error occurred while retrieving stats");
            }
        }

        [HttpGet("player/{fc}/history")]
        public async Task<ActionResult<VRHistoryRangeResponse>> GetPlayerHistory(
            string fc,
            [FromQuery] int days = 30)
        {
            try
            {
                var player = await _leaderboardManager.GetPlayerAsync(fc);
                if (player == null)
                {
                    return NotFound($"Player with Friend Code '{fc}' not found");
                }

                var toDate = DateTime.UtcNow;
                var fromDate = toDate.AddDays(-days);

                var history = await _vrHistoryRepository.GetPlayerHistoryAsync(player.Pid, fromDate, toDate);

                var historyDtos = history.Select(h => new VRHistoryDto
                {
                    Date = h.Date,
                    VRChange = h.VRChange,
                    TotalVR = h.TotalVR
                }).ToList();

                var startingVR = historyDtos.Count > 0 ? historyDtos.First().TotalVR - historyDtos.First().VRChange : player.VR;
                var endingVR = historyDtos.Count > 0 ? historyDtos.Last().TotalVR : player.VR;
                var totalChange = endingVR - startingVR;

                return Ok(new VRHistoryRangeResponse
                {
                    PlayerId = player.Pid,
                    FromDate = fromDate,
                    ToDate = toDate,
                    History = historyDtos,
                    TotalVRChange = totalChange,
                    StartingVR = startingVR,
                    EndingVR = endingVR
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting VR history for player {fc}", fc);
                return StatusCode(500, "An error occurred while retrieving VR history");
            }
        }

        [HttpGet("player/{fc}/history/recent")]
        public async Task<ActionResult<List<VRHistoryDto>>> GetPlayerRecentHistory(
            string fc,
            [FromQuery] int count = 50)
        {
            try
            {
                var player = await _leaderboardManager.GetPlayerAsync(fc);
                if (player == null)
                {
                    return NotFound($"Player with Friend Code '{fc}' not found");
                }

                var history = await _vrHistoryRepository.GetPlayerHistoryAsync(player.Pid, count);

                var historyDtos = history.Select(h => new VRHistoryDto
                {
                    Date = h.Date,
                    VRChange = h.VRChange,
                    TotalVR = h.TotalVR
                }).OrderBy(h => h.Date).ToList();

                return Ok(historyDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recent VR history for player {fc}", fc);
                return StatusCode(500, "An error occurred while retrieving recent VR history");
            }
        }
    }
}