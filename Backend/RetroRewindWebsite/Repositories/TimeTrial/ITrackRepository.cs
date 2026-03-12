using RetroRewindWebsite.Models.Entities.TimeTrial;
using RetroRewindWebsite.Repositories.Common;

namespace RetroRewindWebsite.Repositories.TimeTrial;

public interface ITrackRepository : IRepository<TrackEntity>
{
    Task<List<TrackEntity>> GetAllTracksAsync();
    Task<TrackEntity?> GetTrackByCourseIdAsync(short courseId);
}
