using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Models.DTOs;
using RetroRewindWebsite.Services.Application;
using RetroRewindWebsite.Services.Background;
using RetroRewindWebsite.Services.Domain;

namespace RetroRewindWebsite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoomStatusController : ControllerBase
    {
        private readonly IRoomStatusService _roomStatusService;
        private readonly IMiiService _miiService;
        private readonly IRoomStatusBackgroundService? _backgroundService;
        private readonly ILogger<RoomStatusController> _logger;

        public RoomStatusController(
            IRoomStatusService roomStatusService,
            IMiiService miiService,
            ILogger<RoomStatusController> logger,
            IRoomStatusBackgroundService? backgroundService = null)
        {
            _roomStatusService = roomStatusService;
            _miiService = miiService;
            _logger = logger;
            _backgroundService = backgroundService;
        }

        [HttpGet]
        public async Task<ActionResult<RoomStatusResponseDto>> GetRoomStatus([FromQuery] string? id = null)
        {
            try
            {
                RoomStatusResponseDto? response;

                if (string.IsNullOrEmpty(id))
                {
                    // Get latest
                    response = await _roomStatusService.GetLatestStatusAsync();
                }
                else if (id.Equals("min", StringComparison.OrdinalIgnoreCase))
                {
                    // Get minimum (oldest available)
                    var minId = _roomStatusService.GetMinimumId();
                    response = await _roomStatusService.GetStatusByIdAsync(minId);
                }
                else if (int.TryParse(id, out var snapshotId))
                {
                    // Get specific ID
                    response = await _roomStatusService.GetStatusByIdAsync(snapshotId);
                }
                else
                {
                    return BadRequest("Invalid ID parameter. Must be a number or 'min'.");
                }

                if (response == null)
                {
                    var minId = _roomStatusService.GetMinimumId();
                    var maxId = _roomStatusService.GetMaximumId();

                    if (maxId == 0)
                    {
                        return NotFound("No room data available yet. The system may still be initializing.");
                    }

                    return NotFound($"Snapshot with ID {id} not found. Available range: {minId} to {maxId}");
                }

                // Set cache headers - short cache since this data updates frequently
                Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
                Response.Headers.Pragma = "no-cache";
                Response.Headers.Expires = "0";

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting room status");
                return StatusCode(500, "An error occurred while retrieving room status");
            }
        }

        [HttpGet("stats")]
        public async Task<ActionResult<RoomStatusStatsDto>> GetStats()
        {
            try
            {
                var stats = await _roomStatusService.GetStatsAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting room status stats");
                return StatusCode(500, "An error occurred while retrieving stats");
            }
        }

        [HttpGet("mii/{fc}")]
        public async Task<ActionResult> GetMiiImage(string fc)
        {
            try
            {
                // Get the latest snapshot to find the Mii data
                var latestStatus = await _roomStatusService.GetLatestStatusAsync();
                if (latestStatus == null)
                {
                    return NotFound("No room data available");
                }

                // Search through all rooms for this friend code
                string? miiData = null;
                foreach (var room in latestStatus.Rooms)
                {
                    var player = room.Players.FirstOrDefault(p =>
                        p.FriendCode.Equals(fc, StringComparison.OrdinalIgnoreCase));

                    if (player?.Mii != null)
                    {
                        miiData = player.Mii.Data;
                        break;
                    }
                }

                if (string.IsNullOrEmpty(miiData))
                {
                    return NotFound($"Friend code {fc} not found in current rooms or has no Mii data");
                }

                // Get the Mii image
                var miiImageBase64 = await _miiService.GetMiiImageAsync(fc, miiData);
                if (string.IsNullOrEmpty(miiImageBase64))
                {
                    return NotFound($"Could not generate Mii image for friend code {fc}");
                }

                // Convert base64 to bytes and return as image
                var imageBytes = Convert.FromBase64String(miiImageBase64);

                // Set caching headers
                Response.Headers.CacheControl = "public, max-age=3600"; // 1 hour
                Response.Headers.ETag = $"\"{fc.GetHashCode()}\"";

                return File(imageBytes, "image/png");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Mii image for {FriendCode}", fc);
                return StatusCode(500, "An error occurred while retrieving the Mii image");
            }
        }

        [HttpPost("miis/batch")]
        public async Task<ActionResult<BatchMiiResponseDto>> GetMiisBatch([FromBody] BatchMiiRequestDto request)
        {
            try
            {
                if (request.FriendCodes == null || request.FriendCodes.Count == 0)
                {
                    return BadRequest("Friend codes list cannot be empty");
                }

                if (request.FriendCodes.Count > 25)
                {
                    return BadRequest("Maximum 25 friend codes allowed per batch request");
                }

                // Get the latest snapshot to find Mii data
                var latestStatus = await _roomStatusService.GetLatestStatusAsync();
                if (latestStatus == null)
                {
                    return Ok(new BatchMiiResponseDto { Miis = [] });
                }

                // Build a lookup of FC -> Mii data from current rooms
                var miiDataLookup = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                foreach (var room in latestStatus.Rooms)
                {
                    foreach (var player in room.Players.Where(p => p.Mii != null))
                    {
                        if (!miiDataLookup.ContainsKey(player.FriendCode))
                        {
                            miiDataLookup[player.FriendCode] = player.Mii!.Data;
                        }
                    }
                }

                // Clean friend codes
                var cleanFriendCodes = request.FriendCodes
                    .Where(fc => !string.IsNullOrWhiteSpace(fc))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                // Get Mii images for requested friend codes that have Mii data
                var results = new Dictionary<string, string>();
                var tasks = cleanFriendCodes
                    .Where(fc => miiDataLookup.ContainsKey(fc))
                    .Select(async fc =>
                    {
                        var miiImage = await _miiService.GetMiiImageAsync(fc, miiDataLookup[fc]);
                        return (FriendCode: fc, MiiImage: miiImage);
                    });

                var miiResults = await Task.WhenAll(tasks);

                foreach (var (friendCode, miiImage) in miiResults)
                {
                    if (!string.IsNullOrEmpty(miiImage))
                    {
                        results[friendCode] = miiImage;
                    }
                }

                // Set caching headers
                Response.Headers.CacheControl = "public, max-age=1800"; // 30 minutes

                return Ok(new BatchMiiResponseDto { Miis = results });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting batch Mii images for {Count} friend codes",
                    request.FriendCodes?.Count ?? 0);
                return StatusCode(500, "An error occurred while retrieving Mii images");
            }
        }

        [HttpPost("refresh")]
        public async Task<ActionResult> ForceRefresh()
        {
            try
            {
                // Prefer using background service if available (respects semaphore)
                if (_backgroundService != null)
                {
                    await _backgroundService.ForceRefreshAsync();
                }
                else
                {
                    await _roomStatusService.RefreshRoomDataAsync();
                }

                return Ok(new { message = "Room data refresh initiated" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error forcing room data refresh");
                return StatusCode(500, "An error occurred while refreshing room data");
            }
        }
    }
}