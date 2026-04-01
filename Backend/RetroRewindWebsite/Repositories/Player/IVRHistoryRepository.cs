using RetroRewindWebsite.Models.Entities.Player;
using RetroRewindWebsite.Repositories.Common;

namespace RetroRewindWebsite.Repositories.Player;

public interface IVRHistoryRepository : IRepository<VRHistoryEntity>
{
    /// <summary>
    /// Retrieves the history records for a specified player within a given date range asynchronously.
    /// </summary>
    /// <param name="playerId">The unique identifier of the player whose history is to be retrieved. Cannot be null or empty.</param>
    /// <param name="fromDate">The start date of the history range. Only records on or after this date will be included.</param>
    /// <param name="toDate">The end date of the history range. Only records on or before this date will be included.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of history entities for the
    /// specified player within the date range. The list will be empty if no records are found.</returns>
    Task<List<VRHistoryEntity>> GetPlayerHistoryAsync(string playerId, DateTime fromDate, DateTime toDate);

    /// <summary>
    /// Retrieves a list of recent history records for the specified player asynchronously.
    /// </summary>
    /// <param name="playerId">The unique identifier of the player whose history records are to be retrieved. Cannot be null or empty.</param>
    /// <param name="count">The maximum number of history records to return. Must be greater than zero. Defaults to 100.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of history records for the
    /// specified player. The list may be empty if no records are found.</returns>
    Task<List<VRHistoryEntity>> GetPlayerHistoryAsync(string playerId, int count = 100);

    /// <summary>
    /// Calculates the VR gain for the specified player over a given time span asynchronously.
    /// </summary>
    /// <param name="playerId">The unique identifier of the player for whom the VR gain is calculated. Cannot be null or empty.</param>
    /// <param name="timeSpan">The duration over which the VR gain is measured. Must be a positive value.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the calculated VR gain as an
    /// integer.</returns>
    Task<int> CalculateVRGainAsync(string playerId, TimeSpan timeSpan);

    /// <summary>
    /// Calculates VR gains for the 24-hour, 7-day, and 30-day periods in a single database
    /// query, avoiding the N×3 round-trips of calling <see cref="CalculateVRGainAsync"/> separately.
    /// </summary>
    Task<(int Gain24h, int Gain7d, int Gain30d)> CalculateAllVRGainsAsync(string playerId);
}
