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
        private readonly IRoomStatusBackgroundService _backgroundService;
        private readonly ILogger<RoomStatusController> _logger;

        private const int MaxBatchMiiCount = 25;

        public RoomStatusController(
            IRoomStatusService roomStatusService,
            IMiiService miiService,
            IRoomStatusBackgroundService backgroundService,
            ILogger<RoomStatusController> logger)
        {
            _roomStatusService = roomStatusService;
            _miiService = miiService;
            _backgroundService = backgroundService;
            _logger = logger;
        }

        // ===== ROOM STATUS ENDPOINTS =====

        /// <summary>
        /// Retrieves room status snapshot by ID or latest snapshot if no ID provided
        /// </summary>
        /// <param name="id">Optional snapshot ID (number) or 'min' for oldest snapshot</param>
        [HttpGet]
        public async Task<ActionResult<RoomStatusResponseDto>> GetRoomStatus([FromQuery] string? id = null)
        {
            try
            {
                RoomStatusResponseDto? response;

                if (string.IsNullOrEmpty(id))
                {
                    response = await _roomStatusService.GetLatestStatusAsync();
                }
                else if (id.Equals("min", StringComparison.OrdinalIgnoreCase))
                {
                    var minId = _roomStatusService.GetMinimumId();
                    response = await _roomStatusService.GetStatusByIdAsync(minId);
                }
                else if (int.TryParse(id, out var snapshotId))
                {
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

        /// <summary>
        /// Retrieves statistics about room status snapshots
        /// </summary>
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
                _logger.LogError(ex, "Error retrieving room status stats");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving stats");
            }
        }

        /// <summary>
        /// Forces an immediate refresh of room data from the external API
        /// </summary>
        [HttpPost("refresh")]
        public async Task<ActionResult> ForceRefresh()
        {
            try
            {
                await _backgroundService.ForceRefreshAsync();
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

        /// <summary>
        /// Retrieves Mii image for a player currently in a room
        /// </summary>
        /// <param name="fc">Friend code of the player</param>
        [HttpGet("mii/{fc}")]
        public async Task<ActionResult> GetMiiImage(string fc)
        {
            try
            {
                var latestStatus = await _roomStatusService.GetLatestStatusAsync();
                if (latestStatus == null)
                {
                    return NotFound("No room data available");
                }

                var miiData = FindMiiDataInRooms(latestStatus.Rooms, fc);

                if (string.IsNullOrEmpty(miiData))
                {
                    return NotFound($"Friend code '{fc}' not found in current rooms or has no Mii data");
                }

                var miiImageBase64 = await _miiService.GetMiiImageAsync(fc, miiData);
                if (string.IsNullOrEmpty(miiImageBase64))
                {
                    return NotFound($"Could not generate Mii image for friend code '{fc}'");
                }

                var imageBytes = Convert.FromBase64String(miiImageBase64);

                Response.Headers.CacheControl = "public, max-age=3600";
                Response.Headers.ETag = $"\"{fc.GetHashCode()}\"";

                return File(imageBytes, "image/png");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving Mii image for {FriendCode}", fc);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while retrieving the Mii image");
            }
        }

        /// <summary>
        /// Retrieves Mii images for multiple players in a single request
        /// </summary>
        [HttpPost("miis/batch")]
        public async Task<ActionResult<BatchMiiResponseDto>> GetMiisBatch([FromBody] BatchMiiRequestDto request)
        {
            try
            {
                var validationResult = ValidateBatchMiiRequest(request);
                if (validationResult != null)
                {
                    return validationResult;
                }

                var latestStatus = await _roomStatusService.GetLatestStatusAsync();
                if (latestStatus == null)
                {
                    return Ok(new BatchMiiResponseDto { Miis = [] });
                }

                var miiDataLookup = BuildMiiDataLookup(latestStatus.Rooms);

                var cleanFriendCodes = request.FriendCodes
                    .Where(fc => !string.IsNullOrWhiteSpace(fc))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

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

                Response.Headers.CacheControl = "public, max-age=1800";

                return Ok(new BatchMiiResponseDto { Miis = results });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving batch Mii images for {Count} friend codes",
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

        private static string? FindMiiDataInRooms(List<RoomDto> rooms, string friendCode)
        {
            foreach (var room in rooms)
            {
                var player = room.Players.FirstOrDefault(p =>
                    p.FriendCode.Equals(friendCode, StringComparison.OrdinalIgnoreCase));

                if (player?.Mii != null)
                {
                    return player.Mii.Data;
                }
            }

            return null;
        }

        private static Dictionary<string, string> BuildMiiDataLookup(List<RoomDto> rooms)
        {
            var lookup = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            foreach (var room in rooms)
            {
                foreach (var player in room.Players.Where(p => p.Mii != null))
                {
                    if (!lookup.ContainsKey(player.FriendCode))
                    {
                        lookup[player.FriendCode] = player.Mii!.Data;
                    }
                }
            }

            return lookup;
        }
    }
}