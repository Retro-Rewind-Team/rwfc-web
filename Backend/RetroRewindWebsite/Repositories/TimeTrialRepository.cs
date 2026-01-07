using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Common;
using RetroRewindWebsite.Models.Entities;

namespace RetroRewindWebsite.Repositories
{
    public class TimeTrialRepository : ITimeTrialRepository
    {
        private readonly LeaderboardDbContext _context;
        private readonly ILogger<TimeTrialRepository> _logger;

        public TimeTrialRepository(LeaderboardDbContext context, ILogger<TimeTrialRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ===== TRACK OPERATIONS =====

        public async Task<TrackEntity?> GetTrackByIdAsync(int id)
        {
            return await _context.Tracks
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<List<TrackEntity>> GetAllTracksAsync()
        {
            return await _context.Tracks
                .AsNoTracking()
                .OrderBy(t => t.Id)
                .ThenBy(t => t.Category)
                .ToListAsync();
        }

        public async Task<TrackEntity?> GetTrackByCourseIdAsync(short courseId)
        {
            return await _context.Tracks
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.CourseId == courseId);
        }

        public async Task AddTrackAsync(TrackEntity track)
        {
            await _context.Tracks.AddAsync(track);
            await _context.SaveChangesAsync();
        }

        // ===== TT PROFILE OPERATIONS =====

        public async Task<TTProfileEntity?> GetTTProfileByIdAsync(int id)
        {
            return await _context.TTProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<TTProfileEntity?> GetTTProfileByNameAsync(string displayName)
        {
            return await _context.TTProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.DisplayName == displayName);
        }

        public async Task AddTTProfileAsync(TTProfileEntity profile)
        {
            await _context.TTProfiles.AddAsync(profile);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateTTProfileAsync(TTProfileEntity profile)
        {
            profile.UpdatedAt = DateTime.UtcNow;
            _context.TTProfiles.Update(profile);
            await _context.SaveChangesAsync();
        }

        public async Task<List<TTProfileEntity>> GetAllTTProfilesAsync()
        {
            return await _context.TTProfiles
                .AsNoTracking()
                .OrderBy(p => p.DisplayName)
                .ToListAsync();
        }

        public async Task DeleteTTProfileAsync(int id)
        {
            var profile = await _context.TTProfiles.FindAsync(id);
            if (profile != null)
            {
                _context.TTProfiles.Remove(profile);
                await _context.SaveChangesAsync();
            }
        }

        public async Task UpdateWorldRecordCounts()
        {
            try
            {
                await _context.Database.ExecuteSqlAsync($@"
                    UPDATE ""TTProfiles"" p
                    SET ""CurrentWorldRecords"" = (
                        SELECT CAST(COUNT(*) AS INTEGER)
                        FROM (
                            SELECT DISTINCT ON (""TrackId"", ""CC"", ""Glitch"")
                                ""TrackId"", ""CC"", ""Glitch"", ""TTProfileId""
                            FROM ""GhostSubmissions""
                            WHERE ""TTProfileId"" = p.""Id""
                            ORDER BY ""TrackId"", ""CC"", ""Glitch"", ""FinishTimeMs"", ""SubmittedAt""
                        ) wr
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

        // ===== GHOST SUBMISSION OPERATIONS =====

        public async Task<GhostSubmissionEntity?> GetGhostSubmissionByIdAsync(int id)
        {
            return await _context.GhostSubmissions
                .AsNoTracking()
                .Include(g => g.Track)
                .Include(g => g.TTProfile)
                .FirstOrDefaultAsync(g => g.Id == id);
        }

        public async Task AddGhostSubmissionAsync(GhostSubmissionEntity submission)
        {
            await _context.GhostSubmissions.AddAsync(submission);
            await _context.SaveChangesAsync();
        }

        public async Task<List<GhostSubmissionEntity>> SearchGhostSubmissionsAsync(
            int? ttProfileId = null,
            int? trackId = null,
            short? cc = null,
            bool? glitch = null,
            bool? shroomless = null,
            short? driftCategory = null,
            int limit = 25)
        {
            var query = _context.GhostSubmissions
                .Include(s => s.Track)
                .Include(s => s.TTProfile)
                .AsQueryable();

            if (ttProfileId.HasValue)
                query = query.Where(s => s.TTProfileId == ttProfileId.Value);

            if (trackId.HasValue)
                query = query.Where(s => s.TrackId == trackId.Value);

            if (cc.HasValue)
                query = query.Where(s => s.CC == cc.Value);

            if (glitch.HasValue)
                query = query.Where(s => s.Glitch == glitch.Value);

            if (shroomless.HasValue)
                query = query.Where(s => s.Shroomless == shroomless.Value);

            if (driftCategory.HasValue)
                query = query.Where(s => s.DriftCategory == driftCategory.Value);

            return await query
                .OrderByDescending(s => s.SubmittedAt)
                .Take(limit)
                .ToListAsync();
        }

        public async Task DeleteGhostSubmissionAsync(int id)
        {
            var submission = await _context.GhostSubmissions.FindAsync(id);
            if (submission != null)
            {
                _context.GhostSubmissions.Remove(submission);
                await _context.SaveChangesAsync();
            }
        }

        // ===== LEADERBOARD QUERIES =====

        public async Task<PagedResult<GhostSubmissionEntity>> GetTrackLeaderboardAsync(
            int trackId,
            short cc,
            bool glitch,
            int page,
            int pageSize)
        {
            var query = _context.GhostSubmissions
                .AsNoTracking()
                .Include(g => g.Track)
                .Include(g => g.TTProfile)
                .Where(g => g.TrackId == trackId && g.CC == cc);

            if (!glitch)
            {
                query = query.Where(g => g.Glitch == false);
            }

            query = query
                .OrderBy(g => g.FinishTimeMs)
                .ThenBy(g => g.SubmittedAt);

            var totalCount = await query.CountAsync();
            var submissions = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<GhostSubmissionEntity>
            {
                Items = submissions,
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize
            };
        }

        public async Task<List<GhostSubmissionEntity>> GetTopTimesForTrackAsync(
            int trackId,
            short cc,
            bool glitch,
            int count)
        {
            var query = _context.GhostSubmissions
                .AsNoTracking()
                .Include(g => g.Track)
                .Include(g => g.TTProfile)
                .Where(g => g.TrackId == trackId && g.CC == cc);

            if (!glitch)
            {
                query = query.Where(g => g.Glitch == false);
            }

            return await query
                .OrderBy(g => g.FinishTimeMs)
                .ThenBy(g => g.SubmittedAt)
                .Take(count)
                .ToListAsync();
        }

        public async Task<GhostSubmissionEntity?> GetWorldRecordAsync(int trackId, short cc, bool glitch)
        {
            var query = _context.GhostSubmissions
                .AsNoTracking()
                .Include(g => g.Track)
                .Include(g => g.TTProfile)
                .Where(g => g.TrackId == trackId && g.CC == cc);

            if (!glitch)
            {
                query = query.Where(g => g.Glitch == false);
            }

            return await query
                .OrderBy(g => g.FinishTimeMs)
                .ThenBy(g => g.SubmittedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<List<GhostSubmissionEntity>> GetPlayerSubmissionsAsync(
            int ttProfileId,
            int? trackId = null,
            short? cc = null)
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

            return await query
                .OrderBy(g => g.FinishTimeMs)
                .ToListAsync();
        }

        public async Task<List<GhostSubmissionEntity>> GetWorldRecordHistoryAsync(int trackId, short cc, bool glitch)
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
                      AND ({glitch} OR ""Glitch"" = false)
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
                    ""Shroomless"", ""Glitch"", ""DriftCategory""
                FROM WorldRecords
                WHERE PreviousBest IS NULL OR ""FinishTimeMs"" < PreviousBest
                ORDER BY ""DateSet"" ASC, ""SubmittedAt"" ASC
            ")
                    .Include(g => g.Track)
                    .Include(g => g.TTProfile)
                    .ToListAsync();

                return [.. wrHistory
                    .OrderBy(g => g.DateSet)
                    .ThenBy(g => g.SubmittedAt)];
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting world record history for track {TrackId} CC {CC} Glitch {Glitch}", trackId, cc, glitch);
                throw;
            }
        }

        // ===== STATISTICS =====

        public async Task<int> GetTotalSubmissionsCountAsync()
        {
            return await _context.GhostSubmissions.CountAsync();
        }

        public async Task<int> GetProfileSubmissionsCountAsync(int ttProfileId)
        {
            return await _context.GhostSubmissions
                .CountAsync(g => g.TTProfileId == ttProfileId);
        }

        public async Task<int> GetProfileWorldRecordsCountAsync(int ttProfileId)
        {
            try
            {
                var result = await _context.Database
                    .SqlQuery<int>($@"
                        SELECT CAST(COUNT(*) AS INTEGER) as ""Value""
                        FROM (
                            SELECT DISTINCT ON (""TrackId"", ""CC"", ""Glitch"")
                                ""TrackId"", ""CC"", ""Glitch"", ""TTProfileId""
                            FROM ""GhostSubmissions""
                            ORDER BY ""TrackId"", ""CC"", ""Glitch"", ""FinishTimeMs"", ""SubmittedAt""
                        ) wr
                        WHERE wr.""TTProfileId"" = {ttProfileId}
                    ")
                    .FirstOrDefaultAsync();

                return result;
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
                var result = await _context.Database
                    .SqlQuery<double>($@"
                        WITH RankedSubmissions AS (
                            SELECT 
                                ""TTProfileId"",
                                RANK() OVER (
                                    PARTITION BY ""TrackId"", ""CC"", ""Glitch""
                                    ORDER BY ""FinishTimeMs"", ""SubmittedAt""
                                ) as Position
                            FROM ""GhostSubmissions""
                        )
                        SELECT COALESCE(AVG(CAST(Position AS FLOAT)), 0.0) as ""Value""
                        FROM RankedSubmissions
                        WHERE ""TTProfileId"" = {ttProfileId}
                    ")
                    .FirstOrDefaultAsync();

                return result;
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
                var result = await _context.Database
                    .SqlQuery<int>($@"
                        WITH RankedSubmissions AS (
                            SELECT 
                                ""TTProfileId"",
                                RANK() OVER (
                                    PARTITION BY ""TrackId"", ""CC"", ""Glitch""
                                    ORDER BY ""FinishTimeMs"", ""SubmittedAt""
                                ) as Position
                            FROM ""GhostSubmissions""
                        )
                        SELECT CAST(COUNT(*) AS INTEGER) as ""Value""
                        FROM RankedSubmissions
                        WHERE ""TTProfileId"" = {ttProfileId}
                          AND Position <= 10
                    ")
                    .FirstOrDefaultAsync();

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error counting top 10 finishes for profile {ProfileId}", ttProfileId);
                throw;
            }
        }

        public async Task<int?> GetFastestLapForTrackAsync(int trackId, short cc, bool glitch)
        {
            try
            {
                var glitchFilter = glitch ? "" : "AND \"Glitch\" = false";

                var result = await _context.Database
                    .SqlQuery<int?>($@"
                        WITH LapTimes AS (
                            SELECT jsonb_array_elements_text(""LapSplitsMs""::jsonb)::int AS LapTime
                            FROM ""GhostSubmissions""
                            WHERE ""TrackId"" = {trackId}
                              AND ""CC"" = {cc}
                              AND ({glitch} OR ""Glitch"" = false)
                        )
                        SELECT MIN(LapTime) AS ""Value""
                        FROM LapTimes
                    ")
                    .FirstOrDefaultAsync();


                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting fastest lap for track {TrackId} CC {CC}", trackId, cc);
                throw;
            }
        }

        /// <summary>
        /// Gets the Best Known Time for a track with flexible filtering
        /// </summary>
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
                .Where(g => g.TrackId == trackId && g.CC == cc);

            if (nonGlitchOnly)
            {
                query = query.Where(g => g.Glitch == false);
            }

            if (shroomless.HasValue)
            {
                query = query.Where(g => g.Shroomless == shroomless.Value);
            }

            if (minVehicleId.HasValue && maxVehicleId.HasValue)
            {
                query = query.Where(g => g.VehicleId >= minVehicleId.Value && g.VehicleId <= maxVehicleId.Value);
            }

            if (driftType.HasValue)
            {
                query = query.Where(g => g.DriftType == driftType.Value);
            }

            if (driftCategory.HasValue)
            {
                query = query.Where(g => g.DriftCategory == driftCategory.Value);
            }

            return await query
                .OrderBy(g => g.FinishTimeMs)
                .ThenBy(g => g.SubmittedAt)
                .FirstOrDefaultAsync();
        }
    }
}