namespace RetroRewindWebsite.Services.Application;

public interface ILeaderboardSyncService
{
    Task RefreshFromApiAsync();
    Task RefreshRankingsAsync();
}
