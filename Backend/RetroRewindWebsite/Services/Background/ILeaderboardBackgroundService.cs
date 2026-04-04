namespace RetroRewindWebsite.Services.Background;

public interface ILeaderboardBackgroundService
{
    /// <summary>
    /// Initiates an asynchronous operation to force a refresh of the underlying data or cache.
    /// </summary>
    /// <returns>A task that represents the asynchronous refresh operation.</returns>
    Task ForceRefreshAsync();

    /// <summary>
    /// The UTC timestamp of the most recent successful leaderboard sync, or null if no sync has completed yet.
    /// </summary>
    DateTime? LastSyncTime { get; }
}
