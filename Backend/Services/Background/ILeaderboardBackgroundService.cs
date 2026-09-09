namespace RetroRewindWebsite.Services.Background;

public interface ILeaderboardBackgroundService
{

    /// <summary>
    /// The UTC timestamp of the most recent successful leaderboard sync, or null if no sync has completed yet.
    /// </summary>
    DateTime? LastSyncTime { get; }
}
