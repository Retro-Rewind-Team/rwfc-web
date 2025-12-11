using RetroRewindWebsite.Models.DTOs;

namespace RetroRewindWebsite.Services.Application
{
    public interface ILeaderboardManager
    {
        Task<LeaderboardResponseDto> GetLeaderboardAsync(LeaderboardRequest request);
        Task<List<PlayerDto>> GetTopPlayersAsync(int count, bool activeOnly = false);
        Task<PlayerDto?> GetPlayerAsync(string fc);
        Task<LeaderboardStatsDto> GetStatsAsync();
        Task RefreshFromApiAsync();
        Task RefreshRankingsAsync();
        Task<string?> GetPlayerMiiAsync(string fc);
        Task<Dictionary<string, string?>> GetPlayerMiisBatchAsync(List<string> friendCodes);
        Task<bool> HasLegacySnapshotAsync();
        Task<LeaderboardResponseDto> GetLegacyLeaderboardAsync(LeaderboardRequest request);
        Task<Dictionary<string, string?>> GetLegacyPlayerMiisBatchAsync(List<string> friendCodes);
        Task<PlayerDto?> GetLegacyPlayerAsync(string friendCode);
    }
}