using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Data;
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

    private IQueryable<RaceResultEntity> BasePlayerQuery(long profileId, DateTime? after, short? courseId)
    {
        var query = _context.RaceResults
            .AsNoTracking()
            .Where(r => r.ProfileId == profileId);

        if (after.HasValue)
            query = query.Where(r => r.RaceTimestamp >= after.Value);

        if (courseId.HasValue)
            query = query.Where(r => r.CourseId == courseId.Value);

        return query;
    }

    private IQueryable<RaceResultEntity> BaseGlobalQuery(DateTime? after)
    {
        var query = _context.RaceResults.AsNoTracking();

        if (after.HasValue)
            query = query.Where(r => r.RaceTimestamp >= after.Value);

        return query;
    }

    // ===== PLAYER =====

    public async Task<int> GetTotalRaceCountByPlayerAsync(long profileId, DateTime? after, short? courseId) =>
        await BasePlayerQuery(profileId, after, courseId).CountAsync();

    public async Task<DateTime?> GetEarliestRaceTimestampAsync() =>
        await _context.RaceResults
            .AsNoTracking()
            .MinAsync(r => (DateTime?)r.RaceTimestamp);

    public async Task<List<(short CourseId, int Count)>> GetTopTracksByPlayerAsync(long profileId, int limit, DateTime? after, short? courseId)
    {
        var rows = await BasePlayerQuery(profileId, after, courseId)
            .GroupBy(r => r.CourseId)
            .Select(g => new { CourseId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(limit)
            .ToListAsync();

        return [.. rows.Select(x => (x.CourseId, x.Count))];
    }

    public async Task<List<(short Id, int Count)>> GetTopCharactersByPlayerAsync(long profileId, int limit, DateTime? after, short? courseId)
    {
        var rows = await BasePlayerQuery(profileId, after, courseId)
            .GroupBy(r => r.CharacterId)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(limit)
            .ToListAsync();

        return [.. rows.Select(x => (x.Id, x.Count))];
    }

    public async Task<List<(short Id, int Count)>> GetTopVehiclesByPlayerAsync(long profileId, int limit, DateTime? after, short? courseId)
    {
        var rows = await BasePlayerQuery(profileId, after, courseId)
            .GroupBy(r => r.VehicleId)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(limit)
            .ToListAsync();

        return [.. rows.Select(x => (x.Id, x.Count))];
    }

    public async Task<List<(short CharacterId, short VehicleId, int Count)>> GetTopCombosByPlayerAsync(long profileId, int limit, DateTime? after, short? courseId)
    {
        var rows = await BasePlayerQuery(profileId, after, courseId)
            .GroupBy(r => new { r.CharacterId, r.VehicleId })
            .Select(g => new { g.Key.CharacterId, g.Key.VehicleId, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(limit)
            .ToListAsync();

        return [.. rows.Select(x => (x.CharacterId, x.VehicleId, x.Count))];
    }

    public async Task<long> GetTotalFramesIn1stByPlayerAsync(long profileId, DateTime? after, short? courseId) =>
        await BasePlayerQuery(profileId, after, courseId)
            .SumAsync(r => (long)r.FramesIn1st);

    public async Task<(List<RaceResultEntity> Rows, int TotalCount)> GetRecentRacesByPlayerAsync(
        long profileId, int page, int pageSize, DateTime? after, short? courseId)
    {
        var query = BasePlayerQuery(profileId, after, courseId)
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
        await BaseGlobalQuery(after).CountAsync();

    public async Task<int> GetUniquePlayerCountAsync(DateTime? after) =>
        await BaseGlobalQuery(after)
            .Select(r => r.ProfileId)
            .Distinct()
            .CountAsync();

    public async Task<List<(short CourseId, int Count)>> GetAllPlayedTracksAsync(DateTime? after)
    {
        var rows = await BaseGlobalQuery(after)
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
        var rows = await BaseGlobalQuery(after)
            .GroupBy(r => (int)r.RaceTimestamp.DayOfWeek)
            .Select(g => new { DayOfWeek = g.Key, Count = g.Count() })
            .ToListAsync();

        return [.. rows.Select(x => (x.DayOfWeek, x.Count))];
    }

    public async Task<List<(int Hour, int Count)>> GetRaceCountByHourAsync(DateTime? after)
    {
        var rows = await BaseGlobalQuery(after)
            .GroupBy(r => r.RaceTimestamp.Hour)
            .Select(g => new { Hour = g.Key, Count = g.Count() })
            .ToListAsync();

        return [.. rows.Select(x => (x.Hour, x.Count))];
    }
}
