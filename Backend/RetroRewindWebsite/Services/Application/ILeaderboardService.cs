using RetroRewindWebsite.Models.DTOs.Leaderboard;
using RetroRewindWebsite.Models.DTOs.Player;

namespace RetroRewindWebsite.Services.Application;

public interface ILeaderboardService
{
    Task<LeaderboardResponseDto> GetLeaderboardAsync(LeaderboardRequest request);
    Task<List<PlayerDto>> GetTopPlayersAsync(int count);
    Task<List<PlayerDto>> GetTopPlayersNoMiiAsync(int count);
    Task<List<PlayerDto>> GetTopVRGainersAsync(int count, string period);
    Task<LeaderboardStatsDto> GetStatsAsync();
    Task<LeaderboardResponseDto> GetLegacyLeaderboardAsync(LeaderboardRequest request);
    Task<bool> HasLegacySnapshotAsync();
}