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
    /// Asynchronously retrieves the track associated with the specified course identifier.
    /// </summary>
    /// <param name="courseId">The unique identifier of the course for which to retrieve the track. Must be a valid course ID.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the track entity associated with the
    /// specified course, or null if no track is found.</returns>
    Task<TrackEntity?> GetTrackByCourseIdAsync(short courseId);
}
