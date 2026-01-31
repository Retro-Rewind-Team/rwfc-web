using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Repositories;
using RetroRewindWebsite.Services.Domain;

namespace RetroRewindWebsite.Controllers
{
    /// <summary>
    /// One-time migration endpoints - deploy, run, then remove this controller
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class MigrationController : ControllerBase
    {
        private readonly ITimeTrialRepository _timeTrialRepository;
        private readonly IGhostFileService _ghostFileService;
        private readonly ILogger<MigrationController> _logger;

        public MigrationController(
            ITimeTrialRepository timeTrialRepository,
            IGhostFileService ghostFileService,
            ILogger<MigrationController> logger)
        {
            _timeTrialRepository = timeTrialRepository;
            _ghostFileService = ghostFileService;
            _logger = logger;
        }

        /// <summary>
        /// Updates all ghost submissions with correct DriftCategory values by re-parsing RKG files
        /// This reads the transmission bits from each ghost file to determine the actual drift category
        /// </summary>
        [HttpPost("fix-drift-categories")]
        public async Task<ActionResult<object>> FixAllDriftCategories()
        {
            try
            {
                _logger.LogWarning("=== STARTING DRIFT CATEGORY MIGRATION ===");

                var submissions = await _timeTrialRepository.SearchGhostSubmissionsAsync(
                    limit: int.MaxValue);

                _logger.LogInformation("Found {Count} ghost submissions to process", submissions.Count);

                int updated = 0;
                int errors = 0;
                int skipped = 0;
                int unchanged = 0;

                foreach (var submission in submissions)
                {
                    try
                    {
                        // Check if ghost file exists
                        if (!System.IO.File.Exists(submission.GhostFilePath))
                        {
                            _logger.LogWarning(
                                "Ghost file not found for submission {Id}: {Path}",
                                submission.Id, submission.GhostFilePath);
                            skipped++;
                            continue;
                        }

                        // Parse the ghost file to get correct drift category
                        using var fileStream = System.IO.File.OpenRead(submission.GhostFilePath);
                        var parseResult = await _ghostFileService.ParseGhostFileAsync(fileStream);

                        if (!parseResult.Success)
                        {
                            _logger.LogError(
                                "Failed to parse ghost file for submission {Id}: {Error}",
                                submission.Id, parseResult.ErrorMessage);
                            errors++;
                            continue;
                        }

                        // Check if update is needed
                        if (submission.DriftCategory != parseResult.DriftCategory)
                        {
                            _logger.LogInformation(
                                "Updating submission {Id}: VehicleId={VehicleId}, Old DriftCategory={Old}, New={New}",
                                submission.Id, submission.VehicleId,
                                submission.DriftCategory, parseResult.DriftCategory);

                            // Update via raw SQL
                            await _timeTrialRepository.UpdateDriftCategoryAsync(
                                submission.Id, parseResult.DriftCategory);

                            updated++;
                        }
                        else
                        {
                            unchanged++;
                        }

                        // Progress logging every 25 submissions
                        if ((updated + errors + skipped + unchanged) % 25 == 0)
                        {
                            _logger.LogInformation(
                                "Progress: {Processed}/{Total} (Updated: {Updated}, Unchanged: {Unchanged}, Errors: {Errors}, Skipped: {Skipped})",
                                updated + errors + skipped + unchanged, submissions.Count,
                                updated, unchanged, errors, skipped);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error processing submission {Id}", submission.Id);
                        errors++;
                    }
                }

                var result = new
                {
                    Success = true,
                    Message = "Drift category migration completed",
                    TotalSubmissions = submissions.Count,
                    Updated = updated,
                    Unchanged = unchanged,
                    Errors = errors,
                    Skipped = skipped
                };

                _logger.LogWarning(
                    "=== DRIFT CATEGORY MIGRATION COMPLETE === " +
                    "Total: {Total}, Updated: {Updated}, Unchanged: {Unchanged}, Errors: {Errors}, Skipped: {Skipped}",
                    submissions.Count, updated, unchanged, errors, skipped);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Drift category migration failed");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { Success = false, Message = $"Migration failed: {ex.Message}" });
            }
        }

        /// <summary>
        /// Preview what would change without actually updating
        /// </summary>
        [HttpGet("preview-drift-category-changes")]
        public async Task<ActionResult<object>> PreviewDriftCategoryChanges()
        {
            try
            {
                var submissions = await _timeTrialRepository.SearchGhostSubmissionsAsync(
                    limit: int.MaxValue);

                var changes = new List<object>();
                int wouldUpdate = 0;

                foreach (var submission in submissions.Take(100)) // Preview first 100
                {
                    if (!System.IO.File.Exists(submission.GhostFilePath))
                        continue;

                    using var fileStream = System.IO.File.OpenRead(submission.GhostFilePath);
                    var parseResult = await _ghostFileService.ParseGhostFileAsync(fileStream);

                    if (!parseResult.Success)
                        continue;

                    if (submission.DriftCategory != parseResult.DriftCategory)
                    {
                        changes.Add(new
                        {
                            SubmissionId = submission.Id,
                            VehicleId = submission.VehicleId,
                            CurrentDriftCategory = submission.DriftCategory,
                            CorrectDriftCategory = parseResult.DriftCategory,
                            TrackName = submission.Track?.Name ?? "Unknown"
                        });
                        wouldUpdate++;
                    }
                }

                return Ok(new
                {
                    Success = true,
                    Message = "Preview of first 100 submissions",
                    WouldUpdate = wouldUpdate,
                    SampleChanges = changes
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Preview failed");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { Success = false, Message = $"Preview failed: {ex.Message}" });
            }
        }
    }
}