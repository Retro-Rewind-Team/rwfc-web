namespace RetroRewindWebsite.Services.Application;

public interface IRaceResultService
{
    /// <summary>
    /// Asynchronously collects race results from the configured data source.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task completes when the race results have been collected.</returns>
    Task CollectRaceResultsAsync();
}