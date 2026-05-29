using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Domain;
using RetroRewindWebsite.Models.Entities.RaceResult;

namespace RetroRewindWebsite.Repositories.RaceResult;

public class RaceStatsRepository : IRaceStatsRepository
{
    private readonly LeaderboardDbContext _context;

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

        // Bucket positions 9+ into position 9
        return rows
            .GroupBy(r => r.Position > 8 ? (short)9 : r.Position)
            .Select(g => (g.Key, g.Sum(x => x.Count)))
            .OrderBy(x => x.Item1)
            .ToList();
    }

    public async Task<List<(short CourseId, int RaceCount, int WinCount, double AvgFinishPos)>> GetTrackPerformanceByPlayerAsync(
        long profileId, DateTime? after, short? engineClassId)
    {
        var rows = await BasePlayerQuery(profileId, after, null, engineClassId)
            .GroupBy(r => r.CourseId)
            .Select(g => new
            {
                CourseId = g.Key,
                RaceCount = g.Count(),
                WinCount = g.Count(r => r.FinishPos == 1),
                AvgFinishPos = g.Average(r => (double)r.FinishPos),
            })
            .OrderByDescending(g => g.RaceCount)
            .ToListAsync();

        return rows.Select(r => (r.CourseId, r.RaceCount, r.WinCount, r.AvgFinishPos)).ToList();
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
}
