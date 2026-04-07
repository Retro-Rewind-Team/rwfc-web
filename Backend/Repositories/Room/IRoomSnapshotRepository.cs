using RetroRewindWebsite.Models.DTOs.Common;
using RetroRewindWebsite.Models.Entities.Room;

namespace RetroRewindWebsite.Repositories.Room;

public interface IRoomSnapshotRepository
{
    /// <summary>
    /// Asynchronously adds a new room snapshot to the data store.
    /// </summary>
    /// <param name="snapshot">The room snapshot entity to add. Cannot be null.</param>
    /// <returns>A task that represents the asynchronous add operation.</returns>
    Task AddAsync(RoomSnapshotEntity snapshot);

    /// <summary>
    /// Asynchronously retrieves a room snapshot entity by its database identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the room snapshot entity in the database.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the room snapshot entity if found;
    /// otherwise, null.</returns>
    Task<RoomSnapshotEntity?> GetByDbIdAsync(int id);

    /// <summary>
    /// Asynchronously retrieves a paged collection of room snapshot entities for the specified page and page size.
    /// </summary>
    /// <param name="page">The zero-based index of the page to retrieve. Must be greater than or equal to 0.</param>
    /// <param name="pageSize">The maximum number of items to include in the page. Must be greater than 0.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a <see
    /// cref="PagedResult{RoomSnapshotEntity}"/> with the room snapshots for the specified page. The result may be empty
    /// if no items are available for the given page.</returns>
    Task<PagedResult<RoomSnapshotEntity>> GetPagedAsync(int page, int pageSize);

    /// <summary>
    /// Asynchronously retrieves a list of room snapshots that fall within the specified date range.
    /// </summary>
    /// <param name="from">The start date and time of the range. Only snapshots occurring on or after this date are included.</param>
    /// <param name="to">The end date and time of the range. Only snapshots occurring on or before this date are included.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of room snapshot entities
    /// within the specified date range. The list is empty if no snapshots are found.</returns>
    Task<List<RoomSnapshotEntity>> GetByDateRangeAsync(DateTime from, DateTime to);

    /// <summary>
    /// Asynchronously retrieves the most recent snapshot of the room, if available.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result contains the latest <see
    /// cref="RoomSnapshotEntity"/> if one exists; otherwise, <see langword="null"/>.</returns>
    Task<RoomSnapshotEntity?> GetLatestAsync();

    /// <summary>
    /// Asynchronously retrieves the room snapshot entity that is closest in time to the specified timestamp.
    /// </summary>
    /// <param name="timestamp">The point in time for which to find the nearest room snapshot.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the nearest room snapshot entity to
    /// the specified timestamp, or null if no snapshot is available.</returns>
    Task<RoomSnapshotEntity?> GetNearestAsync(DateTime timestamp);

    /// <summary>
    /// Asynchronously retrieves the minimum identifier value from the data source.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result contains the smallest identifier value found.
    /// If no identifiers are present, the result is 0.</returns>
    Task<int> GetMinIdAsync();

    /// <summary>
    /// Asynchronously retrieves the highest identifier value from the data source.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result contains the maximum identifier value, or 0
    /// if no identifiers are present.</returns>
    Task<int> GetMaxIdAsync();

    /// <summary>
    /// Asynchronously retrieves the highest recorded player count, optionally since a specified date and time.
    /// </summary>
    /// <param name="since">The earliest date and time from which to consider player counts. If null, considers all available data.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the peak player count as an integer.</returns>
    Task<int> GetPeakPlayerCountAsync(DateTime? since = null);
}
