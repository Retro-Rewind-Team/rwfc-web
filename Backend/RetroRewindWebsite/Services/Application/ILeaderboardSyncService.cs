namespace RetroRewindWebsite.Services.Application;

public interface ILeaderboardSyncService
{
    /// <summary>
    /// Asynchronously updates the current state by retrieving the latest data from the API.
    /// </summary>
    /// <returns>A task that represents the asynchronous refresh operation.</returns>
    Task RefreshFromApiAsync();

    /// <summary>
    /// Asynchronously refreshes the rankings data to ensure it reflects the latest available information.
    /// </summary>
    /// <remarks>Call this method to update the rankings when new data is available. The operation may take
    /// time depending on the data source and network conditions.</remarks>
    /// <returns>A task that represents the asynchronous refresh operation.</returns>
    Task RefreshRankingsAsync();
}
