namespace RetroRewindWebsite.Services.Background
{
    public interface ILeaderboardBackgroundService
    {
        Task StartAsync(CancellationToken cancellationToken = default);
        Task StopAsync(CancellationToken cancellationToken = default);
        Task ForceRefreshAsync();
    }
}
