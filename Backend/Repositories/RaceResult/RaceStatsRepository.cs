using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Domain;
using RetroRewindWebsite.Models.Entities.RaceResult;

namespace RetroRewindWebsite.Repositories.RaceResult;

public class RaceStatsRepository : IRaceStatsRepository
{
    private readonly LeaderboardDbContext _context;

    // Rk values accepted for online best times — standard racing modes only.
    private static readonly HashSet<string> AllowedRkValues =
    [
        "vs_10",  // Retro Tracks
        "vs_11",  // Online TT
        "vs_12",  // 200cc
        "vs_20",  // Custom Tracks
        "vs_21",  // Vanilla Tracks
        "vs_22",  // CT 200cc
        "vs_751", // Versus
        "vs_-1",  // Regular
        "vs",     // Regular (alternate key)
    ];

    public RaceStatsRepository(LeaderboardDbContext context)
    {
        _context = context;
    }

    // ===== HELPERS =====

    private IQueryable<RaceResultEntity> BasePlayerQuery(long profileId, DateTime? after, short? courseId, short? engineClassId)
    {
        var query = _context.RaceResults
            .AsNoTracking()
            .Where(r => r.ProfileId == profileId && r.PlayerId == 0);

        if (after.HasValue)
            query = query.Where(r => r.RaceTimestamp >= after.Value);

        if (courseId.HasValue)
            query = query.Where(r => r.CourseId == courseId.Value);

        if (engineClassId.HasValue)
            query = query.Where(r => r.EngineClassId == engineClassId.Value);

        return query;
    }

    private IQueryable<RaceResultEntity> BaseGlobalQuery(DateTime? after)
    {
        var query = _context.RaceResults
            .AsNoTracking()
            .Where(r => r.PlayerId == 0);

        if (after.HasValue)
            query = query.Where(r => r.RaceTimestamp >= after.Value);

        return query;
    }

    // ===== PLAYER =====

    public async Task<int> GetTotalRaceCountByPlayerAsync(long profileId, DateTime? after, short? courseId, short? engineClassId = null) =>
        await BasePlayerQuery(profileId, after, courseId, engineClassId).CountAsync();

    public async Task<DateTime?> GetEarliestRaceTimestampAsync() =>
        await _context.RaceResults
            .AsNoTracking()
            .MinAsync(r => (DateTime?)r.RaceTimestamp);

    public async Task<List<(short CourseId, int Count)>> GetTopTracksByPlayerAsync(long profileId, int limit, DateTime? after, short? courseId, short? engineClassId = null)
    {
        var rows = await BasePlayerQuery(profileId, after, courseId, engineClassId)
            .GroupBy(r => r.CourseId)
            .Select(g => new { CourseId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(limit)
            .ToListAsync();

        return [.. rows.Select(x => (x.CourseId, x.Count))];
    }

    public async Task<List<(short Id, int Count)>> GetTopCharactersByPlayerAsync(long profileId, int limit, DateTime? after, short? courseId, short? engineClassId = null)
    {
        var rows = await BasePlayerQuery(profileId, after, courseId, engineClassId)
            .GroupBy(r => r.CharacterId)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(limit)
            .ToListAsync();

        return [.. rows.Select(x => (x.Id, x.Count))];
    }

    public async Task<List<(short Id, int Count)>> GetTopVehiclesByPlayerAsync(long profileId, int limit, DateTime? after, short? courseId, short? engineClassId = null)
    {
        var rows = await BasePlayerQuery(profileId, after, courseId, engineClassId)
            .GroupBy(r => r.VehicleId)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(limit)
            .ToListAsync();

        return [.. rows.Select(x => (x.Id, x.Count))];
    }

    public async Task<List<(short CharacterId, short VehicleId, int Count)>> GetTopCombosByPlayerAsync(long profileId, int limit, DateTime? after, short? courseId, short? engineClassId = null)
    {
        var rows = await BasePlayerQuery(profileId, after, courseId, engineClassId)
            .GroupBy(r => new { r.CharacterId, r.VehicleId })
            .Select(g => new { g.Key.CharacterId, g.Key.VehicleId, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(limit)
            .ToListAsync();

        return [.. rows.Select(x => (x.CharacterId, x.VehicleId, x.Count))];
    }

    public async Task<List<(short Id, int RaceCount, int WinCount, double WinRate)>> GetTopCharactersByWinRateByPlayerAsync(
        long profileId, int minRaces, DateTime? after, short? courseId, short? engineClassId)
    {
        var rows = await BasePlayerQuery(profileId, after, courseId, engineClassId)
            .GroupBy(r => r.CharacterId)
            .Select(g => new { Id = g.Key, Total = g.Count(), Wins = g.Count(r => r.FinishPos == 1) })
            .ToListAsync();

        return rows
            .Where(x => x.Total >= minRaces)
            .Select(x => (x.Id, x.Total, x.Wins, (double)x.Wins / x.Total))
            .ToList();
    }

    public async Task<List<(short Id, int RaceCount, int WinCount, double WinRate)>> GetTopVehiclesByWinRateByPlayerAsync(
        long profileId, int minRaces, DateTime? after, short? courseId, short? engineClassId)
    {
        var rows = await BasePlayerQuery(profileId, after, courseId, engineClassId)
            .GroupBy(r => r.VehicleId)
            .Select(g => new { Id = g.Key, Total = g.Count(), Wins = g.Count(r => r.FinishPos == 1) })
            .ToListAsync();

        return rows
            .Where(x => x.Total >= minRaces)
            .Select(x => (x.Id, x.Total, x.Wins, (double)x.Wins / x.Total))
            .ToList();
    }

    public async Task<List<(short CharacterId, short VehicleId, int RaceCount, int WinCount, double WinRate)>> GetTopCombosByWinRateByPlayerAsync(
        long profileId, int minRaces, DateTime? after, short? courseId, short? engineClassId)
    {
        var rows = await BasePlayerQuery(profileId, after, courseId, engineClassId)
            .GroupBy(r => new { r.CharacterId, r.VehicleId })
            .Select(g => new
            {
                g.Key.CharacterId,
                g.Key.VehicleId,
                Total = g.Count(),
                Wins = g.Count(r => r.FinishPos == 1)
            })
            .ToListAsync();

        return rows
            .Where(x => x.Total >= minRaces)
            .Select(x => (x.CharacterId, x.VehicleId, x.Total, x.Wins, (double)x.Wins / x.Total))
            .ToList();
    }

    public async Task<long> GetTotalFramesIn1stByPlayerAsync(long profileId, DateTime? after, short? courseId, short? engineClassId = null) =>
        await BasePlayerQuery(profileId, after, courseId, engineClassId)
            .SumAsync(r => (long)r.FramesIn1st);

    public async Task<(List<RaceResultEntity> Rows, int TotalCount)> GetRecentRacesByPlayerAsync(
        long profileId, int page, int pageSize, DateTime? after, short? courseId, short? engineClassId = null)
    {
        var query = BasePlayerQuery(profileId, after, courseId, engineClassId)
            .OrderByDescending(r => r.RaceTimestamp);

        var totalCount = await query.CountAsync();
        var rows = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (rows, totalCount);
    }

    // ===== GLOBAL =====

    public async Task<int> GetTotalRaceCountAsync(DateTime? after) =>
        await BaseGlobalQuery(after)
            .Select(r => new { r.RoomId, r.RaceNumber })
            .Distinct()
            .CountAsync();

    public async Task<int> GetUniquePlayerCountAsync(DateTime? after) =>
        await BaseGlobalQuery(after)
            .Select(r => r.ProfileId)
            .Distinct()
            .CountAsync();

    public async Task<List<(short CourseId, int Count)>> GetAllPlayedTracksAsync(DateTime? after)
    {
        var rows = await BaseGlobalQuery(after)
            .Select(r => new { r.CourseId, r.RoomId, r.RaceNumber })
            .Distinct()
            .GroupBy(r => r.CourseId)
            .Select(g => new { CourseId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync();

        return [.. rows.Select(x => (x.CourseId, x.Count))];
    }

    public async Task<List<(short Id, int Count)>> GetTopCharactersAsync(int limit, DateTime? after)
    {
        var rows = await BaseGlobalQuery(after)
            .GroupBy(r => r.CharacterId)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(limit)
            .ToListAsync();

        return [.. rows.Select(x => (x.Id, x.Count))];
    }

    public async Task<List<(short Id, int Count)>> GetTopVehiclesAsync(int limit, DateTime? after)
    {
        var rows = await BaseGlobalQuery(after)
            .GroupBy(r => r.VehicleId)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(limit)
            .ToListAsync();

        return [.. rows.Select(x => (x.Id, x.Count))];
    }

    public async Task<List<(short CharacterId, short VehicleId, int Count)>> GetTopCombosAsync(int limit, DateTime? after)
    {
        var rows = await BaseGlobalQuery(after)
            .GroupBy(r => new { r.CharacterId, r.VehicleId })
            .Select(g => new { g.Key.CharacterId, g.Key.VehicleId, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(limit)
            .ToListAsync();

        return [.. rows.Select(x => (x.CharacterId, x.VehicleId, x.Count))];
    }

    public async Task<List<(short Id, int RaceCount, int WinCount, double WinRate)>> GetTopCharactersByWinRateAsync(
        int minRaces, DateTime? after)
    {
        var rows = await BaseGlobalQuery(after)
            .GroupBy(r => r.CharacterId)
            .Select(g => new { Id = g.Key, Total = g.Count(), Wins = g.Count(r => r.FinishPos == 1) })
            .ToListAsync();

        return rows
            .Where(x => x.Total >= minRaces)
            .Select(x => (x.Id, x.Total, x.Wins, (double)x.Wins / x.Total))
            .ToList();
    }

    public async Task<List<(short Id, int RaceCount, int WinCount, double WinRate)>> GetTopVehiclesByWinRateAsync(
        int minRaces, DateTime? after)
    {
        var rows = await BaseGlobalQuery(after)
            .GroupBy(r => r.VehicleId)
            .Select(g => new { Id = g.Key, Total = g.Count(), Wins = g.Count(r => r.FinishPos == 1) })
            .ToListAsync();

        return rows
            .Where(x => x.Total >= minRaces)
            .Select(x => (x.Id, x.Total, x.Wins, (double)x.Wins / x.Total))
            .ToList();
    }

    public async Task<List<(short CharacterId, short VehicleId, int RaceCount, int WinCount, double WinRate)>> GetTopCombosByWinRateAsync(
        int minRaces, DateTime? after)
    {
        var rows = await BaseGlobalQuery(after)
            .GroupBy(r => new { r.CharacterId, r.VehicleId })
            .Select(g => new
            {
                g.Key.CharacterId,
                g.Key.VehicleId,
                Total = g.Count(),
                Wins = g.Count(r => r.FinishPos == 1)
            })
            .ToListAsync();

        return rows
            .Where(x => x.Total >= minRaces)
            .Select(x => (x.CharacterId, x.VehicleId, x.Total, x.Wins, (double)x.Wins / x.Total))
            .ToList();
    }

    public async Task<List<(long ProfileId, int Count)>> GetMostActivePlayersAsync(int limit, DateTime? after)
    {
        var rows = await BaseGlobalQuery(after)
            .GroupBy(r => r.ProfileId)
            .Select(g => new { ProfileId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(limit)
            .ToListAsync();

        return [.. rows.Select(x => (x.ProfileId, x.Count))];
    }

    public async Task<List<(int DayOfWeek, int Count)>> GetRaceCountByDayOfWeekAsync(DateTime? after)
    {
        var distinctTimestamps = await BaseGlobalQuery(after)
            .GroupBy(r => new { r.RoomId, r.RaceNumber })
            .Select(g => g.Min(r => r.RaceTimestamp))
            .ToListAsync();

        var rows = distinctTimestamps
            .GroupBy(ts => (int)ts.DayOfWeek)
            .Select(g => (DayOfWeek: g.Key, Count: g.Count()));

        return [.. rows];
    }

    public async Task<List<(int Hour, int Count)>> GetRaceCountByHourAsync(DateTime? after)
    {
        var distinctTimestamps = await BaseGlobalQuery(after)
            .GroupBy(r => new { r.RoomId, r.RaceNumber })
            .Select(g => g.Min(r => r.RaceTimestamp))
            .ToListAsync();

        var rows = distinctTimestamps
            .GroupBy(ts => ts.Hour)
            .Select(g => (Hour: g.Key, Count: g.Count()));

        return [.. rows];
    }

    // ===== ANALYTICS =====

    public async Task<List<(short Position, int Count)>> GetFinishPositionDistributionAsync(
        long profileId, DateTime? after, short? engineClassId)
    {
        var rows = await BasePlayerQuery(profileId, after, null, engineClassId)
            .GroupBy(r => r.FinishPos)
            .Select(g => new { Position = g.Key, Count = g.Count() })
            .ToListAsync();

        // Bucket positions 9+ into position 9; DNF (position 0) sorts last
        return rows
            .GroupBy(r => r.Position > 8 && r.Position != 0 ? (short)9 : r.Position)
            .Select(g => (g.Key, g.Sum(x => x.Count)))
            .OrderBy(x => x.Item1 == 0 ? short.MaxValue : x.Item1)
            .ToList();
    }

    public async Task<List<(short CourseId, int RaceCount, int WinCount, double AvgFinishPos)>> GetTrackPerformanceByPlayerAsync(
        long profileId, DateTime? after, short? engineClassId)
    {
        // Load only CourseId + FinishPos to memory; conditional average (finishers only) can't translate to SQL.
        var rawRows = await BasePlayerQuery(profileId, after, null, engineClassId)
            .Select(r => new { r.CourseId, r.FinishPos })
            .ToListAsync();

        return rawRows
            .GroupBy(r => r.CourseId)
            .Select(g =>
            {
                var finishers = g.Where(r => r.FinishPos != 0).ToList();
                return (
                    g.Key,
                    g.Count(),
                    g.Count(r => r.FinishPos == 1),
                    finishers.Count > 0 ? finishers.Average(r => (double)r.FinishPos) : 0.0
                );
            })
            .OrderByDescending(x => x.Item2)
            .ToList();
    }

    public async Task<List<(int DayOfWeek, int Count)>> GetRaceCountByDayOfWeekByPlayerAsync(
        long profileId, DateTime? after, short? engineClassId)
    {
        var timestamps = await BasePlayerQuery(profileId, after, null, engineClassId)
            .Select(r => r.RaceTimestamp)
            .ToListAsync();

        var rows = timestamps
            .GroupBy(ts => (int)ts.DayOfWeek)
            .Select(g => (DayOfWeek: g.Key, Count: g.Count()));

        return [.. rows];
    }

    public async Task<List<(int Hour, int Count)>> GetRaceCountByHourByPlayerAsync(
        long profileId, DateTime? after, short? engineClassId)
    {
        var timestamps = await BasePlayerQuery(profileId, after, null, engineClassId)
            .Select(r => r.RaceTimestamp)
            .ToListAsync();

        var rows = timestamps
            .GroupBy(ts => ts.Hour)
            .Select(g => (Hour: g.Key, Count: g.Count()));

        return [.. rows];
    }

    // ===== RACE BROWSER =====

    public async Task<(List<RaceKey> Races, int TotalCount)> GetDistinctRacesAsync(
        string? roomId,
        int? raceNumber,
        short? courseId,
        short? engineClassId,
        long? profileId,
        DateTime? from,
        DateTime? to,
        int page,
        int pageSize)
    {
        IQueryable<RaceResultEntity> query = _context.RaceResults
            .AsNoTracking()
            .Where(r => r.PlayerId == 0);

        if (!string.IsNullOrEmpty(roomId))
            query = query.Where(r => r.RoomId == roomId);
        if (raceNumber.HasValue)
            query = query.Where(r => r.RaceNumber == raceNumber.Value);
        if (courseId.HasValue)
            query = query.Where(r => r.CourseId == courseId.Value);
        if (engineClassId.HasValue)
            query = query.Where(r => r.EngineClassId == engineClassId.Value);
        if (profileId.HasValue)
            query = query.Where(r => r.ProfileId == profileId.Value);
        if (from.HasValue)
            query = query.Where(r => r.RaceTimestamp >= from.Value);
        if (to.HasValue)
            query = query.Where(r => r.RaceTimestamp <= to.Value);

        var distinctQuery = query
            .GroupBy(r => new { r.RoomId, r.RaceNumber })
            .Select(g => new
            {
                g.Key.RoomId,
                g.Key.RaceNumber,
                RaceTimestamp = g.Min(r => r.RaceTimestamp),
                CourseId = g.Min(r => r.CourseId),
                EngineClassId = g.Min(r => r.EngineClassId),
            })
            .OrderByDescending(r => r.RaceTimestamp);

        var totalCount = await distinctQuery.CountAsync();
        var pageRows = await distinctQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var races = pageRows
            .Select(r => new RaceKey(r.RoomId, r.RaceNumber, r.RaceTimestamp, r.CourseId, r.EngineClassId))
            .ToList();

        return (races, totalCount);
    }

    public async Task<List<RaceResultEntity>> GetParticipantsByRaceKeysAsync(List<RaceKey> raceKeys)
    {
        if (raceKeys.Count == 0) return [];

        var roomIds = raceKeys.Select(k => k.RoomId).Distinct().ToList();
        var raceKeySet = raceKeys.Select(k => (k.RoomId, k.RaceNumber)).ToHashSet();

        var rows = await _context.RaceResults
            .AsNoTracking()
            .Where(r => roomIds.Contains(r.RoomId) && r.PlayerId == 0)
            .ToListAsync();

        return rows.Where(r => raceKeySet.Contains((r.RoomId, r.RaceNumber))).ToList();
    }

    public async Task<(List<(long ProfileId, int FinishTime, DateTime AchievedAt, string Rk)> Rows, int TotalCount, float? AverageBestSeconds)>
        GetTrackOnlineBestsAsync(short courseId, short? engineClassId, int page, int pageSize)
    {
        var allowed = AllowedRkValues;
        IQueryable<RaceResultEntity> query = _context.RaceResults
            .AsNoTracking()
            .Where(r => r.CourseId == courseId && r.PlayerId == 0 && r.FinishPos != 0
                     && r.IsPublic == true && r.Rk != null && allowed.Contains(r.Rk));

        if (engineClassId.HasValue)
            query = query.Where(r => r.EngineClassId == engineClassId.Value);

        // BKT floor: non-glitch/non-shroomless world record minus 2 seconds for the cc class.
        float floorSeconds = 0f;
        if (engineClassId.HasValue)
        {
            short ccValue = engineClassId.Value == 1 ? (short)200 : (short)150;
            var bktMs = await _context.GhostSubmissions
                .AsNoTracking()
                .Join(_context.Tracks, g => g.TrackId, t => t.Id,
                    (g, t) => new { g.CC, g.FinishTimeMs, g.Glitch, g.Shroomless, t.CourseId })
                .Where(x => x.CourseId == courseId && x.CC == ccValue && !x.Glitch && !x.Shroomless)
                .MinAsync(x => (int?)x.FinishTimeMs);

            if (bktMs.HasValue)
                floorSeconds = Math.Max(0f, (bktMs.Value - 2000) / 1000f);
        }

        const float CapSeconds = 330f; // online races end by default after 5:30

        // Project only 4 fields before materializing so the query stays lightweight.
        var allRows = await query
            .Select(r => new { r.ProfileId, r.FinishTime, r.RaceTimestamp, r.Rk })
            .ToListAsync();

        // Filter impossible times before grouping so a player with one bad time
        // can still appear with their next-best valid time.
        var validRows = allRows.Where(r =>
        {
            float secs = BitConverter.Int32BitsToSingle(r.FinishTime);
            return secs >= floorSeconds && secs <= CapSeconds;
        }).ToList();

        // Group and find the best time per player in memory.
        var bestPerPlayer = validRows
            .GroupBy(r => r.ProfileId)
            .Select(g =>
            {
                var best = g.OrderBy(r => r.FinishTime).First();
                return (ProfileId: g.Key, FinishTime: best.FinishTime, AchievedAt: best.RaceTimestamp, Rk: best.Rk!);
            })
            .OrderBy(x => x.FinishTime)
            .ToList();

        var totalCount = bestPerPlayer.Count;

        // Average of per-player personal bests (convert IEEE 754 int bit patterns to seconds).
        float? avgBestSeconds = totalCount > 0
            ? (float)bestPerPlayer.Average(r => (double)BitConverter.Int32BitsToSingle(r.FinishTime))
            : null;

        var pageRows = bestPerPlayer
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return (pageRows, totalCount, avgBestSeconds);
    }

    public async Task<List<(short CourseId, short EngineClassId, int FinishTime, DateTime AchievedAt, string Rk)>>
        GetPlayerOnlineBestsAsync(long profileId)
    {
        var allowed = AllowedRkValues;
        var allRows = await _context.RaceResults
            .AsNoTracking()
            .Where(r => r.ProfileId == profileId && r.PlayerId == 0 && r.FinishPos != 0
                     && r.IsPublic == true && r.Rk != null && allowed.Contains(r.Rk))
            .Select(r => new { r.CourseId, r.EngineClassId, r.FinishTime, r.RaceTimestamp, r.Rk })
            .ToListAsync();

        // Fetch BKT floors for all relevant (courseId, cc) combos in one query.
        var courseIds = allRows.Select(r => r.CourseId).Distinct().ToList();
        var bktData = await _context.GhostSubmissions
            .AsNoTracking()
            .Join(_context.Tracks, g => g.TrackId, t => t.Id,
                (g, t) => new { g.CC, g.FinishTimeMs, g.Glitch, g.Shroomless, t.CourseId })
            .Where(x => courseIds.Contains(x.CourseId) && !x.Glitch && !x.Shroomless)
            .GroupBy(x => new { x.CourseId, x.CC })
            .Select(g => new { g.Key.CourseId, g.Key.CC, MinMs = g.Min(x => x.FinishTimeMs) })
            .ToListAsync();

        // (courseId, engineClassId) → floor in seconds (BKT - 2s). engineClassId: 1=200cc, 2=150cc.
        var floors = bktData.ToDictionary(
            x => (x.CourseId, (short)(x.CC == 200 ? 1 : 2)),
            x => Math.Max(0f, (x.MinMs - 2000) / 1000f));

        const float CapSeconds = 330f;

        var validRows = allRows.Where(r =>
        {
            float secs = BitConverter.Int32BitsToSingle(r.FinishTime);
            if (secs > CapSeconds) return false;
            if (floors.TryGetValue((r.CourseId, r.EngineClassId), out var floor) && secs < floor) return false;
            return true;
        }).ToList();

        return validRows
            .GroupBy(r => (r.CourseId, r.EngineClassId))
            .Select(g =>
            {
                var best = g.OrderBy(r => r.FinishTime).First();
                return (
                    CourseId: g.Key.CourseId,
                    EngineClassId: g.Key.EngineClassId,
                    FinishTime: best.FinishTime,
                    AchievedAt: best.RaceTimestamp,
                    Rk: best.Rk!
                );
            })
            .OrderBy(x => x.CourseId)
            .ThenBy(x => x.EngineClassId)
            .ToList();
    }
}
