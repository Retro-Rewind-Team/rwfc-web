using RetroRewindWebsite.Models.DTOs.Leaderboard;
using RetroRewindWebsite.Models.DTOs.Player;

namespace RetroRewindWebsite.Services.Application;

public interface ILeaderboardService
{
    /// <summary>
    /// Retrieves the leaderboard data asynchronously based on the specified request parameters.
    /// </summary>
    /// <param name="request">The criteria and options used to filter and sort the leaderboard results. Cannot be null.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a <see
    /// cref="LeaderboardResponseDto"/> with the leaderboard data matching the request.</returns>
    Task<LeaderboardResponseDto> GetLeaderboardAsync(LeaderboardRequest request);

    /// <summary>
    /// Retrieves the leaderboard data for the in-game leaderboard asynchronously based on the specified page number.
    /// number.
    /// </summary>
    /// <param name="page">The page number of the leaderboard to retrieve. Must be greater than or equal to 1.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a <see
    /// cref="LeaderboardInGameResponseDto"/> with the leaderboard data for the specified page.</returns>
    Task<LeaderboardInGameResponseDto> GetLeaderboardInGameAsync(int page);

    /// <summary>
    /// Retrieves a list of the top players ranked by performance.
    /// </summary>
    /// <param name="count">The maximum number of players to return. Must be greater than zero.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of player data transfer
    /// objects representing the top players. The list will contain up to the specified number of players and will be
    /// empty if no players are available.</returns>
    Task<List<PlayerDto>> GetTopPlayersAsync(int count);

    /// <summary>
    /// Retrieves a list of players who have gained the most virtual rating (VR) within a specified period.
    /// </summary>
    /// <param name="count">The maximum number of top players to return. Must be a positive integer.</param>
    /// <param name="period">The time period over which VR gains are calculated. Supported values may include "daily", "weekly", or
    /// "monthly".</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of player data transfer
    /// objects ordered by VR gain, or an empty list if no players meet the criteria.</returns>
    Task<List<PlayerDto>> GetTopVRGainersAsync(int count, string period);

    /// <summary>
    /// Retrieves a list of the top players currently active for the in-game leaderboard.
    /// </summary>
    /// <param name="count">The maximum number of top players to return. Must be greater than zero.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of player data transfer
    /// objects for the top players. The list will contain up to the specified number of players and will be empty if no
    /// players are found.</returns>
    Task<List<InGamePlayerDto>> GetTopPlayersInGameAsync(int count);

    /// <summary>
    /// Asynchronously retrieves the current leaderboard statistics.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result contains a <see cref="LeaderboardStatsDto"/>
    /// with the latest leaderboard statistics.</returns>
    Task<LeaderboardStatsDto> GetStatsAsync();

    /// <summary>
    /// Retrieves legacy leaderboard data based on the specified request parameters.
    /// </summary>
    /// <param name="request">The parameters used to filter and configure the legacy leaderboard retrieval. Cannot be null.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a <see
    /// cref="LeaderboardResponseDto"/> with the legacy leaderboard data.</returns>
    Task<LeaderboardResponseDto> GetLegacyLeaderboardAsync(LeaderboardRequest request);

    /// <summary>
    /// Determines whether a legacy snapshot exists in the current context asynchronously.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result is <see langword="true"/> if a legacy
    /// snapshot is present; otherwise, <see langword="false"/>.</returns>
    Task<bool> HasLegacySnapshotAsync();
}
