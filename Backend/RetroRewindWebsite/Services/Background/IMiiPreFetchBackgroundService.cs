namespace RetroRewindWebsite.Services.Background
{
    public interface IMiiPreFetchBackgroundService
    {
        /// <summary>
        /// Manually trigger Mii pre-fetch batch
        /// </summary>
        Task PreFetchMiiImagesAsync(CancellationToken cancellationToken = default);
    }
}