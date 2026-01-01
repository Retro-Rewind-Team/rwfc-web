using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using RetroRewindWebsite.Models.DTOs;
using RetroRewindWebsite.Services.Application;

namespace RetroRewindWebsite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeaderboardController : ControllerBase
    {
        private readonly ILeaderboardManager _leaderboardManager;
        private readonly ILogger<LeaderboardController> _logger;

        private const int MinTopPlayersCount = 1;
        private const int MaxTopPlayersCount = 50;
        private const int DefaultTopPlayersCount = 10;
        private const int MaxBatchMiiCount = 25;

        public LeaderboardController(
            ILeaderboardManager leaderboardManager,
            ILogger<LeaderboardController> logger)
        {
            _leaderboardManager = leaderboardManager;
            _logger = logger;
        }

        // ===== LEADERBOARD ENDPOINTS =====

        /// <summary>
        /// Retrieves paginated leaderboard with filtering and sorting
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<LeaderboardResponseDto>> GetLeaderboard(
            [FromQuery] LeaderboardRequest request)
        {
            try
            {
                var response = await _leaderboardManager.GetLeaderboardAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving leaderboard data");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving leaderboard data");
            }
        }

        /// <summary>
        /// Retrieves top N players (excluding suspicious players)
        /// </summary>
        [HttpGet("top/{count}")]
        public async Task<ActionResult<List<PlayerDto>>> GetTopPlayers(int count = DefaultTopPlayersCount)
        {
            try
            {
                count = Math.Clamp(count, MinTopPlayersCount, MaxTopPlayersCount);

                var players = await _leaderboardManager.GetTopPlayersAsync(count);
                return Ok(players);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving top {Count} players", count);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving top players");
            }
        }

        /// <summary>
        /// Retrieves top N players without mii images (excluding suspicious players)
        /// </summary>
        [HttpGet("top/no-mii/{count}")]
            public async Task<ActionResult<List<PlayerDto>>> GetTopPlayersNoMii(int count = DefaultTopPlayersCount)
        {
            try
            {
                count = Math.Clamp(count, MinTopPlayersCount, MaxTopPlayersCount);
                var players = await _leaderboardManager.GetTopPlayersNoMiiAsync(count);
                return Ok(players);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving top {Count} players without Mii images", count);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving top players");
            }
        }

        /// <summary>
        /// Retrieves top VR gainers for a specific time period
        /// </summary>
        [HttpGet("top-gainers")]
        public async Task<ActionResult<List<PlayerDto>>> GetTopVRGainers(
            [FromQuery] string period = "24h")
        {
            try
            {
                var players = await _leaderboardManager.GetTopVRGainersAsync(50, period);
                return Ok(players);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving top VR gainers for period {Period}", period);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving top VR gainers");
            }
        }

        /// <summary>
        /// Retrieves leaderboard statistics
        /// </summary>
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
                _logger.LogError(ex, "Error retrieving leaderboard stats");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving stats");
            }
        }

        // ===== PLAYER ENDPOINTS =====

        /// <summary>
        /// Retrieves a specific player by friend code
        /// </summary>
        [HttpGet("player/{fc}")]
        public async Task<ActionResult<PlayerDto>> GetPlayer(string fc)
        {
            try
            {
                var player = await _leaderboardManager.GetPlayerAsync(fc);

                if (player == null)
                {
                    return NotFound($"Player with friend code '{fc}' not found");
                }

                return Ok(player);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving player {FriendCode}", fc);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving player data");
            }
        }

        /// <summary>
        /// Retrieves VR history for a specific player
        /// </summary>
        [HttpGet("player/{fc}/history")]
        public async Task<ActionResult<VRHistoryRangeResponse>> GetPlayerHistory(
            string fc,
            [FromQuery] int? days)
        {
            try
            {
                var response = await _leaderboardManager.GetPlayerHistoryAsync(fc, days);

                if (response == null)
                {
                    return NotFound($"Player with friend code '{fc}' not found");
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving VR history for player {FriendCode}", fc);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving VR history");
            }
        }

        /// <summary>
        /// Retrieves recent VR history entries for a specific player
        /// </summary>
        [HttpGet("player/{fc}/history/recent")]
        public async Task<ActionResult<List<VRHistoryDto>>> GetPlayerRecentHistory(
            string fc,
            [FromQuery] int count = 50)
        {
            try
            {
                var history = await _leaderboardManager.GetPlayerRecentHistoryAsync(fc, count);

                if (history == null)
                {
                    return NotFound($"Player with friend code '{fc}' not found");
                }

                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving recent VR history for player {FriendCode}", fc);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving recent VR history");
            }
        }

        // ===== MII ENDPOINTS =====

        /// <summary>
        /// Retrieves Mii image for a specific player
        /// </summary>
        [HttpGet("player/{fc}/mii")]
        public async Task<ActionResult<MiiResponseDto>> GetPlayerMii(string fc)
        {
            try
            {
                var miiImage = await _leaderboardManager.GetPlayerMiiAsync(fc);

                if (miiImage == null)
                {
                    return NotFound($"Mii image not found for player with friend code '{fc}'");
                }

                Response.Headers.CacheControl = "public, max-age=3600";
                Response.Headers.ETag = $"\"{fc.GetHashCode()}\"";

                return Ok(new MiiResponseDto
                {
                    FriendCode = fc,
                    MiiImageBase64 = miiImage
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving Mii for player {FriendCode}", fc);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving Mii image");
            }
        }

        /// <summary>
        /// Retrieves Mii images for multiple players in a single request
        /// </summary>
        [HttpPost("miis/batch")]
        public async Task<ActionResult<BatchMiiResponseDto>> GetPlayerMiisBatch(
            [FromBody] BatchMiiRequestDto request)
        {
            try
            {
                var validationResult = ValidateBatchMiiRequest(request);
                if (validationResult != null)
                {
                    return validationResult;
                }

                var cleanFriendCodes = request.FriendCodes
                    .Where(fc => !string.IsNullOrWhiteSpace(fc))
                    .Distinct()
                    .ToList();

                if (cleanFriendCodes.Count == 0)
                {
                    return Ok(new BatchMiiResponseDto { Miis = [] });
                }

                var miiImages = await _leaderboardManager.GetPlayerMiisBatchAsync(cleanFriendCodes);

                Response.Headers.CacheControl = "public, max-age=1800";

                return Ok(new BatchMiiResponseDto
                {
                    Miis = miiImages.Where(kvp => kvp.Value != null)
                                   .ToDictionary(kvp => kvp.Key, kvp => kvp.Value!)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving batch Mii images for {Count} friend codes",
                    request.FriendCodes?.Count ?? 0);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving Mii images");
            }
        }

        // ===== LEGACY ENDPOINTS =====

        /// <summary>
        /// Checks if legacy leaderboard snapshot is available
        /// </summary>
        [HttpGet("legacy/available")]
        public async Task<ActionResult<bool>> IsLegacyAvailable()
        {
            try
            {
                var hasSnapshot = await _leaderboardManager.HasLegacySnapshotAsync();
                return Ok(hasSnapshot);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking legacy snapshot availability");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while checking legacy snapshot");
            }
        }

        /// <summary>
        /// Retrieves paginated legacy leaderboard
        /// </summary>
        [HttpGet("legacy")]
        [RequireLegacySnapshot]
        public async Task<ActionResult<LeaderboardResponseDto>> GetLegacyLeaderboard(
            [FromQuery] LeaderboardRequest request)
        {
            try
            {
                var response = await _leaderboardManager.GetLegacyLeaderboardAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving legacy leaderboard data");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving legacy leaderboard data");
            }
        }

        /// <summary>
        /// Retrieves a specific player from legacy snapshot by friend code
        /// </summary>
        [HttpGet("legacy/player/{friendCode}")]
        [RequireLegacySnapshot]
        public async Task<ActionResult<PlayerDto>> GetLegacyPlayer(string friendCode)
        {
            try
            {
                var legacyPlayer = await _leaderboardManager.GetLegacyPlayerAsync(friendCode);

                if (legacyPlayer == null)
                {
                    return NotFound($"Player with friend code '{friendCode}' not found in legacy snapshot");
                }

                return Ok(legacyPlayer);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving legacy player data for friend code {FriendCode}", friendCode);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving legacy player data");
            }
        }

        /// <summary>
        /// Retrieves Mii images for multiple legacy players in a single request
        /// </summary>
        [HttpPost("legacy/miis/batch")]
        [RequireLegacySnapshot]
        public async Task<ActionResult<BatchMiiResponseDto>> GetLegacyPlayerMiisBatch(
            [FromBody] BatchMiiRequestDto request)
        {
            try
            {
                var validationResult = ValidateBatchMiiRequest(request);
                if (validationResult != null)
                {
                    return validationResult;
                }

                var cleanFriendCodes = request.FriendCodes
                    .Where(fc => !string.IsNullOrWhiteSpace(fc))
                    .Distinct()
                    .ToList();

                if (cleanFriendCodes.Count == 0)
                {
                    return Ok(new BatchMiiResponseDto { Miis = [] });
                }

                var miiImages = await _leaderboardManager.GetLegacyPlayerMiisBatchAsync(cleanFriendCodes);

                Response.Headers.CacheControl = "public, max-age=1800";

                return Ok(new BatchMiiResponseDto
                {
                    Miis = miiImages.Where(kvp => kvp.Value != null)
                                   .ToDictionary(kvp => kvp.Key, kvp => kvp.Value!)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving batch Mii images for {Count} legacy friend codes",
                    request.FriendCodes?.Count ?? 0);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving Mii images");
            }
        }

        // ===== HELPER METHODS =====

        private BadRequestObjectResult? ValidateBatchMiiRequest(BatchMiiRequestDto request)
        {
            if (request.FriendCodes == null || request.FriendCodes.Count == 0)
            {
                return BadRequest("Friend codes list cannot be empty");
            }

            if (request.FriendCodes.Count > MaxBatchMiiCount)
            {
                return BadRequest($"Maximum {MaxBatchMiiCount} friend codes allowed per batch request");
            }

            return null;
        }
    }

    // ===== CUSTOM ATTRIBUTES =====

    public class RequireLegacySnapshotAttribute : ActionFilterAttribute
    {
        public override async Task OnActionExecutionAsync(
            ActionExecutingContext context,
            ActionExecutionDelegate next)
        {
            var leaderboardManager = context.HttpContext.RequestServices
                .GetRequiredService<ILeaderboardManager>();

            var hasSnapshot = await leaderboardManager.HasLegacySnapshotAsync();

            if (!hasSnapshot)
            {
                context.Result = new NotFoundObjectResult("Legacy leaderboard snapshot not available");
                return;
            }

            await next();
        }
    }
}