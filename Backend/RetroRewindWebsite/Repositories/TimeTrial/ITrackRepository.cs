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
}
