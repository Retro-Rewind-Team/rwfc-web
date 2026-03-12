using RetroRewindWebsite.Models.DTOs.Common;
using RetroRewindWebsite.Models.Entities.Player;
using RetroRewindWebsite.Repositories.Common;

namespace RetroRewindWebsite.Repositories.Player;

public interface IPlayerRepository : IRepository<PlayerEntity>
{
    // ===== BASIC QUERIES =====
    Task<PlayerEntity?> GetByPidAsync(string pid);
    Task<PlayerEntity?> GetByFcAsync(string fc);
    Task<List<PlayerEntity>> GetAllAsync();
    Task<List<PlayerEntity>> GetPlayersByFriendCodesAsync(List<string> friendCodes);

    // ===== LEADERBOARD QUERIES =====
    Task<PagedResult<PlayerEntity>> GetLeaderboardPageAsync(int page, int pageSize, string? search, string sortBy, bool ascending);
    Task<List<PlayerEntity>> GetTopPlayersAsync(int count);
    Task<List<PlayerEntity>> GetTopVRGainersAsync(int count, TimeSpan period);
    Task<List<PlayerEntity>> GetPlayersAroundRankAsync(int rank, int window);

    // ===== STATISTICS =====
    Task<int> GetTotalPlayersCountAsync();
    Task<int> GetSuspiciousPlayersCountAsync();

    // ===== MODIFICATIONS =====
    Task UpdatePlayerRanksAsync();

    // ===== BATCH OPERATIONS =====
    Task<List<PlayerEntity>> GetPlayersBatchAsync(int skip, int take);
    Task<List<string>> GetPlayerPidsBatchAsync(int skip, int take);
    Task UpdatePlayersAsync(List<PlayerEntity> players);
    Task UpdatePlayerVRGainsBatchAsync(Dictionary<string, (int gain24h, int gain7d, int gain30d)> vrGains);

    // ===== MII OPERATIONS =====
    Task<List<PlayerEntity>> GetPlayersNeedingMiiImagesAsync(int count);
    Task UpdatePlayerMiiImageAsync(string pid, string miiImageBase64);

    // ===== LEGACY OPERATIONS =====
    Task<bool> HasLegacySnapshotAsync();
    Task<PagedResult<LegacyPlayerEntity>> GetLegacyLeaderboardPageAsync(int page, int pageSize, string? search, string sortBy, bool ascending);
    Task<LegacyPlayerEntity?> GetLegacyPlayerByFriendCodeAsync(string friendCode);
    Task<List<LegacyPlayerEntity>> GetLegacyPlayersByFriendCodesAsync(List<string> friendCodes);
    Task<int> GetLegacyPlayersCountAsync();
    Task<int> GetLegacySuspiciousPlayersCountAsync();
}
