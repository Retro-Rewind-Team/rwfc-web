using RetroRewindWebsite.Models.DTOs.Player;

namespace RetroRewindWebsite.Services.Application;

public interface IPlayerService
{
    Task<PlayerDto?> GetPlayerAsync(string fc);
    Task<VRHistoryRangeResponseDto?> GetPlayerHistoryAsync(string fc, int? days);
    Task<List<VRHistoryDto>?> GetPlayerRecentHistoryAsync(string fc, int count);
    Task<PlayerDto?> GetLegacyPlayerAsync(string friendCode);
}
