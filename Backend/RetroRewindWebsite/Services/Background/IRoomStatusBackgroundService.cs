namespace RetroRewindWebsite.Services.Background
{
    public interface IRoomStatusBackgroundService
    {
        /// <summary>
        /// Manually trigger room status refresh
        /// </summary>
        Task ForceRefreshAsync();
    }
}