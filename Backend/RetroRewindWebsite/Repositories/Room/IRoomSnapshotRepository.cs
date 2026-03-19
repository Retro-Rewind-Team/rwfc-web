using RetroRewindWebsite.Models.DTOs.Common;
using RetroRewindWebsite.Models.Entities.Room;

namespace RetroRewindWebsite.Repositories.Room;

public interface IRoomSnapshotRepository
{
    Task AddAsync(RoomSnapshotEntity snapshot);

    Task<RoomSnapshotEntity?> GetByDbIdAsync(int id);

    Task<PagedResult<RoomSnapshotEntity>> GetPagedAsync(int page, int pageSize);

    Task<List<RoomSnapshotEntity>> GetByDateRangeAsync(DateTime from, DateTime to);

    Task<RoomSnapshotEntity?> GetLatestAsync();

    Task<RoomSnapshotEntity?> GetNearestAsync(DateTime timestamp);

    Task<int> GetMinIdAsync();

    Task<int> GetMaxIdAsync();

    Task<int> GetPeakPlayerCountAsync(DateTime? since = null);
}
