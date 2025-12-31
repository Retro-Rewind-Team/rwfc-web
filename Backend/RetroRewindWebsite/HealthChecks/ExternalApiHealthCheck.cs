using Microsoft.Extensions.Diagnostics.HealthChecks;
using RetroRewindWebsite.Services.External;

namespace RetroRewindWebsite.HealthChecks
{
    public class ExternalApiHealthCheck : IHealthCheck
    {
        private readonly IRetroWFCApiClient _apiClient;
        private readonly ILogger<ExternalApiHealthCheck> _logger;

        private const int HealthCheckTimeoutSeconds = 5;

        public ExternalApiHealthCheck(
            IRetroWFCApiClient apiClient,
            ILogger<ExternalApiHealthCheck> logger)
        {
            _apiClient = apiClient;
            _logger = logger;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                cts.CancelAfter(TimeSpan.FromSeconds(HealthCheckTimeoutSeconds));

                var groups = await _apiClient.GetActiveGroupsAsync();

                return groups.Count >= 0
                    ? HealthCheckResult.Healthy($"External API responding. Found {groups.Count} groups.")
                    : HealthCheckResult.Degraded("External API returned no data");
            }
            catch (TaskCanceledException)
            {
                return HealthCheckResult.Degraded($"External API timeout (>{HealthCheckTimeoutSeconds}s)");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "External API health check failed");
                return HealthCheckResult.Unhealthy("External API unreachable", ex);
            }
        }
    }
}