using Microsoft.EntityFrameworkCore;
using Npgsql;
using NpgsqlTypes;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.DTOs.Common;
using RetroRewindWebsite.Models.Entities.Player;

namespace RetroRewindWebsite.Repositories.Player;

public class PlayerRepository : IPlayerRepository, IPlayerMiiRepository, ILegacyPlayerRepository
{
    private readonly LeaderboardDbContext _context;
    private readonly ILogger<PlayerRepository> _logger;

    public PlayerRepository(LeaderboardDbContext context, ILogger<PlayerRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    // ===== BASIC QUERIES =====

    public async Task<PlayerEntity?> GetByIdAsync(int id) =>
        await _context.Players
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

    public async Task<PlayerEntity?> GetByPidAsync(string pid) =>
        await _context.Players
            .AsNoTracking()
            .Include(p => p.MiiCache)
            .FirstOrDefaultAsync(p => p.Pid == pid);

    public async Task<PlayerEntity?> GetByFcAsync(string fc) =>
        await _context.Players
            .AsNoTracking()
            .Include(p => p.MiiCache)
            .FirstOrDefaultAsync(p => p.Fc == fc);

    public async Task<List<PlayerEntity>> GetPlayersByFriendCodesAsync(List<string> friendCodes)
    {
        if (friendCodes == null || friendCodes.Count == 0)
            return [];

        return await _context.Players
            .AsNoTracking()
            .Include(p => p.MiiCache)
            .Where(p => friendCodes.Contains(p.Fc))
            .ToListAsync();
    }

    public async Task<List<PlayerEntity>> GetPlayersByPidsAsync(List<string> pids)
    {
        if (pids == null || pids.Count == 0)
            return [];

        return await _context.Players
            .AsNoTracking()
            .Where(p => pids.Contains(p.Pid))
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
        var query = _context.Players.AsNoTracking().Where(p => !p.IsBanned);

        if (!string.IsNullOrEmpty(search))
        {
            var searchTerm = $"%{search}%";
            query = query.Where(p =>
                EF.Functions.ILike(p.Name, searchTerm) ||
                EF.Functions.ILike(p.Fc, searchTerm));
        }

        query = ApplySorting(query, sortBy, ascending);

        return await PagedResult<PlayerEntity>.CreateAsync(query, page, pageSize);
    }

    public async Task<List<PlayerEntity>> GetTopPlayersAsync(int count) =>
        await _context.Players
            .AsNoTracking()
            .Where(p => !p.IsSuspicious && !p.IsBanned)
            .OrderBy(p => p.Rank)
            .Take(count)
            .ToListAsync();

    public async Task<PagedResult<PlayerEntity>> GetLeaderboardPageNoMiiAsync(int page)
    {
        var query = _context.Players
            .AsNoTracking()
            .Where(p => !p.IsBanned)
            .OrderBy(p => p.Rank);

        return await PagedResult<PlayerEntity>.CreateAsync(query, page, 50);
    }

    // ===== STATISTICS =====

    public async Task<int> GetTotalPlayersCountAsync() =>
        await _context.Players.CountAsync(p => !p.IsBanned);

    public async Task<int> GetSuspiciousPlayersCountAsync() =>
        await _context.Players.CountAsync(p => p.IsSuspicious);

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
            _logger.LogInformation("Updating player ranks");

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
                    WHERE ""IsBanned"" = false
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

    public async Task AddRangeAsync(IEnumerable<PlayerEntity> players)
    {
        await _context.Players.AddRangeAsync(players);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateRangeAsync(IEnumerable<PlayerEntity> players)
    {
        _context.Players.UpdateRange(players);
        await _context.SaveChangesAsync();
    }

    public async Task<List<string>> GetPlayerPidsBatchAsync(int skip, int take) =>
        await _context.Players
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .Skip(skip)
            .Take(take)
            .Select(p => p.Pid)
            .ToListAsync();

    public async Task UpdatePlayerVRGainsBatchAsync(
        Dictionary<string, (int gain24h, int gain7d, int gain30d)> vrGains)
    {
        if (vrGains == null || vrGains.Count == 0)
            return;

        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            await _context.Database.ExecuteSqlRawAsync(
                "CREATE TEMP TABLE temp_vr_gains (pid VARCHAR(50), gain24h INT, gain7d INT, gain30d INT)");

            var conn = (NpgsqlConnection)_context.Database.GetDbConnection();
            using (var writer = await conn.BeginBinaryImportAsync(
                "COPY temp_vr_gains (pid, gain24h, gain7d, gain30d) FROM STDIN (FORMAT BINARY)"))
            {
                foreach (var kvp in vrGains)
                {
                    await writer.StartRowAsync();
                    await writer.WriteAsync(kvp.Key, NpgsqlDbType.Varchar);
                    await writer.WriteAsync(kvp.Value.gain24h, NpgsqlDbType.Integer);
                    await writer.WriteAsync(kvp.Value.gain7d, NpgsqlDbType.Integer);
                    await writer.WriteAsync(kvp.Value.gain30d, NpgsqlDbType.Integer);
                }
                await writer.CompleteAsync();
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

    public async Task<List<PlayerEntity>> GetPlayersNeedingMiiImagesAsync(int count) =>
        await _context.Players
            .AsNoTracking()
            .Include(p => p.MiiCache)
            .Where(p =>
                !string.IsNullOrEmpty(p.MiiData) &&
                (p.MiiCache == null ||
                 p.MiiCache.MiiImageFetchedAt < DateTime.UtcNow.AddDays(-7)))
            .OrderBy(p => p.MiiCache == null ? DateTime.MinValue : p.MiiCache.MiiImageFetchedAt)
            .Take(count)
            .ToListAsync();

    public async Task UpdatePlayerMiiImageAsync(string pid, string miiImageBase64)
    {
        var player = await _context.Players
            .Include(p => p.MiiCache)
            .FirstOrDefaultAsync(p => p.Pid == pid);

        if (player == null)
            return;

        var now = DateTime.UtcNow;

        if (player.MiiCache == null)
        {
            player.MiiCache = new Models.Entities.Player.PlayerMiiCacheEntity
            {
                PlayerId = player.Id,
                MiiImageBase64 = miiImageBase64,
                MiiImageFetchedAt = now
            };
        }
        else
        {
            player.MiiCache.MiiImageBase64 = miiImageBase64;
            player.MiiCache.MiiImageFetchedAt = now;
        }

        await _context.SaveChangesAsync();
    }

    public async Task InvalidatePlayerMiiCacheAsync(string pid)
    {
        var player = await _context.Players
            .Where(p => p.Pid == pid)
            .Select(p => new { p.Id })
            .FirstOrDefaultAsync();

        if (player == null)
            return;

        await _context.PlayerMiiCaches
            .Where(m => m.PlayerId == player.Id)
            .ExecuteDeleteAsync();
    }

    // ===== LEGACY OPERATIONS =====

    public async Task<bool> HasLegacySnapshotAsync() =>
        await _context.LegacyPlayers.AnyAsync();

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

        return await PagedResult<LegacyPlayerEntity>.CreateAsync(query, page, pageSize);
    }

    public async Task<LegacyPlayerEntity?> GetLegacyPlayerByFriendCodeAsync(string friendCode) =>
        await _context.LegacyPlayers
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Fc == friendCode);

    public async Task<List<LegacyPlayerEntity>> GetLegacyPlayersByFriendCodesAsync(List<string> friendCodes)
    {
        if (friendCodes == null || friendCodes.Count == 0)
            return [];

        return await _context.LegacyPlayers
            .AsNoTracking()
            .Where(p => friendCodes.Contains(p.Fc))
            .ToListAsync();
    }

    public async Task<int> GetLegacyPlayersCountAsync() =>
        await _context.LegacyPlayers.CountAsync();

    public async Task<int> GetLegacySuspiciousPlayersCountAsync() =>
        await _context.LegacyPlayers.CountAsync(p => p.IsSuspicious);

    // ===== PRIVATE HELPERS =====

    private static IQueryable<PlayerEntity> ApplySorting(
        IQueryable<PlayerEntity> query,
        string sortBy,
        bool ascending) =>
        sortBy.ToLower() switch
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
