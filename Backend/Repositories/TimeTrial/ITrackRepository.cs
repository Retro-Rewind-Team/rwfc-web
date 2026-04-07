using RetroRewindWebsite.Models.Entities.TimeTrial;
using RetroRewindWebsite.Repositories.Common;

namespace RetroRewindWebsite.Repositories.TimeTrial;

public interface ITrackRepository : IRepository<TrackEntity>
{
    /// <summary>
    /// Asynchronously retrieves all track entities from the data source.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of track entities. The list
    /// will be empty if no tracks are found.</returns>
    Task<List<TrackEntity>> GetAllTracksAsync();

    /// <summary>
    /// Retrieves a list of track entities associated with the specified course identifiers.
    /// </summary>
    /// <param name="courseIds">A list of course identifiers for which to retrieve track entities. Cannot be null or empty.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of track entities
    /// corresponding to the provided course identifiers. The list will be empty if no tracks are found for the
    /// specified courses.</returns>
    Task<List<TrackEntity>> GetTracksByCourseIdsAsync(List<short> courseIds);
}
