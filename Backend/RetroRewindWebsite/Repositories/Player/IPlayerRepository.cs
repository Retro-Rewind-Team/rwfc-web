using RetroRewindWebsite.Models.DTOs.Common;
using RetroRewindWebsite.Models.Entities.Player;
using RetroRewindWebsite.Repositories.Common;

namespace RetroRewindWebsite.Repositories.Player;

public interface IPlayerRepository : IRepository<PlayerEntity>
{
    // ===== BASIC QUERIES =====

    /// <summary>
    /// Retrieves a player entity by its unique player identifier (PID).
    /// </summary>
    /// <param name="pid">The unique identifier of the player to retrieve. Cannot be null or empty.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the player entity if found;
    /// otherwise, null.</returns>
    Task<PlayerEntity?> GetByPidAsync(string pid);

    /// <summary>
    /// Retrieves a player entity that matches the specified FC (Friend Code) asynchronously.
    /// </summary>
    /// <param name="fc">The FC (Friend Code) used to identify the player. Cannot be null or empty.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the player entity if found;
    /// otherwise, null.</returns>
    Task<PlayerEntity?> GetByFcAsync(string fc);

    /// <summary>
    /// Retrieves a list of player entities that match the specified friend codes asynchronously.
    /// </summary>
    /// <param name="friendCodes">A list of friend codes to search for. Cannot be null or contain null or empty values.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of player entities
    /// corresponding to the provided friend codes. The list will be empty if no players are found.</returns>
    Task<List<PlayerEntity>> GetPlayersByFriendCodesAsync(List<string> friendCodes);

    /// <summary>
    /// Asynchronously retrieves a list of player entities corresponding to the specified player IDs.
    /// </summary>
    /// <param name="pids">A list of player IDs for which to retrieve player entities. Cannot be null or contain null or empty elements.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of player entities matching
    /// the provided player IDs. The list will be empty if no players are found.</returns>
    Task<List<PlayerEntity>> GetPlayersByPidsAsync(List<string> pids);

    // ===== LEADERBOARD QUERIES =====

    /// <summary>
    /// Retrieves a paged list of leaderboard players, optionally filtered and sorted according to the specified
    /// criteria.
    /// </summary>
    /// <param name="page">The zero-based index of the leaderboard page to retrieve. Must be greater than or equal to 0.</param>
    /// <param name="pageSize">The maximum number of players to include in the page. Must be greater than 0.</param>
    /// <param name="search">An optional search string used to filter players by name or other relevant criteria. If null or empty, no
    /// filtering is applied.</param>
    /// <param name="sortBy">The field name by which to sort the leaderboard results. Must correspond to a valid sortable property of the
    /// player entity.</param>
    /// <param name="ascending">A value indicating whether the results should be sorted in ascending order. Set to <see langword="true"/> for
    /// ascending; otherwise, results are sorted in descending order.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a paged collection of player
    /// entities matching the specified criteria. The collection may be empty if no players match.</returns>
    Task<PagedResult<PlayerEntity>> GetLeaderboardPageAsync(int page, int pageSize, string? search, string sortBy, bool ascending);

    /// <summary>
    /// Asynchronously retrieves a list of the top players ranked by performance.
    /// </summary>
    /// <param name="count">The maximum number of top players to retrieve. Must be greater than zero.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of top players, ordered by
    /// ranking. The list will contain up to the specified number of players, or fewer if not enough players are
    /// available.</returns>
    Task<List<PlayerEntity>> GetTopPlayersAsync(int count);

    /// <summary>
    /// Retrieves a paged list of leaderboard entries excluding players with Mii avatars.
    /// </summary>
    /// <param name="page">The zero-based index of the leaderboard page to retrieve. Must be greater than or equal to 0.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a paged collection of player
    /// entities without Mii avatars.</returns>
    Task<PagedResult<PlayerEntity>> GetLeaderboardPageNoMiiAsync(int page);

    // ===== STATISTICS =====

    /// <summary>
    /// Asynchronously retrieves the total number of players currently registered in the system.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result contains the total count of registered
    /// players as an integer.</returns>
    Task<int> GetTotalPlayersCountAsync();

    /// <summary>
    /// Asynchronously retrieves the number of players flagged as suspicious.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result contains the total count of suspicious
    /// players.</returns>
    Task<int> GetSuspiciousPlayersCountAsync();

    // ===== MODIFICATIONS =====

    /// <summary>
    /// Asynchronously updates the ranks of all players based on the latest game data.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task completes when all player ranks have been updated.</returns>
    Task UpdatePlayerRanksAsync();

    // ===== BATCH OPERATIONS =====

    /// <summary>
    /// Retrieves a batch of player IDs asynchronously, allowing for pagination of results.
    /// </summary>
    /// <param name="skip">The number of player IDs to skip before starting to collect the batch. Must be zero or greater.</param>
    /// <param name="take">The maximum number of player IDs to retrieve in the batch. Must be greater than zero.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of player IDs as strings. The
    /// list may be empty if no player IDs are available in the specified range.</returns>
    Task<List<string>> GetPlayerPidsBatchAsync(int skip, int take);

    /// <summary>
    /// Updates the VR gains for multiple players asynchronously in batch.
    /// </summary>
    /// <param name="vrGains">A dictionary containing player identifiers as keys and tuples representing VR gains for 24 hours, 7 days, and 30
    /// days as values. Each tuple must contain non-negative integers.</param>
    /// <returns>A task that represents the asynchronous update operation.</returns>
    Task UpdatePlayerVRGainsBatchAsync(Dictionary<string, (int gain24h, int gain7d, int gain30d)> vrGains);

    /// <summary>
    /// Inserts multiple player entities in a single database round-trip.
    /// </summary>
    Task AddRangeAsync(IEnumerable<PlayerEntity> players);

    /// <summary>
    /// Updates multiple player entities in a single database round-trip.
    /// </summary>
    Task UpdateRangeAsync(IEnumerable<PlayerEntity> players);

}
