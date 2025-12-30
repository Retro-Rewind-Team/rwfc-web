namespace RetroRewindWebsite.Services.Background
{
    public interface IMiiPreFetchBackgroundService
    {
        Task PreFetchMiiImagesAsync(CancellationToken cancellationToken = default);
    }
}