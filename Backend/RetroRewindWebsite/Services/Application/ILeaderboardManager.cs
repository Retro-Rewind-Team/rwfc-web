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

        // New Mii-specific methods
        Task<string?> GetPlayerMiiAsync(string fc);
        Task<Dictionary<string, string?>> GetPlayerMiisBatchAsync(List<string> friendCodes);
    }
}