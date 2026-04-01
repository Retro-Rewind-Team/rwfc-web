using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Helpers;
using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Models.DTOs.TimeTrial;
using RetroRewindWebsite.Models.External;
using RetroRewindWebsite.Services.Application;

namespace RetroRewindWebsite.Controllers;

/// <summary>
/// Handles player moderation actions (flag, unflag, ban) and VR jump analysis. Only used by RWFC bot.
/// All endpoints require Bearer token authentication via <see cref="Middleware.ApiKeyAuthenticationMiddleware"/>.
/// </summary>
[ApiController]
[Route("api/moderation")]
public class PlayerModerationController : ControllerBase
{
    private readonly IPlayerModerationService _moderationService;
    private readonly ILogger<PlayerModerationController> _logger;

    public PlayerModerationController(
        IPlayerModerationService moderationService,
        ILogger<PlayerModerationController> logger)
    {
        _moderationService = moderationService;
        _logger = logger;
    }

    [HttpPost("flag")]
    [ProducesResponseType<ModerationActionResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ModerationActionResultDto>> FlagPlayer([FromBody] FlagRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Pid))
                return BadRequest("Player ID (Pid) is required");

            var result = await _moderationService.FlagPlayerAsync(request.Pid, request.Reason);
            if (result == null)
                return NotFound($"Player with PID '{request.Pid}' not found");

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error flagging player with PID {Pid}", request.Pid);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while flagging the player");
        }
    }

    [HttpPost("unflag")]
    [ProducesResponseType<ModerationActionResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ModerationActionResultDto>> UnflagPlayer([FromBody] UnflagRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Pid))
                return BadRequest("Player ID (Pid) is required");

            var result = await _moderationService.UnflagPlayerAsync(request.Pid, request.Reason);
            if (result == null)
                return NotFound($"Player with PID '{request.Pid}' not found");

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unflagging player with PID {Pid}", request.Pid);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while unflagging the player");
        }
    }

    [HttpPost("ban")]
    [ProducesResponseType<ModerationActionResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ModerationActionResultDto>> BanPlayer([FromBody] BanRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Pid))
                return BadRequest("Player ID (Pid) is required");

            var result = await _moderationService.BanPlayerAsync(request.Pid);
            if (result == null)
                return NotFound($"Player with PID '{request.Pid}' not found");

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error banning player with PID {Pid}", request.Pid);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while banning the player");
        }
    }

    [HttpGet("suspicious-jumps/{pid}")]
    [ProducesResponseType<SuspiciousJumpsResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SuspiciousJumpsResultDto>> GetSuspiciousJumps(string pid)
    {
        try
        {
            var result = await _moderationService.GetSuspiciousJumpsAsync(pid);
            if (result == null)
                return NotFound($"Player with PID '{pid}' not found");

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving suspicious jumps for PID {Pid}", pid);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving suspicious jumps");
        }
    }

    // ===== UTILITY ENDPOINTS =====

    /// <summary>
    /// Returns the list of supported country codes for use in TT profile creation and updates.
    /// </summary>
    [HttpGet("countries")]
    [ProducesResponseType<CountryListResultDto>(StatusCodes.Status200OK)]
    public ActionResult<CountryListResultDto> GetCountries()
    {
        var countries = CountryCodeHelper.GetAllCountries()
            .Select(c => new CountryDto(c.NumericCode, c.Alpha2, c.Name))
            .ToList();

        return Ok(new CountryListResultDto(true, countries.Count, countries));
    }
}
