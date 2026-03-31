using RetroRewindWebsite.Models.Entities.RaceResult;
using RetroRewindWebsite.Repositories.Common;

namespace RetroRewindWebsite.Repositories.RaceResult;

public interface IRaceResultRepository : IRepository<RaceResultEntity>
{
    /// <summary>
    /// Determines whether a race result exists for the specified room, race number, and profile identifier.
    /// </summary>
    /// <param name="roomId">The unique identifier of the room in which the race was held. Cannot be null or empty.</param>
    /// <param name="raceNumber">The sequential number of the race within the specified room. Must be greater than zero.</param>
    /// <param name="profileId">The unique identifier of the profile to check for an existing race result.</param>
    /// <returns>A task that represents the asynchronous operation. The task result is <see langword="true"/> if a race result
    /// exists for the specified parameters; otherwise, <see langword="false"/>.</returns>
    Task<bool> RaceResultExistsAsync(string roomId, int raceNumber, long profileId);

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
