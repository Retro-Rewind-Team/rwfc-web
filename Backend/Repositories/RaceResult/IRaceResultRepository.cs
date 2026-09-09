using RetroRewindWebsite.Models.Entities.RaceResult;

namespace RetroRewindWebsite.Repositories.RaceResult;

public interface IRaceResultRepository
{
    /// <summary>
    /// Asynchronously adds a collection of race results to the data store.
    /// </summary>
    /// <param name="raceResults">The list of race result entities to add. Cannot be null or contain null elements.</param>
    /// <returns>A task that represents the asynchronous operation.</returns>
    Task AddRaceResultsAsync(List<RaceResultEntity> raceResults);

    /// <summary>
    /// Asynchronously retrieves the race results for the specified room.
    /// </summary>
    /// <param name="roomId">The unique identifier of the room for which to retrieve race results. Cannot be null or empty.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of race result entities for
    /// the specified room. The list will be empty if no results are found.</returns>
    Task<List<RaceResultEntity>> GetRaceResultsByRoomAsync(string roomId);
}
