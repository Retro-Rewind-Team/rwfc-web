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
    /// Retrieves a list of the most recent change history entries.
    /// </summary>
    /// <param name="count">The maximum number of recent changes to retrieve. Must be positive. Defaults to 50 if not specified.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of recent change history
    /// entries. The list will be empty if no changes are available.</returns>
    Task<List<VRHistoryEntity>> GetRecentChangesAsync(int count = 50);

    /// <summary>
    /// Calculates the VR gain for the specified player over a given time span asynchronously.
    /// </summary>
    /// <param name="playerId">The unique identifier of the player for whom the VR gain is calculated. Cannot be null or empty.</param>
    /// <param name="timeSpan">The duration over which the VR gain is measured. Must be a positive value.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the calculated VR gain as an
    /// integer.</returns>
    Task<int> CalculateVRGainAsync(string playerId, TimeSpan timeSpan);

    /// <summary>
    /// Asynchronously removes records older than the specified cutoff date.
    /// </summary>
    /// <param name="cutoffDate">The date that defines the threshold for record removal. Records with a date earlier than this value will be
    /// deleted.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the number of records deleted.</returns>
    Task<int> CleanupOldRecordsAsync(DateTime cutoffDate);
}
