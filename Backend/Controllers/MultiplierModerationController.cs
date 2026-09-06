using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Models.DTOs.Multiplier;
using RetroRewindWebsite.Services.Application;

namespace RetroRewindWebsite.Controllers;

/// <summary>
/// Manages scheduled multiplier ranges. Only used by wfc-bot.
/// All endpoints require Bearer token authentication via <see cref="Middleware.ApiKeyAuthenticationMiddleware"/>.
/// </summary>
[ApiController]
[Route("api/moderation/multiplier")]
public class MultiplierModerationController : ControllerBase
{
    private readonly IMultiplierService _multiplierService;
    private readonly ILogger<MultiplierModerationController> _logger;

    public MultiplierModerationController(IMultiplierService multiplierService, ILogger<MultiplierModerationController> logger)
    {
        _multiplierService = multiplierService;
        _logger = logger;
    }

    [HttpPost]
    [ProducesResponseType<MultiplierResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<MultiplierResultDto>> Create([FromBody] CreateMultiplierRequest request)
    {
        try
        {
            var result = await _multiplierService.CreateAsync(request);
            return result.Success ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating multiplier for channel {Channel}", request.Channel);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while creating the multiplier");
        }
    }

    [HttpGet]
    [ProducesResponseType<MultiplierListResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<MultiplierListResultDto>> GetAll([FromQuery] string? channel)
    {
        try
        {
            var result = await _multiplierService.GetAllAsync(channel);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing multipliers for channel {Channel}", channel);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while listing multipliers");
        }
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType<MultiplierDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<MultiplierDto>> GetById(int id)
    {
        try
        {
            var result = await _multiplierService.GetByIdAsync(id);
            return result == null ? NotFound($"Multiplier with id {id} not found") : Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving multiplier {Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while retrieving the multiplier");
        }
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType<MultiplierResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<MultiplierResultDto>> Update(int id, [FromBody] UpdateMultiplierRequest request)
    {
        try
        {
            var result = await _multiplierService.UpdateAsync(id, request);
            return result.Success ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating multiplier {Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while updating the multiplier");
        }
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType<MultiplierDeletionResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<MultiplierDeletionResultDto>> Delete(int id)
    {
        try
        {
            var result = await _multiplierService.DeleteAsync(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting multiplier {Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "An error occurred while deleting the multiplier");
        }
    }
}
