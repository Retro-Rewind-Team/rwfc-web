using RetroRewindWebsite.Models.Entities.RaceResult;

namespace RetroRewindWebsite.Repositories.RaceResult;

public interface IRaceResultRepository
{
    /// <summary>
    /// Asynchronously adds a collection of race results to the data store. Rows that a concurrent
    /// tick already wrote are skipped rather than aborting the rest of the batch.
    /// </summary>
    /// <param name="raceResults">The list of race result entities to add. Cannot be null or contain null elements.</param>
    /// <returns>A task that represents the asynchronous operation, returning the number of rows stored.</returns>
    Task<int> AddRaceResultsAsync(List<RaceResultEntity> raceResults);

    /// <summary>
    /// Asynchronously retrieves the race results for the specified room.
    /// </summary>
    /// <param name="roomId">The unique identifier of the room for which to retrieve race results. Cannot be null or empty.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of race result entities for
    /// the specified room. The list will be empty if no results are found.</returns>
    Task<List<RaceResultEntity>> GetRaceResultsByRoomAsync(string roomId);

    /// <summary>
    /// Sets the stored finish position of existing race results. Used when results that arrive in a
    /// later collection tick change the ranking of rows that were stored earlier.
    /// </summary>
    /// <param name="finishPosById">Race result id to its new finish position.</param>
    /// <returns>A task that represents the asynchronous operation, returning the number of rows updated.</returns>
    Task<int> UpdateFinishPositionsAsync(IReadOnlyDictionary<int, short> finishPosById);
}
