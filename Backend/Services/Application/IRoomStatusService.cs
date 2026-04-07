using RetroRewindWebsite.Models.DTOs.Common;
using RetroRewindWebsite.Models.DTOs.Room;

namespace RetroRewindWebsite.Services.Application;

public interface IRoomStatusService
{
    // ===== LIVE STATUS =====

    /// <summary>
    /// Returns the most recent room snapshot from the in-memory live cache.
    /// Returns <c>null</c> if no snapshot has been fetched yet (e.g. during startup).
    /// </summary>
    Task<RoomStatusResponseDto?> GetLatestStatusAsync();

    /// <summary>
    /// Returns aggregate statistics for the current snapshot (player/room counts, peak today, peak all-time).
    /// </summary>
    Task<RoomStatusStatsDto> GetStatsAsync();

    // ===== HISTORICAL STATUS (DB) =====

    /// <summary>
    /// Returns the snapshot matching the given database row ID, or <c>null</c> if not found.
    /// </summary>
    Task<RoomStatusResponseDto?> GetStatusByDbIdAsync(int id);

    /// <summary>
    /// Returns the snapshot whose timestamp is closest to <paramref name="timestamp"/>, or <c>null</c> if no snapshots exist.
    /// </summary>
    Task<RoomStatusResponseDto?> GetNearestStatusAsync(DateTime timestamp);

    /// <summary>
    /// Returns a paginated list of historical snapshot summaries, newest first.
    /// </summary>
    Task<PagedResult<RoomSnapshotDto>> GetSnapshotHistoryAsync(int page, int pageSize);

    /// <summary>
    /// Returns all snapshots whose timestamp falls within the specified UTC range (inclusive).
    /// </summary>
    Task<List<RoomSnapshotDto>> GetSnapshotsByDateRangeAsync(DateTime from, DateTime to);

    /// <summary>
    /// Returns the smallest snapshot database ID currently stored.
    /// </summary>
    Task<int> GetMinIdAsync();

    /// <summary>
    /// Returns the largest snapshot database ID currently stored.
    /// </summary>
    Task<int> GetMaxIdAsync();

    // ===== MII DATA =====

    /// <summary>
    /// Returns the PNG image bytes for the Mii belonging to <paramref name="friendCode"/> in the
    /// current live snapshot. Returns <c>null</c> if there is no live snapshot, the FC is not in
    /// any room, or the Mii image cannot be fetched.
    /// </summary>
    Task<byte[]?> GetMiiImageBytesAsync(string friendCode);

    /// <summary>
    /// Returns a FC → base-64 Mii image map for every friend code in <paramref name="friendCodes"/>
    /// that is present in the current live snapshot. Friend codes not found in rooms are silently
    /// omitted. Returns an empty dictionary if there is no live snapshot.
    /// </summary>
    Task<Dictionary<string, string>> GetMiiImageBatchAsync(IReadOnlyList<string> friendCodes);

    // ===== OPERATIONS =====

    /// <summary>
    /// Fetches fresh room data from the Retro WFC API, persists it as a new snapshot, and updates
    /// the in-memory live cache. On failure the live cache is left unchanged (last-known-good).
    /// </summary>
    Task RefreshRoomDataAsync();
}
