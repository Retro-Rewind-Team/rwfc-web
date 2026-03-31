using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.DTOs.Common;
using RetroRewindWebsite.Models.Entities.TimeTrial;

namespace RetroRewindWebsite.Repositories.TimeTrial;

public class GhostSubmissionRepository : IGhostSubmissionRepository
{
    private readonly LeaderboardDbContext _context;
    private readonly ILogger<GhostSubmissionRepository> _logger;

    public GhostSubmissionRepository(LeaderboardDbContext context, ILogger<GhostSubmissionRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<GhostSubmissionEntity?> GetByIdAsync(int id) =>
        await _context.GhostSubmissions
            .AsNoTracking()
            .Include(g => g.Track)
            .Include(g => g.TTProfile)
            .FirstOrDefaultAsync(g => g.Id == id);

    public async Task AddAsync(GhostSubmissionEntity submission)
    {
        await _context.GhostSubmissions.AddAsync(submission);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(GhostSubmissionEntity submission)
    {
        _context.GhostSubmissions.Update(submission);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var submission = await _context.GhostSubmissions.FindAsync(id);
        if (submission != null)
        {
            _context.GhostSubmissions.Remove(submission);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<GhostSubmissionEntity>> SearchAsync(
        int? ttProfileId = null,
        int? trackId = null,
        short? cc = null,
        bool? glitch = null,
        bool? shroomless = null,
        bool? isFlap = null,
        short? driftCategory = null,
        int limit = 25)
    {
        var query = _context.GhostSubmissions
            .AsNoTracking()
            .Include(g => g.Track)
            .Include(g => g.TTProfile)
            .AsQueryable();

        if (ttProfileId.HasValue)
            query = query.Where(g => g.TTProfileId == ttProfileId.Value);

        if (trackId.HasValue)
            query = query.Where(g => g.TrackId == trackId.Value);

        if (cc.HasValue)
            query = query.Where(g => g.CC == cc.Value);

        if (glitch.HasValue)
            query = query.Where(g => g.Glitch == glitch.Value);

        if (shroomless.HasValue)
            query = query.Where(g => g.Shroomless == shroomless.Value);

        if (isFlap.HasValue)
            query = query.Where(g => g.IsFlap == isFlap.Value);

        if (driftCategory.HasValue)
            query = query.Where(g => g.DriftCategory == driftCategory.Value);

        return await query
            .OrderByDescending(g => g.SubmittedAt)
            .Take(limit)
            .ToListAsync();
    }

    // ===== LEADERBOARD =====

    public async Task<PagedResult<GhostSubmissionEntity>> GetTrackLeaderboardAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? minVehicleId,
        short? maxVehicleId,
        int page,
        int pageSize)
    {
        var query = BuildLeaderboardQuery(trackId, cc, glitchAllowed, shroomless, minVehicleId, maxVehicleId);
        query = query.OrderBy(g => g.FinishTimeMs);
        return await PagedResult<GhostSubmissionEntity>.CreateAsync(query, page, pageSize);
    }

    public async Task<List<GhostSubmissionEntity>> GetTopTimesForTrackAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? minVehicleId,
        short? maxVehicleId,
        int count)
    {
        var query = BuildLeaderboardQuery(trackId, cc, glitchAllowed, shroomless, minVehicleId, maxVehicleId);
        return await query
            .OrderBy(g => g.FinishTimeMs)
            .Take(count)
            .ToListAsync();
    }

    // ===== FLAP LEADERBOARD =====

    public async Task<PagedResult<GhostSubmissionEntity>> GetFlapLeaderboardAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? minVehicleId,
        short? maxVehicleId,
        int page,
        int pageSize)
    {
        try
        {
            // Count total matching flap submissions for pagination
            var totalCount = await _context.Database
                .SqlQuery<int>($@"
                    SELECT CAST(COUNT(*) AS INTEGER) AS ""Value""
                    FROM ""GhostSubmissions""
                    WHERE ""TrackId"" = {trackId}
                      AND ""CC"" = {cc}
                      AND ""IsFlap"" = true
                      AND ({glitchAllowed} OR ""Glitch"" = false)
                      AND ({shroomless == null} OR ""Shroomless"" = {shroomless ?? false})
                      AND ({!minVehicleId.HasValue} OR (""VehicleId"" >= {minVehicleId ?? 0} AND ""VehicleId"" <= {maxVehicleId ?? 0}))
                ")
                .FirstOrDefaultAsync();

            // Fetch paged results ordered by fastest lap
            var items = await _context.GhostSubmissions
                .FromSqlInterpolated($@"
                    SELECT g.*
                    FROM ""GhostSubmissions"" g
                    WHERE g.""TrackId"" = {trackId}
                      AND g.""CC"" = {cc}
                      AND g.""IsFlap"" = true
                      AND ({glitchAllowed} OR g.""Glitch"" = false)
                      AND ({shroomless == null} OR g.""Shroomless"" = {shroomless ?? false})
                      AND ({!minVehicleId.HasValue} OR (g.""VehicleId"" >= {minVehicleId ?? 0} AND g.""VehicleId"" <= {maxVehicleId ?? 0}))
                    ORDER BY (
                        SELECT MIN(lap::int)
                        FROM jsonb_array_elements_text(g.""LapSplitsMs""::jsonb) AS lap
                    ) ASC
                    LIMIT {pageSize} OFFSET {(page - 1) * pageSize}
                ")
                .Include(g => g.Track)
                .Include(g => g.TTProfile)
                .ToListAsync();

            return new PagedResult<GhostSubmissionEntity>(items, totalCount, page, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting flap leaderboard for track {TrackId} CC {CC}", trackId, cc);
            throw;
        }
    }

    // ===== WORLD RECORD =====

    public async Task<GhostSubmissionEntity?> GetWorldRecordAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless = null,
        short? minVehicleId = null,
        short? maxVehicleId = null)
    {
        var query = BuildLeaderboardQuery(trackId, cc, glitchAllowed, shroomless, minVehicleId, maxVehicleId);
        return await query
            .OrderBy(g => g.FinishTimeMs)
            .FirstOrDefaultAsync();
    }

    public async Task<List<GhostSubmissionEntity>> GetWorldRecordHistoryAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless = null,
        short? minVehicleId = null,
        short? maxVehicleId = null)
    {
        try
        {
            var wrHistory = await _context.GhostSubmissions
                .FromSqlInterpolated($@"
                    WITH FilteredSubmissions AS (
                        SELECT *
                        FROM ""GhostSubmissions""
                        WHERE ""TrackId"" = {trackId}
                          AND ""CC"" = {cc}
                          AND ""IsFlap"" = false
                          AND ({glitchAllowed} OR ""Glitch"" = false)
                          AND ({shroomless == null} OR ""Shroomless"" = {shroomless ?? false})
                          AND ({!minVehicleId.HasValue} OR (""VehicleId"" >= {minVehicleId ?? 0} AND ""VehicleId"" <= {maxVehicleId ?? 0}))
                    ),
                    RankedSubmissions AS (
                        SELECT *,
                               MIN(""FinishTimeMs"") OVER (
                                   ORDER BY ""DateSet"", ""SubmittedAt""
                                   ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                               ) AS BestSoFar
                        FROM FilteredSubmissions
                    ),
                    WorldRecords AS (
                        SELECT *,
                               LAG(""FinishTimeMs"") OVER (ORDER BY ""DateSet"", ""SubmittedAt"") AS PreviousBest
                        FROM RankedSubmissions
                        WHERE ""FinishTimeMs"" = BestSoFar
                    )
                    SELECT 
                        ""Id"", ""TrackId"", ""TTProfileId"", ""CC"", ""FinishTimeMs"", ""FinishTimeDisplay"",
                        ""VehicleId"", ""CharacterId"", ""ControllerType"", ""DriftType"", ""MiiName"",
                        ""LapCount"", ""LapSplitsMs"", ""GhostFilePath"", ""DateSet"", ""SubmittedAt"",
                        ""Shroomless"", ""Glitch"", ""DriftCategory"", ""IsFlap""
                    FROM WorldRecords
                    WHERE PreviousBest IS NULL OR ""FinishTimeMs"" <= PreviousBest
                    ORDER BY ""DateSet"" ASC, ""SubmittedAt"" ASC
                ")
                .Include(g => g.Track)
                .Include(g => g.TTProfile)
                .ToListAsync();

            return [.. wrHistory.OrderBy(g => g.DateSet).ThenBy(g => g.SubmittedAt)];
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting world record history for track {TrackId} CC {CC} GlitchAllowed {GlitchAllowed}",
                trackId, cc, glitchAllowed);
            throw;
        }
    }

    public async Task<List<GhostSubmissionEntity>> GetFlapWorldRecordHistoryAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless = null,
        short? minVehicleId = null,
        short? maxVehicleId = null)
    {
        try
        {
            var history = await _context.GhostSubmissions
                .FromSqlInterpolated($@"
                    WITH FilteredSubmissions AS (
                        SELECT *,
                               (
                                   SELECT MIN(lap::int)
                                   FROM jsonb_array_elements_text(""LapSplitsMs""::jsonb) AS lap
                               ) AS FastestLap
                        FROM ""GhostSubmissions""
                        WHERE ""TrackId"" = {trackId}
                          AND ""CC"" = {cc}
                          AND ""IsFlap"" = true
                          AND ({glitchAllowed} OR ""Glitch"" = false)
                          AND ({shroomless == null} OR ""Shroomless"" = {shroomless ?? false})
                          AND ({!minVehicleId.HasValue} OR (""VehicleId"" >= {minVehicleId ?? 0} AND ""VehicleId"" <= {maxVehicleId ?? 0}))
                    ),
                    RankedSubmissions AS (
                        SELECT *,
                               MIN(FastestLap) OVER (
                                   ORDER BY ""DateSet"", ""SubmittedAt""
                                   ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                               ) AS BestSoFar
                        FROM FilteredSubmissions
                    ),
                    FlapRecords AS (
                        SELECT *,
                               LAG(FastestLap) OVER (ORDER BY ""DateSet"", ""SubmittedAt"") AS PreviousBest
                        FROM RankedSubmissions
                        WHERE FastestLap = BestSoFar
                    )
                    SELECT
                        ""Id"", ""TrackId"", ""TTProfileId"", ""CC"", ""FinishTimeMs"", ""FinishTimeDisplay"",
                        ""VehicleId"", ""CharacterId"", ""ControllerType"", ""DriftType"", ""MiiName"",
                        ""LapCount"", ""LapSplitsMs"", ""GhostFilePath"", ""DateSet"", ""SubmittedAt"",
                        ""Shroomless"", ""Glitch"", ""DriftCategory"", ""IsFlap""
                    FROM FlapRecords
                    WHERE PreviousBest IS NULL OR FastestLap <= PreviousBest
                    ORDER BY ""DateSet"" ASC, ""SubmittedAt"" ASC
                ")
                .Include(g => g.Track)
                .Include(g => g.TTProfile)
                .ToListAsync();

            return [.. history.OrderBy(g => g.DateSet).ThenBy(g => g.SubmittedAt)];
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting flap WR history for track {TrackId} CC {CC} GlitchAllowed {GlitchAllowed}",
                trackId, cc, glitchAllowed);
            throw;
        }
    }

    // ===== FLAP =====

    public async Task<int?> GetFastestLapForTrackAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless = null,
        short? minVehicleId = null,
        short? maxVehicleId = null)
    {
        try
        {
            return await _context.Database
                .SqlQuery<int?>($@"
                    WITH LapTimes AS (
                        SELECT jsonb_array_elements_text(""LapSplitsMs""::jsonb)::int AS LapTime
                        FROM ""GhostSubmissions""
                        WHERE ""TrackId"" = {trackId}
                          AND ""CC"" = {cc}
                          AND ""IsFlap"" = false
                          AND ({glitchAllowed} OR ""Glitch"" = false)
                          AND ({shroomless == null} OR ""Shroomless"" = {shroomless ?? false})
                          AND ({!minVehicleId.HasValue} OR (""VehicleId"" >= {minVehicleId ?? 0} AND ""VehicleId"" <= {maxVehicleId ?? 0}))
                    )
                    SELECT MIN(LapTime) AS ""Value""
                    FROM LapTimes
                ")
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting fastest lap for track {TrackId} CC {CC}", trackId, cc);
            throw;
        }
    }

    // ===== PLAYER SUBMISSIONS =====

    public async Task<PagedResult<GhostSubmissionEntity>> GetPlayerSubmissionsAsync(
        int ttProfileId,
        int page,
        int pageSize,
        int? trackId = null,
        short? cc = null,
        bool? glitch = null,
        bool? shroomless = null,
        short? minVehicleId = null,
        short? maxVehicleId = null)
    {
        var query = _context.GhostSubmissions
            .AsNoTracking()
            .Include(g => g.Track)
            .Include(g => g.TTProfile)
            .Where(g => g.TTProfileId == ttProfileId);

        if (trackId.HasValue)
            query = query.Where(g => g.TrackId == trackId.Value);

        if (cc.HasValue)
            query = query.Where(g => g.CC == cc.Value);

        if (glitch.HasValue)
            query = query.Where(g => g.Glitch == glitch.Value);

        if (shroomless.HasValue)
            query = query.Where(g => g.Shroomless == shroomless.Value);

        if (minVehicleId.HasValue && maxVehicleId.HasValue)
            query = query.Where(g => g.VehicleId >= minVehicleId.Value && g.VehicleId <= maxVehicleId.Value);

        query = query.OrderByDescending(g => g.SubmittedAt);

        return await PagedResult<GhostSubmissionEntity>.CreateAsync(query, page, pageSize);
    }

    // ===== PROFILE STATS =====

    public async Task<int> GetTotalSubmissionsCountAsync() =>
        await _context.GhostSubmissions.CountAsync();

    public async Task<int> GetProfileSubmissionsCountAsync(int ttProfileId) =>
        await _context.GhostSubmissions.CountAsync(g => g.TTProfileId == ttProfileId);

    public async Task<int> GetProfileWorldRecordsCountAsync(int ttProfileId)
    {
        try
        {
            return await _context.Database
                .SqlQuery<int>($@"
                    SELECT CAST(COUNT(*) AS INTEGER) as ""Value""
                    FROM (
                        SELECT DISTINCT ON (""TrackId"", ""CC"", ""Glitch"")
                            ""TrackId"", ""CC"", ""Glitch"", ""TTProfileId""
                        FROM ""GhostSubmissions""
                        WHERE ""IsFlap"" = false
                        ORDER BY ""TrackId"", ""CC"", ""Glitch"", ""FinishTimeMs"", ""SubmittedAt""
                    ) wr
                    WHERE wr.""TTProfileId"" = {ttProfileId}
                ")
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting world records count for profile {ProfileId}", ttProfileId);
            throw;
        }
    }

    public async Task<double> CalculateAverageFinishPositionAsync(int ttProfileId)
    {
        try
        {
            return await _context.Database
                .SqlQuery<double>($@"
                    WITH RankedSubmissions AS (
                        SELECT 
                            ""TTProfileId"",
                            RANK() OVER (
                                PARTITION BY ""TrackId"", ""CC"", ""Glitch""
                                ORDER BY ""FinishTimeMs""
                            ) as Position
                        FROM ""GhostSubmissions""
                        WHERE ""IsFlap"" = false
                    )
                    SELECT COALESCE(AVG(CAST(Position AS FLOAT)), 0.0) as ""Value""
                    FROM RankedSubmissions
                    WHERE ""TTProfileId"" = {ttProfileId}
                ")
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating average finish position for profile {ProfileId}", ttProfileId);
            throw;
        }
    }

    public async Task<int> CountTop10FinishesAsync(int ttProfileId)
    {
        try
        {
            return await _context.Database
                .SqlQuery<int>($@"
                    WITH RankedSubmissions AS (
                        SELECT 
                            ""TTProfileId"",
                            RANK() OVER (
                                PARTITION BY ""TrackId"", ""CC"", ""Glitch""
                                ORDER BY ""FinishTimeMs""
                            ) as Position
                        FROM ""GhostSubmissions""
                        WHERE ""IsFlap"" = false
                    )
                    SELECT CAST(COUNT(*) AS INTEGER) as ""Value""
                    FROM RankedSubmissions
                    WHERE ""TTProfileId"" = {ttProfileId}
                      AND Position <= 10
                ")
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error counting top 10 finishes for profile {ProfileId}", ttProfileId);
            throw;
        }
    }

    public async Task<int> CountDistinctTracksAsync(int ttProfileId, short? cc = null)
    {
        var query = _context.GhostSubmissions
            .Where(g => g.TTProfileId == ttProfileId);

        if (cc.HasValue)
            query = query.Where(g => g.CC == cc.Value);

        return await query
            .Select(g => g.TrackId)
            .Distinct()
            .CountAsync();
    }

    // ===== WORLD RECORD COUNTS =====

    public async Task UpdateWorldRecordCountsAsync()
    {
        try
        {
            await _context.Database.ExecuteSqlAsync($@"
                UPDATE ""TTProfiles"" p
                SET ""CurrentWorldRecords"" = (
                    SELECT CAST(COUNT(*) AS INTEGER) FROM (

                        SELECT ""TTProfileId"" FROM (
                            SELECT DISTINCT ON (""TrackId"", ""CC"", ""Glitch"")
                                ""TTProfileId""
                            FROM ""GhostSubmissions""
                            WHERE ""IsFlap"" = false AND ""Shroomless"" = false
                              AND ""VehicleId"" BETWEEN 0 AND 17
                            ORDER BY ""TrackId"", ""CC"", ""Glitch"", ""FinishTimeMs"", ""SubmittedAt""
                        ) karts

                        UNION ALL

                        SELECT ""TTProfileId"" FROM (
                            SELECT DISTINCT ON (""TrackId"", ""CC"", ""Glitch"")
                                ""TTProfileId""
                            FROM ""GhostSubmissions""
                            WHERE ""IsFlap"" = false AND ""Shroomless"" = false
                              AND ""VehicleId"" BETWEEN 18 AND 35
                            ORDER BY ""TrackId"", ""CC"", ""Glitch"", ""FinishTimeMs"", ""SubmittedAt""
                        ) bikes

                        UNION ALL

                        SELECT ""TTProfileId"" FROM (
                            SELECT DISTINCT ON (""TrackId"", ""CC"", ""Glitch"")
                                ""TTProfileId""
                            FROM ""GhostSubmissions""
                            WHERE ""IsFlap"" = false AND ""Shroomless"" = true
                            ORDER BY ""TrackId"", ""CC"", ""Glitch"", ""FinishTimeMs"", ""SubmittedAt""
                        ) shroomless

                        UNION ALL

                        SELECT ""TTProfileId"" FROM (
                            SELECT DISTINCT ON (""TrackId"", ""CC"", ""Glitch"")
                                ""TTProfileId""
                            FROM ""GhostSubmissions""
                            WHERE ""IsFlap"" = true AND ""Shroomless"" = false
                            ORDER BY ""TrackId"", ""CC"", ""Glitch"", ""FinishTimeMs"", ""SubmittedAt""
                        ) flap

                    ) all_wrs
                    WHERE ""TTProfileId"" = p.""Id""
                ),
                ""UpdatedAt"" = {DateTime.UtcNow}
            ");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating world record counts for all profiles");
            throw;
        }
    }

    // ===== BKT (Discord bot) =====

    public async Task<GhostSubmissionEntity?> GetBestKnownTimeAsync(
        int trackId,
        short cc,
        bool nonGlitchOnly,
        bool? shroomless = null,
        short? minVehicleId = null,
        short? maxVehicleId = null,
        short? driftType = null,
        short? driftCategory = null)
    {
        var query = _context.GhostSubmissions
            .AsNoTracking()
            .Include(g => g.Track)
            .Include(g => g.TTProfile)
            .Where(g => g.TrackId == trackId && g.CC == cc && !g.IsFlap);

        if (nonGlitchOnly)
            query = query.Where(g => !g.Glitch);

        if (shroomless.HasValue)
            query = query.Where(g => g.Shroomless == shroomless.Value);

        if (minVehicleId.HasValue && maxVehicleId.HasValue)
            query = query.Where(g => g.VehicleId >= minVehicleId.Value && g.VehicleId <= maxVehicleId.Value);

        if (driftType.HasValue)
            query = query.Where(g => g.DriftType == driftType.Value);

        if (driftCategory.HasValue)
            query = query.Where(g => g.DriftCategory == driftCategory.Value);

        return await query
            .OrderBy(g => g.FinishTimeMs)
            .FirstOrDefaultAsync();
    }

    // ===== PRIVATE HELPERS =====

    /// <summary>
    /// Base filtered query for regular leaderboard/WR queries.
    /// Always excludes flap runs — those are only returned by GetFlapLeaderboardAsync.
    /// glitchAllowed=true returns all submissions, false returns only non-glitch.
    /// </summary>
    private IQueryable<GhostSubmissionEntity> BuildLeaderboardQuery(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? minVehicleId,
        short? maxVehicleId)
    {
        var query = _context.GhostSubmissions
            .AsNoTracking()
            .Include(g => g.Track)
            .Include(g => g.TTProfile)
            .Where(g => g.TrackId == trackId && g.CC == cc && !g.IsFlap);

        if (!glitchAllowed)
            query = query.Where(g => !g.Glitch);

        if (shroomless.HasValue)
            query = query.Where(g => g.Shroomless == shroomless.Value);

        if (minVehicleId.HasValue && maxVehicleId.HasValue)
            query = query.Where(g => g.VehicleId >= minVehicleId.Value && g.VehicleId <= maxVehicleId.Value);

        return query;
    }
}
