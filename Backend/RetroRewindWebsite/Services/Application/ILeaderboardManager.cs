using RetroRewindWebsite.Models.DTOs;

namespace RetroRewindWebsite.Services.Application
{
    public interface ILeaderboardManager
    {
        // ===== LEADERBOARD QUERIES =====

        /// <summary>
        /// Get paginated leaderboard with filtering and sorting
        /// </summary>
        Task<LeaderboardResponseDto> GetLeaderboardAsync(LeaderboardRequest request);

        /// <summary>
        /// Get top N players by rank
        /// </summary>
        Task<List<PlayerDto>> GetTopPlayersAsync(int count);

        /// <summary>
        /// Get top N players by rank without mii images
        /// </summary>
        Task<List<PlayerDto>> GetTopPlayersNoMiiAsync(int count);

        /// <summary>
        /// Get top VR gainers for a given time period
        /// </summary>
        Task<List<PlayerDto>> GetTopVRGainersAsync(int count, string period);

        /// <summary>
        /// Get leaderboard statistics
        /// </summary>
        Task<LeaderboardStatsDto> GetStatsAsync();

        // ===== PLAYER QUERIES =====

        /// <summary>
        /// Get player by friend code
        /// </summary>
        Task<PlayerDto?> GetPlayerAsync(string fc);

        /// <summary>
        /// Get player VR history for a date range
        /// </summary>
        Task<VRHistoryRangeResponse?> GetPlayerHistoryAsync(string fc, int? days);

        /// <summary>
        /// Get recent VR history entries for a player
        /// </summary>
        Task<List<VRHistoryDto>?> GetPlayerRecentHistoryAsync(string fc, int count);

        // ===== MII QUERIES =====

        /// <summary>
        /// Get Mii image for a single player
        /// </summary>
        Task<string?> GetPlayerMiiAsync(string fc);

        /// <summary>
        /// Get Mii images for multiple players in batch
        /// </summary>
        Task<Dictionary<string, string?>> GetPlayerMiisBatchAsync(List<string> friendCodes);

        // ===== LEGACY QUERIES =====

        /// <summary>
        /// Check if legacy snapshot exists
        /// </summary>
        Task<bool> HasLegacySnapshotAsync();

        /// <summary>
        /// Get legacy leaderboard snapshot
        /// </summary>
        Task<LeaderboardResponseDto> GetLegacyLeaderboardAsync(LeaderboardRequest request);

        /// <summary>
        /// Get legacy player by friend code
        /// </summary>
        Task<PlayerDto?> GetLegacyPlayerAsync(string friendCode);

        /// <summary>
        /// Get Mii images for legacy players in batch
        /// </summary>
        Task<Dictionary<string, string?>> GetLegacyPlayerMiisBatchAsync(List<string> friendCodes);

        // ===== BACKGROUND OPERATIONS =====

        /// <summary>
        /// Refresh player data from external API
        /// </summary>
        Task RefreshFromApiAsync();

        /// <summary>
        /// Recalculate player rankings
        /// </summary>
        Task RefreshRankingsAsync();
    }
}