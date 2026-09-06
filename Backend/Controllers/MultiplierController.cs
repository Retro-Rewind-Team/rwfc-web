using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Services.Application;
using System.Globalization;

namespace RetroRewindWebsite.Controllers;

/// <summary>
/// Public endpoint game clients query for the currently active multiplier value. Replaces the
/// static multiplier.txt / multiplierBeta.txt files previously served for this purpose.
/// </summary>
[ApiController]
[Route("api/multiplier")]
public class MultiplierController : ControllerBase
{
    private readonly IMultiplierService _multiplierService;
    private readonly ILogger<MultiplierController> _logger;

    public MultiplierController(IMultiplierService multiplierService, ILogger<MultiplierController> logger)
    {
        _multiplierService = multiplierService;
        _logger = logger;
    }

    /// <summary>
    /// Returns the currently active multiplier value as plain text (e.g. "1.5"), matching the
    /// format of the static files this endpoint replaces. Defaults to the "stable" channel.
    /// </summary>
    [HttpGet]
    [Produces("text/plain")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetActiveMultiplier([FromQuery] string? channel)
    {
        try
        {
            var value = await _multiplierService.GetActiveValueAsync(channel ?? string.Empty);
            return Content(value.ToString(CultureInfo.InvariantCulture), "text/plain");
        }
        catch (ArgumentException)
        {
            return BadRequest($"Unknown channel '{channel}'");
        }
    }
}
