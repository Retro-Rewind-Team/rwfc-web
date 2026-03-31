using RetroRewindWebsite.Models.DTOs.Common;
using RetroRewindWebsite.Models.DTOs.Room;

namespace RetroRewindWebsite.Services.Application;

public interface IRoomStatusService
{
    // ===== LIVE STATUS =====

    Task<RoomStatusResponseDto?> GetLatestStatusAsync();

    Task<RoomStatusStatsDto> GetStatsAsync();

    // ===== HISTORICAL STATUS (DB) =====

    Task<RoomStatusResponseDto?> GetStatusByDbIdAsync(int id);

    Task<RoomStatusResponseDto?> GetNearestStatusAsync(DateTime timestamp);

    Task<PagedResult<RoomSnapshotDto>> GetSnapshotHistoryAsync(int page, int pageSize);

    Task<List<RoomSnapshotDto>> GetSnapshotsByDateRangeAsync(DateTime from, DateTime to);

    Task<int> GetMinIdAsync();

    Task<int> GetMaxIdAsync();

    // ===== OPERATIONS =====

    Task RefreshRoomDataAsync();
}
