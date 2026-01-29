using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Helpers;

namespace RetroRewindWebsite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecoveryController : ControllerBase
    {
        private readonly GhostSubmissionRecoveryScript _recoveryScript;
        private readonly ILogger<RecoveryController> _logger;

        public RecoveryController(
            GhostSubmissionRecoveryScript recoveryScript,
            ILogger<RecoveryController> logger)
        {
            _recoveryScript = recoveryScript;
            _logger = logger;
        }

        /// <summary>
        /// DANGER: Recovers ghost submissions from disk
        /// </summary>
        [HttpPost("recover-ghosts")]
        public async Task<ActionResult<RecoveryResultDto>> RecoverGhostSubmissions()
        {
            try
            {
                _logger.LogWarning("Ghost submission recovery initiated!");

                var result = await _recoveryScript.RecoverAllGhostSubmissions();

                return Ok(new RecoveryResultDto
                {
                    Success = result.Success,
                    TotalFiles = result.TotalFiles,
                    SuccessCount = result.SuccessCount,
                    FailedCount = result.FailedCount,
                    ErrorMessage = result.ErrorMessage,
                    FailedFiles = result.FailedFiles.Select(f => new FailedFileDto
                    {
                        FilePath = f.FilePath,
                        Reason = f.Reason
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Recovery script failed");
                return StatusCode(500, new RecoveryResultDto
                {
                    Success = false,
                    ErrorMessage = $"Recovery failed: {ex.Message}"
                });
            }
        }
    }

    public class RecoveryResultDto
    {
        public bool Success { get; set; }
        public int TotalFiles { get; set; }
        public int SuccessCount { get; set; }
        public int FailedCount { get; set; }
        public string? ErrorMessage { get; set; }
        public List<FailedFileDto> FailedFiles { get; set; } = new();
    }

    public class FailedFileDto
    {
        public string FilePath { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
    }
}