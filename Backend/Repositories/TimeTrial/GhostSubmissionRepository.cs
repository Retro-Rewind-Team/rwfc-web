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
            .Include(g => g.GhostFile)
            .FirstOrDefaultAsync(g => g.Id == id);

    public async Task<HashSet<int>> GetExistingGhostFileIdsAsync(IEnumerable<int> submissionIds) =>
        (await _context.GhostFileBlobs
            .Where(b => submissionIds.Contains(b.Id))
            .Select(b => b.Id)
            .ToListAsync())
        .ToHashSet();

    public async Task AddAsync(GhostSubmissionEntity submission)
    {
        await _context.GhostSubmissions.AddAsync(submission);
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
                        ""LapCount"", ""LapSplitsMs"", ""DateSet"", ""SubmittedAt"",
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
                        ""LapCount"", ""LapSplitsMs"", ""DateSet"", ""SubmittedAt"",
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
            // Counts are computed for every profile, but only rows whose count actually moved are
            // written. Previously this was an unqualified UPDATE, so every ghost submit and every
            // delete rewrote the whole TTProfiles table and stamped UpdatedAt on all of it, making
            // that column useless as a "when did this profile last change" signal.
            await _context.Database.ExecuteSqlAsync($@"
                WITH all_wrs AS (

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

                        -- Flap records rank on the fastest single lap, not the fastest total time.
                        -- Ordering by FinishTimeMs here credited whoever had the quickest overall
                        -- run among flap submissions, disagreeing with GetFlapWorldRecordHistoryAsync
                        -- which this now matches.
                        SELECT ""TTProfileId"" FROM (
                            SELECT DISTINCT ON (""TrackId"", ""CC"", ""Glitch"")
                                ""TTProfileId""
                            FROM (
                                SELECT ""TTProfileId"", ""TrackId"", ""CC"", ""Glitch"", ""SubmittedAt"",
                                       (
                                           SELECT MIN(lap::int)
                                           FROM jsonb_array_elements_text(""LapSplitsMs"") AS lap
                                       ) AS fastest_lap
                                FROM ""GhostSubmissions""
                                WHERE ""IsFlap"" = true AND ""Shroomless"" = false
                            ) flap_candidates
                            ORDER BY ""TrackId"", ""CC"", ""Glitch"", fastest_lap, ""SubmittedAt""
                        ) flap

                ),
                counts AS (
                    SELECT ""TTProfileId"" AS profile_id, CAST(COUNT(*) AS INTEGER) AS wr_count
                    FROM all_wrs
                    GROUP BY ""TTProfileId""
                ),
                target AS (
                    SELECT p.""Id"" AS profile_id, COALESCE(c.wr_count, 0) AS wr_count
                    FROM ""TTProfiles"" p
                    LEFT JOIN counts c ON c.profile_id = p.""Id""
                )
                UPDATE ""TTProfiles"" p
                SET ""CurrentWorldRecords"" = t.wr_count,
                    ""UpdatedAt"" = {DateTime.UtcNow}
                FROM target t
                WHERE p.""Id"" = t.profile_id
                  AND p.""CurrentWorldRecords"" IS DISTINCT FROM t.wr_count
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

    public async Task<Dictionary<int, GhostSubmissionEntity>> GetAllWorldRecordsAsync(
        short cc,
        bool glitchAllowed,
        bool? shroomless = null,
        short? minVehicleId = null,
        short? maxVehicleId = null,
        string? trackCategory = null)
    {
        var query = BuildCategoryQuery(cc, glitchAllowed, shroomless, minVehicleId, maxVehicleId);

        if (trackCategory != null)
            query = query.Where(g => g.Track!.Category == trackCategory);

        // Only the winning row per track comes back. Materialising the whole category and taking
        // the first of each group pulled every submission ever made in it, with Track and TTProfile
        // joined onto each one.
        var bestPerTrack = query
            .GroupBy(g => g.TrackId)
            .Select(grp => new { TrackId = grp.Key, MinTime = grp.Min(g => g.FinishTimeMs) });

        var winners = await query
            .Where(g => bestPerTrack.Any(b => b.TrackId == g.TrackId && b.MinTime == g.FinishTimeMs))
            .ToListAsync();

        // Two runs can share the winning time, so settle ties on submission order.
        return winners
            .GroupBy(g => g.TrackId)
            .ToDictionary(grp => grp.Key, grp => grp.OrderBy(g => g.SubmittedAt).First());
    }

    public async Task<List<GhostSubmissionEntity>> GetWorldRecordHoldersForRankingsAsync(
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? minVehicleId,
        short? maxVehicleId,
        string? trackCategory)
    {
        var results = new List<GhostSubmissionEntity>();

        bool includeNonShroomless = shroomless != true;
        bool includeShroomless = shroomless != false;

        // Karts (VehicleId 0-17, non-shroomless) -- separate category from bikes
        if (includeNonShroomless)
        {
            int kartMin = Math.Max((int)(minVehicleId ?? 0), 0);
            int kartMax = Math.Min((int)(maxVehicleId ?? 17), 17);
            if (kartMin <= kartMax)
            {
                var q = BuildRankingsBaseQuery(cc, glitchAllowed, trackCategory)
                    .Where(g => !g.Shroomless && g.VehicleId >= kartMin && g.VehicleId <= kartMax);
                results.AddRange(await BestPerTrackAndGlitchAsync(q));
            }
        }

        // Bikes (VehicleId 18-35, non-shroomless) -- separate category from karts
        if (includeNonShroomless)
        {
            int bikeMin = Math.Max((int)(minVehicleId ?? 18), 18);
            int bikeMax = Math.Min((int)(maxVehicleId ?? 35), 35);
            if (bikeMin <= bikeMax)
            {
                var q = BuildRankingsBaseQuery(cc, glitchAllowed, trackCategory)
                    .Where(g => !g.Shroomless && g.VehicleId >= bikeMin && g.VehicleId <= bikeMax);
                results.AddRange(await BestPerTrackAndGlitchAsync(q));
            }
        }

        // Shroomless (all vehicles unless narrowed by vehicle filter)
        if (includeShroomless)
        {
            var q = BuildRankingsBaseQuery(cc, glitchAllowed, trackCategory)
                .Where(g => g.Shroomless);
            if (minVehicleId.HasValue && maxVehicleId.HasValue)
                q = q.Where(g => g.VehicleId >= minVehicleId.Value && g.VehicleId <= maxVehicleId.Value);
            results.AddRange(await BestPerTrackAndGlitchAsync(q));
        }

        // Flap (non-shroomless only, matches UpdateWorldRecordCountsAsync definition)
        // Excluded when shroomless="only" since there is no shroomless flap category
        if (shroomless != true)
        {
            var q = _context.GhostSubmissions
                .AsNoTracking()
                .Include(g => g.TTProfile)
                .Where(g => g.CC == cc && g.IsFlap && !g.Shroomless);
            if (!glitchAllowed)
                q = q.Where(g => !g.Glitch);
            if (minVehicleId.HasValue && maxVehicleId.HasValue)
                q = q.Where(g => g.VehicleId >= minVehicleId.Value && g.VehicleId <= maxVehicleId.Value);
            if (trackCategory != null)
                q = q.Include(g => g.Track).Where(g => g.Track!.Category == trackCategory);

            // Ranked on the fastest single lap, matching UpdateWorldRecordCountsAsync and
            // GetFlapWorldRecordHistoryAsync. Ordering by FinishTimeMs credited the quickest
            // overall run instead, so the rankings page disagreed with both. LapSplitsMs is a
            // jsonb column, so the minimum is taken after materialising.
            var data = await q.ToListAsync();
            results.AddRange(data
                .Where(g => g.LapSplitsMs.Count > 0)
                .GroupBy(g => (g.TrackId, g.Glitch))
                .Select(grp => grp
                    .OrderBy(g => g.LapSplitsMs.Min())
                    .ThenBy(g => g.SubmittedAt)
                    .First()));
        }

        return results;
    }

    // ===== PRIVATE HELPERS =====

    /// <summary>
    /// Base filtered query for regular leaderboard/WR queries, scoped to a single track.
    /// Always excludes flap runs - those are only returned by GetFlapLeaderboardAsync.
    /// glitchAllowed=true returns all submissions, false returns only non-glitch.
    /// </summary>
    private IQueryable<GhostSubmissionEntity> BuildLeaderboardQuery(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? minVehicleId,
        short? maxVehicleId)
        => BuildCategoryQuery(cc, glitchAllowed, shroomless, minVehicleId, maxVehicleId)
            .Where(g => g.TrackId == trackId);

    /// <summary>
    /// Category filter query without a track constraint, used by both
    /// <see cref="BuildLeaderboardQuery"/> and <see cref="GetAllWorldRecordsAsync"/>.
    /// </summary>
    /// <summary>
    /// Returns the record holder for each (track, glitch) pair in <paramref name="query"/>, ranked
    /// on finish time. The winners are selected server-side: materialising the category and taking
    /// the first of each group pulled every submission in it, with Track and TTProfile joined onto
    /// every row. Ties are settled on submission order so the earliest run keeps the record.
    /// </summary>
    private static async Task<List<GhostSubmissionEntity>> BestPerTrackAndGlitchAsync(
        IQueryable<GhostSubmissionEntity> query)
    {
        var best = query
            .GroupBy(g => new { g.TrackId, g.Glitch })
            .Select(grp => new
            {
                grp.Key.TrackId,
                grp.Key.Glitch,
                MinTime = grp.Min(g => g.FinishTimeMs)
            });

        var winners = await query
            .Where(g => best.Any(b => b.TrackId == g.TrackId && b.Glitch == g.Glitch && b.MinTime == g.FinishTimeMs))
            .ToListAsync();

        return [.. winners
            .GroupBy(g => (g.TrackId, g.Glitch))
            .Select(grp => grp.OrderBy(g => g.SubmittedAt).First())];
    }

    private IQueryable<GhostSubmissionEntity> BuildCategoryQuery(
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
            .Where(g => g.CC == cc && !g.IsFlap);

        if (!glitchAllowed)
            query = query.Where(g => !g.Glitch);

        if (shroomless.HasValue)
            query = query.Where(g => g.Shroomless == shroomless.Value);

        if (minVehicleId.HasValue && maxVehicleId.HasValue)
            query = query.Where(g => g.VehicleId >= minVehicleId.Value && g.VehicleId <= maxVehicleId.Value);

        return query;
    }

    /// <summary>
    /// Base query for <see cref="GetWorldRecordHoldersForRankingsAsync"/> sub-category queries.
    /// Excludes flap, applies CC and glitch filters; vehicle/shroomless are applied per sub-query.
    /// Includes TTProfile (required for ranking display) and Track only when needed for category filter.
    /// </summary>
    private IQueryable<GhostSubmissionEntity> BuildRankingsBaseQuery(
        short cc,
        bool glitchAllowed,
        string? trackCategory)
    {
        var query = _context.GhostSubmissions
            .AsNoTracking()
            .Include(g => g.TTProfile)
            .Where(g => g.CC == cc && !g.IsFlap);

        if (!glitchAllowed)
            query = query.Where(g => !g.Glitch);

        if (trackCategory != null)
            query = query.Include(g => g.Track).Where(g => g.Track!.Category == trackCategory);

        return query;
    }
}
