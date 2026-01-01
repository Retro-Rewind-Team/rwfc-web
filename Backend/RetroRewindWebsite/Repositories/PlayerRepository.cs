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

        // ===== BASIC QUERIES =====

        public async Task<PlayerEntity?> GetByIdAsync(int id)
        {
            return await _context.Players
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<PlayerEntity?> GetByPidAsync(string pid)
        {
            return await _context.Players
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Pid == pid);
        }

        public async Task<PlayerEntity?> GetByFcAsync(string fc)
        {
            var normalizedFc = fc.Replace("-", "");

            return await _context.Players
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Fc.Replace("-", "") == normalizedFc);
        }

        public async Task<List<PlayerEntity>> GetAllAsync()
        {
            return await _context.Players
                .AsNoTracking()
                .OrderBy(p => p.Rank)
                .ToListAsync();
        }

        public async Task<List<PlayerEntity>> GetPlayersByFriendCodesAsync(List<string> friendCodes)
        {
            if (friendCodes == null || friendCodes.Count == 0)
            {
                return [];
            }

            var normalizedCodes = friendCodes
                .Select(fc => fc.Replace("-", ""))
                .ToList();

            return await _context.Players
                .AsNoTracking()
                .Where(p => normalizedCodes.Contains(p.Fc.Replace("-", "")))
                .ToListAsync();
        }

        // ===== LEADERBOARD QUERIES =====

        public async Task<PagedResult<PlayerEntity>> GetLeaderboardPageAsync(
            int page,
            int pageSize,
            string? search,
            string sortBy,
            bool ascending)
        {
            var query = _context.Players.AsNoTracking();

            if (!string.IsNullOrEmpty(search))
            {
                var searchTerm = $"%{search}%";
                query = query.Where(p =>
                    EF.Functions.ILike(p.Name, searchTerm) ||
                    EF.Functions.ILike(p.Fc, searchTerm));
            }

            query = ApplySorting(query, sortBy, ascending);

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

        public async Task<List<PlayerEntity>> GetTopVRGainersAsync(int count, TimeSpan period)
        {
            var query = _context.Players
                .AsNoTracking()
                .Where(p => !p.IsSuspicious);

            if (period.TotalHours <= 24)
            {
                return await query
                    .OrderByDescending(p => p.VRGainLast24Hours)
                    .Take(count)
                    .ToListAsync();
            }
            else if (period.TotalDays <= 7)
            {
                return await query
                    .OrderByDescending(p => p.VRGainLastWeek)
                    .Take(count)
                    .ToListAsync();
            }
            else
            {
                return await query
                    .OrderByDescending(p => p.VRGainLastMonth)
                    .Take(count)
                    .ToListAsync();
            }
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

        // ===== STATISTICS =====

        public async Task<int> GetTotalPlayersCountAsync()
        {
            return await _context.Players.CountAsync();
        }

        public async Task<int> GetSuspiciousPlayersCountAsync()
        {
            return await _context.Players.CountAsync(p => p.IsSuspicious);
        }

        // ===== MODIFICATIONS =====

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

        public async Task UpdatePlayerRanksAsync()
        {
            try
            {
                _logger.LogInformation("Updating player ranks using optimized SQL query");

                await _context.Database.ExecuteSqlRawAsync(@"
                    WITH RankedPlayers AS (
                        SELECT 
                            ""Id"",
                            ROW_NUMBER() OVER (
                                ORDER BY 
                                    CASE WHEN ""IsSuspicious"" = false THEN 0 ELSE 1 END,
                                    ""Ev"" DESC,
                                    ""LastSeen"" DESC
                            ) as NewRank
                        FROM ""Players""
                    )
                    UPDATE ""Players"" p
                    SET ""Rank"" = rp.NewRank
                    FROM RankedPlayers rp
                    WHERE p.""Id"" = rp.""Id""
                ");

                _logger.LogInformation("Successfully updated player ranks");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating player ranks");
                throw;
            }
        }

        // ===== BATCH OPERATIONS =====

        public async Task<List<PlayerEntity>> GetPlayersBatchAsync(int skip, int take)
        {
            return await _context.Players
                .AsNoTracking()
                .OrderBy(p => p.Id)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
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

        public async Task UpdatePlayersAsync(List<PlayerEntity> players)
        {
            _context.Players.UpdateRange(players);
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();
        }

        public async Task UpdatePlayerVRGainsBatchAsync(
            Dictionary<string, (int gain24h, int gain7d, int gain30d)> vrGains)
        {
            if (vrGains == null || vrGains.Count == 0)
            {
                return;
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                await _context.Database.ExecuteSqlRawAsync("CREATE TEMP TABLE temp_vr_gains (pid VARCHAR(50), gain24h INT, gain7d INT, gain30d INT)");

                foreach (var batch in vrGains.Chunk(500))
                {
                    var values = string.Join(", ", batch.Select(kvp =>
                        $"('{kvp.Key.Replace("'", "''")}', {kvp.Value.gain24h}, {kvp.Value.gain7d}, {kvp.Value.gain30d})"));

                    await _context.Database.ExecuteSqlAsync(
                        $"INSERT INTO temp_vr_gains (pid, gain24h, gain7d, gain30d) VALUES {values}");
                }

                await _context.Database.ExecuteSqlRawAsync(@"
                    UPDATE ""Players"" p
                    SET 
                        ""VRGainLast24Hours"" = t.gain24h,
                        ""VRGainLastWeek"" = t.gain7d,
                        ""VRGainLastMonth"" = t.gain30d
                    FROM temp_vr_gains t
                    WHERE p.""Pid"" = t.pid
                ");

                await _context.Database.ExecuteSqlRawAsync("DROP TABLE temp_vr_gains");

                await transaction.CommitAsync();

                _logger.LogDebug("Successfully updated VR gains for {Count} players", vrGains.Count);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to update VR gains batch, transaction rolled back");
                throw;
            }
        }

        // ===== MII OPERATIONS =====

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

        // ===== LEGACY OPERATIONS =====

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

            if (!string.IsNullOrEmpty(search))
            {
                var searchTerm = $"%{search}%";
                query = query.Where(p =>
                    EF.Functions.ILike(p.Name, searchTerm) ||
                    EF.Functions.ILike(p.Fc, searchTerm));
            }

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

        public async Task<LegacyPlayerEntity?> GetLegacyPlayerByFriendCodeAsync(string friendCode)
        {
            var normalizedFc = friendCode.Replace("-", "");

            return await _context.LegacyPlayers
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Fc.Replace("-", "") == normalizedFc);
        }

        public async Task<List<LegacyPlayerEntity>> GetLegacyPlayersByFriendCodesAsync(List<string> friendCodes)
        {
            if (friendCodes == null || friendCodes.Count == 0)
            {
                return [];
            }

            var normalizedCodes = friendCodes
                .Select(fc => fc.Replace("-", ""))
                .ToList();

            return await _context.LegacyPlayers
                .AsNoTracking()
                .Where(p => normalizedCodes.Contains(p.Fc.Replace("-", "")))
                .ToListAsync();
        }

        public async Task<int> GetLegacyPlayersCountAsync()
        {
            return await _context.LegacyPlayers.CountAsync();
        }

        public async Task<int> GetLegacySuspiciousPlayersCountAsync()
        {
            return await _context.LegacyPlayers.CountAsync(p => p.IsSuspicious);
        }

        // ===== PRIVATE HELPER METHODS =====

        private static IQueryable<PlayerEntity> ApplySorting(
            IQueryable<PlayerEntity> query,
            string sortBy,
            bool ascending)
        {
            return sortBy.ToLower() switch
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
        }
    }
}