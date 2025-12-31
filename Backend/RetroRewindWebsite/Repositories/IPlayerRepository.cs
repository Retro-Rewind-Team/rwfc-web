using RetroRewindWebsite.Models.Common;
using RetroRewindWebsite.Models.Entities;

namespace RetroRewindWebsite.Repositories
{
    public interface IPlayerRepository
    {
        // ===== BASIC QUERIES =====

        /// <summary>
        /// Get player by internal database ID
        /// </summary>
        Task<PlayerEntity?> GetByIdAsync(int id);

        /// <summary>
        /// Get player by player ID (from external API)
        /// </summary>
        Task<PlayerEntity?> GetByPidAsync(string pid);

        /// <summary>
        /// Get player by friend code
        /// </summary>
        Task<PlayerEntity?> GetByFcAsync(string fc);

        /// <summary>
        /// Get all players ordered by rank
        /// </summary>
        Task<List<PlayerEntity>> GetAllAsync();

        /// <summary>
        /// Get multiple players by friend codes
        /// </summary>
        Task<List<PlayerEntity>> GetPlayersByFriendCodesAsync(List<string> friendCodes);

        // ===== LEADERBOARD QUERIES =====

        /// <summary>
        /// Get paginated leaderboard with filtering and sorting
        /// </summary>
        Task<PagedResult<PlayerEntity>> GetLeaderboardPageAsync(
            int page,
            int pageSize,
            string? search,
            string sortBy,
            bool ascending);

        /// <summary>
        /// Get top N players (excluding suspicious players)
        /// </summary>
        Task<List<PlayerEntity>> GetTopPlayersAsync(int count);

        /// <summary>
        /// Get top VR gainers for a given time period
        /// </summary>
        Task<List<PlayerEntity>> GetTopVRGainersAsync(int count, TimeSpan period);

        /// <summary>
        /// Get players within a rank window
        /// </summary>
        Task<List<PlayerEntity>> GetPlayersAroundRankAsync(int rank, int window);

        // ===== STATISTICS =====

        /// <summary>
        /// Get total player count
        /// </summary>
        Task<int> GetTotalPlayersCountAsync();

        /// <summary>
        /// Get suspicious player count
        /// </summary>
        Task<int> GetSuspiciousPlayersCountAsync();

        // ===== MODIFICATIONS =====

        /// <summary>
        /// Add new player to database
        /// </summary>
        Task AddAsync(PlayerEntity player);

        /// <summary>
        /// Update existing player
        /// </summary>
        Task UpdateAsync(PlayerEntity player);

        /// <summary>
        /// Delete player by ID
        /// </summary>
        Task DeleteAsync(int id);

        /// <summary>
        /// Update all player rankings based on VR
        /// </summary>
        Task UpdatePlayerRanksAsync();

        // ===== BATCH OPERATIONS =====

        /// <summary>
        /// Get batch of players for processing
        /// </summary>
        Task<List<PlayerEntity>> GetPlayersBatchAsync(int skip, int take);

        /// <summary>
        /// Get batch of player PIDs for processing
        /// </summary>
        Task<List<string>> GetPlayerPidsBatchAsync(int skip, int take);

        /// <summary>
        /// Update players in batch
        /// </summary>
        Task UpdatePlayersAsync(List<PlayerEntity> players);

        /// <summary>
        /// Update VR gains for multiple players in batch
        /// </summary>
        Task UpdatePlayerVRGainsBatchAsync(Dictionary<string, (int gain24h, int gain7d, int gain30d)> vrGains);

        // ===== MII OPERATIONS =====

        /// <summary>
        /// Get players that need Mii images fetched or refreshed
        /// </summary>
        Task<List<PlayerEntity>> GetPlayersNeedingMiiImagesAsync(int count);

        /// <summary>
        /// Update Mii image for a player
        /// </summary>
        Task UpdatePlayerMiiImageAsync(string pid, string miiImageBase64);

        // ===== LEGACY OPERATIONS =====

        /// <summary>
        /// Check if legacy snapshot exists
        /// </summary>
        Task<bool> HasLegacySnapshotAsync();

        /// <summary>
        /// Get paginated legacy leaderboard
        /// </summary>
        Task<PagedResult<LegacyPlayerEntity>> GetLegacyLeaderboardPageAsync(
            int page,
            int pageSize,
            string? search,
            string sortBy,
            bool ascending);

        /// <summary>
        /// Get legacy player by friend code
        /// </summary>
        Task<LegacyPlayerEntity?> GetLegacyPlayerByFriendCodeAsync(string friendCode);

        /// <summary>
        /// Get multiple legacy players by friend codes
        /// </summary>
        Task<List<LegacyPlayerEntity>> GetLegacyPlayersByFriendCodesAsync(List<string> friendCodes);

        /// <summary>
        /// Get total legacy player count
        /// </summary>
        Task<int> GetLegacyPlayersCountAsync();

        /// <summary>
        /// Get legacy suspicious player count
        /// </summary>
        Task<int> GetLegacySuspiciousPlayersCountAsync();
    }
}