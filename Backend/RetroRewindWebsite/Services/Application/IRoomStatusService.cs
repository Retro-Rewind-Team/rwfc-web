using RetroRewindWebsite.Models.DTOs.Room;

namespace RetroRewindWebsite.Services.Application;

public interface IRoomStatusService
{
    // ===== QUERIES =====

    /// <summary>
    /// Retrieves the most recent status information for the room asynchronously.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result contains a <see
    /// cref="RoomStatusResponseDto"/> representing the latest room status, or <see langword="null"/> if no status is
    /// available.</returns>
    Task<RoomStatusResponseDto?> GetLatestStatusAsync();

    /// <summary>
    /// Retrieves the status information for a room by its unique identifier asynchronously.
    /// </summary>
    /// <param name="id">The unique identifier of the room whose status is to be retrieved. Must be a positive integer.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a <see
    /// cref="RoomStatusResponseDto"/> with the room's status information if found; otherwise, <see langword="null"/>.</returns>
    Task<RoomStatusResponseDto?> GetStatusByIdAsync(int id);

    /// <summary>
    /// Asynchronously retrieves statistical information about the current room status.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result contains a <see cref="RoomStatusStatsDto"/>
    /// object with aggregated room status statistics.</returns>
    Task<RoomStatusStatsDto> GetStatsAsync();

    /// <summary>
    /// Retrieves the minimum identifier value available in the current context.
    /// </summary>
    /// <returns>The smallest identifier value as an integer. If no identifiers are present, the return value may indicate a
    /// default or sentinel value depending on the implementation.</returns>
    int GetMinimumId();

    /// <summary>
    /// Retrieves the highest identifier value currently available in the collection.
    /// </summary>
    /// <returns>The maximum identifier value as an integer. Returns 0 if the collection is empty.</returns>
    int GetMaximumId();

    // ===== OPERATIONS =====

    /// <summary>
    /// Asynchronously refreshes the room data to ensure the latest information is available.
    /// </summary>
    /// <remarks>Call this method to update the room data from its source. The operation completes when the
    /// data has been refreshed. This method is thread-safe and can be awaited.</remarks>
    /// <returns>A task that represents the asynchronous refresh operation.</returns>
    Task RefreshRoomDataAsync();
}
