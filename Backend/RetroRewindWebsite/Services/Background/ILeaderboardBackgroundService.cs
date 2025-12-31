namespace RetroRewindWebsite.Services.Background
{
    public interface ILeaderboardBackgroundService
    {
        /// <summary>
        /// Manually trigger a leaderboard refresh
        /// </summary>
        Task ForceRefreshAsync();
    }
}
