using Microsoft.AspNetCore.Mvc;
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
        var miiImage = await _miiBatchService.GetPlayerMiiAsync(fc);
        if (miiImage == null)
            return NotFound($"Mii image not found for player with friend code '{fc}'");

        Response.Headers.CacheControl = "public, max-age=3600";

        // Stored data, not request data, but a malformed row should not turn a cache header
        // into a 500. Skip the ETag rather than fail the response.
        if (TryDecodeBase64(miiImage, out var cachedBytes))
            Response.Headers.ETag = $"\"{Convert.ToHexString(MD5.HashData(cachedBytes))}\"";
        else
            _logger.LogWarning("Cached Mii image for {FriendCode} is not valid base64", fc);

        return Ok(new MiiResponseDto(fc, miiImage));
    }

    [HttpGet("player/{fc}/mii/image")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetPlayerMiiImage(string fc)
    {
        var miiImage = await _miiBatchService.GetPlayerMiiAsync(fc);
        if (miiImage == null)
            return NotFound($"Mii image not found for player with friend code '{fc}'");

        if (!TryDecodeBase64(miiImage, out var imageBytes))
        {
            _logger.LogWarning("Cached Mii image for {FriendCode} is not valid base64", fc);
            return NotFound($"Mii image for player with friend code '{fc}' is unreadable");
        }

        Response.Headers.CacheControl = "public, max-age=3600";
        Response.Headers.ETag = $"\"{Convert.ToHexString(MD5.HashData(imageBytes))}\"";

        return File(imageBytes, "image/png");
    }

    [HttpGet("player/{fc}/mii/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DownloadPlayerMii(string fc)
    {
        var player = await _playerService.GetPlayerMiiDownloadAsync(fc);
        if (player == null)
            return NotFound($"Player with friend code '{fc}' not found");

        if (string.IsNullOrEmpty(player.MiiData))
            return NotFound($"No Mii data available for player with friend code '{fc}'");

        if (!TryDecodeBase64(player.MiiData, out var miiBytes))
        {
            _logger.LogWarning("Stored Mii data for {FriendCode} is not valid base64", fc);
            return NotFound($"Mii data for player with friend code '{fc}' is unreadable");
        }

        return File(miiBytes, "application/octet-stream", $"{player.Name}.mii");
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
            return ApiExceptionFilter.ServerError();
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
            return ApiExceptionFilter.ServerError();
        }
    }
    /// <summary>
    /// Decodes stored base64 without throwing. Mii data comes from an upstream API and is stored
    /// verbatim, so a malformed value is possible and should degrade rather than 500.
    /// </summary>
    private static bool TryDecodeBase64(string? value, out byte[] bytes)
    {
        if (!string.IsNullOrEmpty(value))
        {
            var buffer = new byte[((value.Length * 3) + 3) / 4];
            if (Convert.TryFromBase64String(value, buffer, out var written))
            {
                bytes = buffer[..written];
                return true;
            }
        }

        bytes = [];
        return false;
    }
}
