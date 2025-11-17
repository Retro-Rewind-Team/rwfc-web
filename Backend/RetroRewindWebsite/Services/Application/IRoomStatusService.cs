using RetroRewindWebsite.Models.DTOs;

namespace RetroRewindWebsite.Services.Application
{
    public interface IRoomStatusService
    {
        Task<RoomStatusResponseDto?> GetLatestStatusAsync();
        Task<RoomStatusResponseDto?> GetStatusByIdAsync(int id);
        int GetMinimumId();
        int GetMaximumId();
        Task<RoomStatusStatsDto> GetStatsAsync();
        Task RefreshRoomDataAsync();
    }
}