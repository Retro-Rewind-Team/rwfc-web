namespace RetroRewindWebsite.Services.Background;

public interface IRoomStatusBackgroundService
{
    /// <summary>
    /// Initiates an asynchronous operation to force a refresh of the underlying data or cache.
    /// </summary>
    /// <remarks>Call this method to ensure the latest data is retrieved, bypassing any cached values. The
    /// operation may take longer depending on the source and network conditions.</remarks>
    /// <returns>A task that represents the asynchronous refresh operation.</returns>
    Task ForceRefreshAsync();
}
