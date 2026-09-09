using Microsoft.Extensions.Diagnostics.HealthChecks;
using RetroRewindWebsite.Services.External;

namespace RetroRewindWebsite.HealthChecks;

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

            // Player count rather than the full group list: it is the cheapest call on the API,
            // and it is the only one that reports failure. GetActiveGroupsAsync swallows every
            // error and returns an empty list, which is right for the room browser but leaves a
            // health check unable to tell "nobody online" from "the API is down".
            var playerCount = await _apiClient.GetPlayerCountAsync(cts.Token);

            return playerCount.HasValue
                ? HealthCheckResult.Healthy($"External API responding. {playerCount.Value} players online.")
                : HealthCheckResult.Unhealthy("External API returned an error or unreadable response");
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            // Our own deadline elapsed rather than the host shutting the check down.
            return HealthCheckResult.Degraded($"External API timeout (>{HealthCheckTimeoutSeconds}s)");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "External API health check failed");
            return HealthCheckResult.Unhealthy("External API unreachable", ex);
        }
    }
}
