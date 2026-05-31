using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using RetroRewindWebsite.Filters;
using RetroRewindWebsite.Helpers;
using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Services.Application;
using System.Security.Cryptography;

namespace RetroRewindWebsite.Controllers;

/// <summary>
/// Exposes Mii avatar endpoints -- single player, batch, image download -- under the leaderboard route prefix.
/// </summary>
[ApiController]
[Route("api/leaderboard")]
public class MiiController : ControllerBase
{
    private readonly IMiiBatchService _miiBatchService;
    private readonly IPlayerService _playerService;
    private readonly ILogger<MiiController> _logger;

    public MiiController(
        IMiiBatchService miiBatchService,
        IPlayerService playerService,
        ILogger<MiiController> logger)
    {
        _miiBatchService = miiBatchService;
        _playerService = playerService;
        _logger = logger;
    }

    // ===== MII ENDPOINTS =====

    [HttpGet("player/{fc}/mii")]
    [ProducesResponseType<MiiResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<MiiResponseDto>> GetPlayerMii(string fc)
    {
        try
        {
            var miiImage = await _miiBatchService.GetPlayerMiiAsync(fc);
            if (miiImage == null)
                return NotFound($"Mii image not found for player with friend code '{fc}'");

            Response.Headers.CacheControl = "public, max-age=3600";
            Response.Headers.ETag = $"\"{Convert.ToHexString(MD5.HashData(Convert.FromBase64String(miiImage)))}\"";

            return Ok(new MiiResponseDto(fc, miiImage));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Mii for player {FriendCode}", fc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving Mii image");
        }
    }

    [HttpGet("player/{fc}/mii/image")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetPlayerMiiImage(string fc)
    {
        try
        {
            var miiImage = await _miiBatchService.GetPlayerMiiAsync(fc);
            if (miiImage == null)
                return NotFound($"Mii image not found for player with friend code '{fc}'");

            var imageBytes = Convert.FromBase64String(miiImage);
            Response.Headers.CacheControl = "public, max-age=3600";
            Response.Headers.ETag = $"\"{Convert.ToHexString(MD5.HashData(imageBytes))}\"";

            return File(imageBytes, "image/png");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Mii for player {FriendCode}", fc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving Mii image");
        }
    }

    [HttpGet("player/{fc}/mii/download")]
    [EnableRateLimiting("DownloadPolicy")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DownloadPlayerMii(string fc)
    {
        try
        {
            var player = await _playerService.GetPlayerMiiDownloadAsync(fc);
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

    [HttpPost("miis/batch")]
    [ProducesResponseType<BatchMiiResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<BatchMiiResponseDto>> GetPlayerMiisBatch(
        [FromBody] BatchMiiRequestDto request)
    {
        try
        {
            var miiError = BatchMiiValidation.Validate(request);
            if (miiError != null)
                return BadRequest(miiError);

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

    // ===== LEGACY MII ENDPOINTS =====

    [HttpPost("legacy/miis/batch")]
    [RequireLegacySnapshot]
    [ProducesResponseType<BatchMiiResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<BatchMiiResponseDto>> GetLegacyPlayerMiisBatch(
        [FromBody] BatchMiiRequestDto request)
    {
        try
        {
            var miiError = BatchMiiValidation.Validate(request);
            if (miiError != null)
                return BadRequest(miiError);

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
}
