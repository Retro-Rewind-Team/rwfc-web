using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using RetroRewindWebsite.Filters;
using RetroRewindWebsite.Models.DTOs.Leaderboard;
using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Services.Application;

namespace RetroRewindWebsite.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaderboardController : ControllerBase
{
    private readonly ILeaderboardService _leaderboardService;
    private readonly IPlayerService _playerService;
    private readonly IMiiBatchService _miiBatchService;
    private readonly ILogger<LeaderboardController> _logger;

    private const int MinTopPlayersCount = 1;
    private const int MaxTopPlayersCount = 100;
    private const int DefaultTopPlayersCount = 10;
    private const int MaxBatchMiiCount = 25;

    public LeaderboardController(
        ILeaderboardService leaderboardService,
        IPlayerService playerService,
        IMiiBatchService miiBatchService,
        ILogger<LeaderboardController> logger)
    {
        _leaderboardService = leaderboardService;
        _playerService = playerService;
        _miiBatchService = miiBatchService;
        _logger = logger;
    }

    // ===== LEADERBOARD ENDPOINTS =====

    [HttpGet]
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

    // TODO: Remove after RR update
    [HttpGet("top/no-mii/{count}")]
    public async Task<ActionResult<List<InGamePlayerDto>>> GetTopPlayersInGameOld(int count = DefaultTopPlayersCount)
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

    [HttpGet("top-gainers")]
    public async Task<ActionResult<List<PlayerDto>>> GetTopVRGainers(
        [FromQuery] string period = "24h")
    {
        try
        {
            var players = await _leaderboardService.GetTopVRGainersAsync(50, period);
            return Ok(players);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving top VR gainers for period {Period}", period);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving top VR gainers");
        }
    }

    [HttpGet("stats")]
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

    // ===== PLAYER ENDPOINTS =====

    [HttpGet("player/{fc}")]
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
    public async Task<ActionResult<VRHistoryRangeResponseDto>> GetPlayerHistory(
        string fc,
        [FromQuery] int? days)
    {
        try
        {
            var response = await _playerService.GetPlayerHistoryAsync(fc, days);
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

    // ===== MII ENDPOINTS =====

    [HttpGet("player/{fc}/mii")]
    public async Task<ActionResult<MiiResponseDto>> GetPlayerMii(string fc)
    {
        try
        {
            var miiImage = await _miiBatchService.GetPlayerMiiAsync(fc);
            if (miiImage == null)
                return NotFound($"Mii image not found for player with friend code '{fc}'");

            Response.Headers.CacheControl = "public, max-age=3600";
            Response.Headers.ETag = $"\"{fc.GetHashCode()}\"";

            return Ok(new MiiResponseDto(fc, miiImage));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Mii for player {FriendCode}", fc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving Mii image");
        }
    }

    // Returns the mii image decoded as a png rather than b64
    [HttpGet("player/{fc}/mii/image")]
    public async Task<IActionResult> GetPlayerMiiImage(string fc)
    {
        try
        {
            var miiImage = await _miiBatchService.GetPlayerMiiAsync(fc);
            if (miiImage == null)
                return NotFound($"Mii image not found for player with friend code '{fc}'");

            Response.Headers.CacheControl = "public, max-age=3600";
            Response.Headers.ETag = $"\"{fc.GetHashCode()}\"";

            return File(Convert.FromBase64String(miiImage), "image/png");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Mii for player {FriendCode}", fc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving Mii image");
        }
    }

    [HttpPost("miis/batch")]
    public async Task<ActionResult<BatchMiiResponseDto>> GetPlayerMiisBatch(
        [FromBody] BatchMiiRequestDto request)
    {
        try
        {
            var validationResult = ValidateBatchMiiRequest(request);
            if (validationResult != null)
                return validationResult;

            var cleanFriendCodes = request.FriendCodes
                .Where(fc => !string.IsNullOrWhiteSpace(fc))
                .Distinct()
                .ToList();

            if (cleanFriendCodes.Count == 0)
                return Ok(new BatchMiiResponseDto([]));

            var miiImages = await _miiBatchService.GetPlayerMiisBatchAsync(cleanFriendCodes);

            Response.Headers.CacheControl = "public, max-age=1800";

            return Ok(new BatchMiiResponseDto(
                miiImages
                    .Where(kvp => kvp.Value != null)
                    .ToDictionary(kvp => kvp.Key, kvp => kvp.Value!)
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving batch Mii images for {Count} friend codes",
                request.FriendCodes?.Count ?? 0);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving Mii images");
        }
    }

    [HttpGet("player/{fc}/mii/download")]
    [EnableRateLimiting("DownloadPolicy")]
    public async Task<IActionResult> DownloadPlayerMii(string fc)
    {
        try
        {
            var player = await _playerService.GetPlayerAsync(fc);
            if (player == null)
                return NotFound($"Player with friend code '{fc}' not found");

            if (string.IsNullOrEmpty(player.MiiData))
                return NotFound($"No Mii data available for player with friend code '{fc}'");

            var miiBytes = Convert.FromBase64String(player.MiiData);
            return File(miiBytes, "application/octet-stream", $"{player.Name}.mii");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading Mii for player {FriendCode}", fc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while downloading Mii file");
        }
    }

    // ===== LEGACY ENDPOINTS =====

    [HttpGet("legacy/available")]
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

    [HttpGet("legacy/player/{friendCode}")]
    [RequireLegacySnapshot]
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

    [HttpPost("legacy/miis/batch")]
    [RequireLegacySnapshot]
    public async Task<ActionResult<BatchMiiResponseDto>> GetLegacyPlayerMiisBatch(
        [FromBody] BatchMiiRequestDto request)
    {
        try
        {
            var validationResult = ValidateBatchMiiRequest(request);
            if (validationResult != null)
                return validationResult;

            var cleanFriendCodes = request.FriendCodes
                .Where(fc => !string.IsNullOrWhiteSpace(fc))
                .Distinct()
                .ToList();

            if (cleanFriendCodes.Count == 0)
                return Ok(new BatchMiiResponseDto([]));

            var miiImages = await _miiBatchService.GetLegacyPlayerMiisBatchAsync(cleanFriendCodes);

            Response.Headers.CacheControl = "public, max-age=1800";

            return Ok(new BatchMiiResponseDto(
                miiImages
                    .Where(kvp => kvp.Value != null)
                    .ToDictionary(kvp => kvp.Key, kvp => kvp.Value!)
            ));
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
            return BadRequest("Friend codes list cannot be empty");

        if (request.FriendCodes.Count > MaxBatchMiiCount)
            return BadRequest($"Maximum {MaxBatchMiiCount} friend codes allowed per batch request");

        return null;
    }
}
