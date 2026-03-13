namespace RetroRewindWebsite.Services.Background;

public interface ILeaderboardBackgroundService
{
    /// <summary>
    /// Initiates an asynchronous operation to force a refresh of the underlying data or cache.
    /// </summary>
    /// <returns>A task that represents the asynchronous refresh operation.</returns>
    Task ForceRefreshAsync();
}
