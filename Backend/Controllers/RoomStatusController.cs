using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using RetroRewindWebsite.Helpers;
using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Models.DTOs.Room;
using RetroRewindWebsite.Services.Application;
using System.Security.Cryptography;

namespace RetroRewindWebsite.Controllers;

/// <summary>
/// Provides live and historical RWFC room status data and room snapshots.
/// keyed to players currently visible in rooms.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class RoomStatusController : ControllerBase
{
    private readonly IRoomStatusService _roomStatusService;
    private readonly ILogger<RoomStatusController> _logger;

    public RoomStatusController(
        IRoomStatusService roomStatusService,
        ILogger<RoomStatusController> logger)
    {
        _roomStatusService = roomStatusService;
        _logger = logger;
    }

    // ===== ROOM STATUS ENDPOINTS =====

    [HttpGet]
    [ProducesResponseType<RoomStatusResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<RoomStatusResponseDto>> GetRoomStatus()
    {
        try
        {
            var response = await _roomStatusService.GetLatestStatusAsync();

            if (response == null)
                return NotFound("No room data available yet. The system may still be initializing.");

            var minId = await _roomStatusService.GetMinIdAsync();
            var maxId = await _roomStatusService.GetMaxIdAsync();
            response = response with { MinimumId = minId, MaximumId = maxId };

            Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
            Response.Headers.Pragma = "no-cache";
            Response.Headers.Expires = "0";

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving room status");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving room status");
        }
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType<RoomStatusResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<RoomStatusResponseDto>> GetRoomStatusById(int id)
    {
        try
        {
            var minId = await _roomStatusService.GetMinIdAsync();
            var maxId = await _roomStatusService.GetMaxIdAsync();

            var response = await _roomStatusService.GetStatusByDbIdAsync(id);

            if (response == null)
            {
                if (maxId == 0)
                    return NotFound("No room data available yet.");

                return NotFound($"Snapshot with ID {id} not found. Available range: {minId} to {maxId}");
            }

            // Populate min/max on the response so the frontend can update its navigation bounds
            response = response with { MinimumId = minId, MaximumId = maxId };

            Response.Headers.CacheControl = "public, max-age=60";

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving room status by ID {Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving room status");
        }
    }

    [HttpGet("stats")]
    [ProducesResponseType<RoomStatusStatsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<RoomStatusStatsDto>> GetStats()
    {
        try
        {
            var stats = await _roomStatusService.GetStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving room status stats");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving stats");
        }
    }

    [HttpGet("nearest")]
    [ProducesResponseType<RoomStatusResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<RoomStatusResponseDto>> GetNearest([FromQuery] DateTime timestamp)
    {
        try
        {
            var minId = await _roomStatusService.GetMinIdAsync();
            var maxId = await _roomStatusService.GetMaxIdAsync();

            var response = await _roomStatusService.GetNearestStatusAsync(timestamp);

            if (response == null)
                return NotFound("No snapshots available.");

            response = response with { MinimumId = minId, MaximumId = maxId };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving nearest snapshot");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving the nearest snapshot");
        }
    }

    [HttpGet("history")]
    [ProducesResponseType<List<RoomSnapshotDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> GetHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 60,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        try
        {
            if (page < 1) return BadRequest("Page must be >= 1.");
            if (pageSize is < 1 or > 1440) return BadRequest("pageSize must be between 1 and 1440.");

            if (from.HasValue && to.HasValue)
            {
                if (from.Value > to.Value)
                    return BadRequest("'from' must be earlier than 'to'.");

                var range = await _roomStatusService.GetSnapshotsByDateRangeAsync(from.Value, to.Value);
                return Ok(range);
            }

            var result = await _roomStatusService.GetSnapshotHistoryAsync(page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving room snapshot history");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving snapshot history");
        }
    }

    [HttpPost("refresh")]
    [EnableRateLimiting("RefreshPolicy")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> ForceRefresh()
    {
        try
        {
            await _roomStatusService.RefreshRoomDataAsync(persistSnapshot: true);
            return Ok(new { message = "Room data refresh initiated" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error forcing room data refresh");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while refreshing room data");
        }
    }

    // ===== MII ENDPOINTS =====

    [HttpGet("mii/{fc}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> GetMiiImage(string fc)
    {
        try
        {
            var imageBytes = await _roomStatusService.GetMiiImageBytesAsync(fc);

            if (imageBytes == null)
                return NotFound($"Mii image not available for friend code '{fc}'");

            Response.Headers.CacheControl = "public, max-age=3600";
            Response.Headers.ETag = $"\"{Convert.ToHexString(MD5.HashData(imageBytes))}\"";

            return File(imageBytes, "image/png");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Mii image for {FriendCode}", fc);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving the Mii image");
        }
    }

    [HttpPost("miis/batch")]
    [ProducesResponseType<BatchMiiResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<BatchMiiResponseDto>> GetMiisBatch(
        [FromBody] BatchMiiRequestDto request)
    {
        try
        {
            var miiError = BatchMiiValidation.Validate(request);
            if (miiError != null)
                return BadRequest(miiError);

            var results = await _roomStatusService.GetMiiImageBatchAsync(request.FriendCodes);

            Response.Headers.CacheControl = "public, max-age=1800";

            return Ok(new BatchMiiResponseDto(results));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving batch Mii images for {Count} friend codes",
                request.FriendCodes?.Count ?? 0);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving Mii images");
        }
    }
}
