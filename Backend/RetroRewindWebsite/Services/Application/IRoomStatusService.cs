using RetroRewindWebsite.Models.DTOs;

namespace RetroRewindWebsite.Services.Application
{
    public interface IRoomStatusService
    {
        // ===== QUERIES =====

        /// <summary>
        /// Get the latest room status snapshot
        /// </summary>
        Task<RoomStatusResponseDto?> GetLatestStatusAsync();

        /// <summary>
        /// Get room status snapshot by ID
        /// </summary>
        Task<RoomStatusResponseDto?> GetStatusByIdAsync(int id);

        /// <summary>
        /// Get room status statistics
        /// </summary>
        Task<RoomStatusStatsDto> GetStatsAsync();

        /// <summary>
        /// Get minimum available snapshot ID
        /// </summary>
        int GetMinimumId();

        /// <summary>
        /// Get maximum available snapshot ID
        /// </summary>
        int GetMaximumId();

        // ===== OPERATIONS =====

        /// <summary>
        /// Refresh room data from external API
        /// </summary>
        Task RefreshRoomDataAsync();
    }
}