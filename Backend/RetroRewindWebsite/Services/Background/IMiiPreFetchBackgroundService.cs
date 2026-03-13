namespace RetroRewindWebsite.Services.Background;

public interface IMiiPreFetchBackgroundService
{
    /// <summary>
    /// Initiates an asynchronous operation to prefetch Mii images for later use.
    /// </summary>
    /// <remarks>Prefetching Mii images can improve performance for subsequent image retrievals. The operation
    /// may be canceled if the provided cancellation token is triggered.</remarks>
    /// <param name="cancellationToken">A cancellation token that can be used to cancel the prefetch operation.</param>
    /// <returns>A task that represents the asynchronous prefetch operation.</returns>
    Task PreFetchMiiImagesAsync(CancellationToken cancellationToken = default);
}
