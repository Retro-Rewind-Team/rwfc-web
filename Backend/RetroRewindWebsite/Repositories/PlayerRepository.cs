using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Common;
using RetroRewindWebsite.Models.Entities;

namespace RetroRewindWebsite.Repositories
{
    public class PlayerRepository : IPlayerRepository
    {
        private readonly LeaderboardDbContext _context;
        private readonly ILogger<PlayerRepository> _logger;

        public PlayerRepository(LeaderboardDbContext context, ILogger<PlayerRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<PlayerEntity?> GetByPidAsync(string pid)
        {
            return await _context.Players
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Pid == pid);
        }

        public async Task<PlayerEntity?> GetByFcAsync(string fc)
        {
            return await _context.Players
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Fc == fc || p.Fc.Replace("-", "") == fc.Replace("-", ""));
        }

        public async Task<PlayerEntity?> GetByIdAsync(int id)
        {
            return await _context.Players
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<List<PlayerEntity>> GetPlayersByFriendCodesAsync(List<string> friendCodes)
        {
            if (friendCodes == null || friendCodes.Count == 0)
                return [];

            // Normalize friend codes (remove dashes) for comparison
            var normalizedCodes = friendCodes.Select(fc => fc.Replace("-", "")).ToList();

            return await _context.Players
                .AsNoTracking()
                .Where(p => normalizedCodes.Contains(p.Fc.Replace("-", "")))
                .ToListAsync();
        }

        public async Task<List<PlayerEntity>> GetAllAsync()
        {
            return await _context.Players
                .AsNoTracking()
                .OrderBy(p => p.Rank)
                .ToListAsync();
        }

        public async Task AddAsync(PlayerEntity player)
        {
            await _context.Players.AddAsync(player);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(PlayerEntity player)
        {
            _context.Players.Update(player);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var player = await _context.Players.FindAsync(id);
            if (player != null)
            {
                _context.Players.Remove(player);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<PagedResult<PlayerEntity>> GetLeaderboardPageAsync(
            int page,
            int pageSize,
            string? search,
            string sortBy,
            bool ascending)
        {
            var query = _context.Players.AsNoTracking();

            // Search filter
            if (!string.IsNullOrEmpty(search))
                query = query.Where(p =>
                    EF.Functions.ILike(p.Name, $"%{search}%") ||
                    EF.Functions.ILike(p.Fc, $"%{search}%"));

            // Apply sorting
            query = sortBy.ToLower() switch
            {
                "rank" => ascending ? query.OrderBy(p => p.Rank) : query.OrderByDescending(p => p.Rank),
                "name" => ascending ? query.OrderBy(p => p.Name) : query.OrderByDescending(p => p.Name),
                "vr" => ascending ? query.OrderBy(p => p.Ev) : query.OrderByDescending(p => p.Ev),
                "lastseen" => ascending ? query.OrderBy(p => p.LastSeen) : query.OrderByDescending(p => p.LastSeen),
                "vrgain24" => ascending ? query.OrderBy(p => p.VRGainLast24Hours) : query.OrderByDescending(p => p.VRGainLast24Hours),
                "vrgain7" => ascending ? query.OrderBy(p => p.VRGainLastWeek) : query.OrderByDescending(p => p.VRGainLastWeek),
                "vrgain30" => ascending ? query.OrderBy(p => p.VRGainLastMonth) : query.OrderByDescending(p => p.VRGainLastMonth),
                _ => query.OrderBy(p => p.Rank)
            };

            var totalCount = await query.CountAsync();
            var players = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<PlayerEntity>
            {
                Items = players,
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize
            };
        }

        public async Task<List<PlayerEntity>> GetTopPlayersAsync(int count)
        {
            return await _context.Players
                .AsNoTracking()
                .Where(p => !p.IsSuspicious)
                .OrderBy(p => p.Rank)
                .Take(count)
                .ToListAsync();
        }

        public async Task<List<PlayerEntity>> GetPlayersAroundRankAsync(int rank, int window)
        {
            var startRank = Math.Max(1, rank - window);
            var endRank = rank + window;

            return await _context.Players
                .AsNoTracking()
                .Where(p => p.Rank >= startRank && p.Rank <= endRank)
                .OrderBy(p => p.Rank)
                .ToListAsync();
        }

        public async Task<int> GetTotalPlayersCountAsync()
        {
            return await _context.Players.CountAsync();
        }

        public async Task<int> GetSuspiciousPlayersCountAsync()
        {
            return await _context.Players.CountAsync(p => p.IsSuspicious);
        }

        public async Task UpdatePlayerRanksAsync()
        {
            try
            {
                // Clear any existing tracked entities to avoid conflicts
                _context.ChangeTracker.Clear();

                var batchSize = 100;
                int rank = 1;

                // Process non-suspicious players first
                var nonSuspiciousPlayers = await _context.Players
                    .AsNoTracking()
                    .Where(p => !p.IsSuspicious)
                    .OrderByDescending(p => p.Ev)
                    .ThenByDescending(p => p.LastSeen)
                    .ToListAsync();

                for (int i = 0; i < nonSuspiciousPlayers.Count; i += batchSize)
                {
                    var batch = nonSuspiciousPlayers.Skip(i).Take(batchSize).ToList();

                    foreach (var player in batch)
                    {
                        player.Rank = rank++;

                        // Attach the entity and mark only Rank as modified
                        _context.Players.Attach(player);
                        _context.Entry(player).Property(p => p.Rank).IsModified = true;
                    }

                    await _context.SaveChangesAsync();

                    // Clear the change tracker after each batch
                    _context.ChangeTracker.Clear();
                }

                // Then process suspicious players
                var suspiciousPlayers = await _context.Players
                    .AsNoTracking()
                    .Where(p => p.IsSuspicious)
                    .OrderByDescending(p => p.Ev)
                    .ToListAsync();

                for (int i = 0; i < suspiciousPlayers.Count; i += batchSize)
                {
                    var batch = suspiciousPlayers.Skip(i).Take(batchSize).ToList();

                    foreach (var player in batch)
                    {
                        player.Rank = rank++;

                        // Attach the entity and mark only Rank as modified
                        _context.Players.Attach(player);
                        _context.Entry(player).Property(p => p.Rank).IsModified = true;
                    }

                    await _context.SaveChangesAsync();

                    // Clear the change tracker after each batch
                    _context.ChangeTracker.Clear();
                }

                _logger.LogInformation("Successfully updated player ranks");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating player ranks");
                throw;
            }
        }

        public async Task<List<PlayerEntity>> GetPlayersBatchAsync(int skip, int take)
        {
            return await _context.Players
                .AsNoTracking()
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task UpdatePlayersAsync(List<PlayerEntity> players)
        {
            _context.Players.UpdateRange(players);
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();
        }

        public async Task<List<string>> GetPlayerPidsBatchAsync(int skip, int take)
        {
            return await _context.Players
                .AsNoTracking()
                .OrderBy(p => p.Id)
                .Skip(skip)
                .Take(take)
                .Select(p => p.Pid)
                .ToListAsync();
        }

        public async Task UpdatePlayerVRGainsBatchAsync(Dictionary<string, (int gain24h, int gain7d, int gain30d)> vrGains)
        {
            // Use a transaction for batch updates
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                foreach (var kvp in vrGains)
                {
                    await _context.Players
                        .Where(p => p.Pid == kvp.Key)
                        .ExecuteUpdateAsync(p => p
                            .SetProperty(x => x.VRGainLast24Hours, kvp.Value.gain24h)
                            .SetProperty(x => x.VRGainLastWeek, kvp.Value.gain7d)
                            .SetProperty(x => x.VRGainLastMonth, kvp.Value.gain30d));
                }

                await transaction.CommitAsync();
                _logger.LogDebug("Successfully committed VR gains batch update for {Count} players", vrGains.Count);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to update VR gains batch, transaction rolled back");
                throw;
            }
        }

        public async Task<bool> HasLegacySnapshotAsync()
        {
            return await _context.LegacyPlayers.AnyAsync();
        }

        public async Task<PagedResult<LegacyPlayerEntity>> GetLegacyLeaderboardPageAsync(
            int page,
            int pageSize,
            string? search,
            string sortBy,
            bool ascending)
        {
            var query = _context.LegacyPlayers.AsNoTracking();

            // Search filter
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p =>
                    EF.Functions.ILike(p.Name, $"%{search}%") ||
                    EF.Functions.ILike(p.Fc, $"%{search}%"));
            }

            // Sorting
            query = sortBy.ToLower() switch
            {
                "name" => ascending ? query.OrderBy(p => p.Name) : query.OrderByDescending(p => p.Name),
                "vr" => ascending ? query.OrderBy(p => p.Ev) : query.OrderByDescending(p => p.Ev),
                _ => ascending ? query.OrderBy(p => p.Rank) : query.OrderByDescending(p => p.Rank)
            };

            var totalCount = await query.CountAsync();
            var players = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<LegacyPlayerEntity>
            {
                Items = players,
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize
            };
        }

        public async Task<int> GetLegacyPlayersCountAsync()
        {
            return await _context.LegacyPlayers.CountAsync();
        }

        public async Task<int> GetLegacySuspiciousPlayersCountAsync()
        {
            return await _context.LegacyPlayers.CountAsync(p => p.IsSuspicious);
        }

        public async Task<List<LegacyPlayerEntity>> GetLegacyPlayersByFriendCodesAsync(List<string> friendCodes)
        {
            if (friendCodes == null || friendCodes.Count == 0)
                return [];

            var normalizedCodes = friendCodes.Select(fc => fc.Replace("-", "")).ToList();

            return await _context.LegacyPlayers
                .AsNoTracking()
                .Where(p => normalizedCodes.Contains(p.Fc.Replace("-", "")))
                .ToListAsync();
        }

        public async Task<LegacyPlayerEntity?> GetLegacyPlayerByFriendCodeAsync(string friendCode)
        {
            return await _context.LegacyPlayers
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Fc == friendCode);
        }

        public async Task<List<PlayerEntity>> GetTopVRGainersAsync(int count, TimeSpan period)
        {
            var query = _context.Players.AsNoTracking();

            if (period.TotalHours <= 24)
            {
                return await query
                    .OrderByDescending(p => p.VRGainLast24Hours)
                    .Take(count)
                    .ToListAsync();
            }
            else
            {
                return await query
                    .OrderByDescending(p => p.VRGainLastWeek)
                    .Take(count)
                    .ToListAsync();
            }
        }

        public async Task<List<PlayerEntity>> GetPlayersNeedingMiiImagesAsync(int count)
        {
            return await _context.Players
                .AsNoTracking()
                .Where(p =>
                    !string.IsNullOrEmpty(p.MiiData) &&
                    (p.MiiImageBase64 == null ||
                     p.MiiImageFetchedAt == null ||
                     p.MiiImageFetchedAt < DateTime.UtcNow.AddDays(-7)))
                .OrderBy(p => p.MiiImageFetchedAt ?? DateTime.MinValue)
                .Take(count)
                .ToListAsync();
        }

        public async Task UpdatePlayerMiiImageAsync(string pid, string miiImageBase64)
        {
            await _context.Players
                .Where(p => p.Pid == pid)
                .ExecuteUpdateAsync(p => p
                    .SetProperty(x => x.MiiImageBase64, miiImageBase64)
                    .SetProperty(x => x.MiiImageFetchedAt, DateTime.UtcNow));
        }
    }
}