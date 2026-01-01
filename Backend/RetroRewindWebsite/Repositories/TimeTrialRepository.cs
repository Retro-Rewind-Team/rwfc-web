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

        // Track operations
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

        // TT Profile operations
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

        // Ghost Submission operations
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

        public async Task DeleteGhostSubmissionAsync(int id)
        {
            var submission = await _context.GhostSubmissions.FindAsync(id);
            if (submission != null)
            {
                _context.GhostSubmissions.Remove(submission);
                await _context.SaveChangesAsync();
            }
        }

        // Leaderboard queries
        public async Task<PagedResult<GhostSubmissionEntity>> GetTrackLeaderboardAsync(
            int trackId,
            short cc,
            int page,
            int pageSize)
        {
            var query = _context.GhostSubmissions
                .AsNoTracking()
                .Include(g => g.Track)
                .Include(g => g.TTProfile)
                .Where(g => g.TrackId == trackId && g.CC == cc)
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
            int count)
        {
            return await _context.GhostSubmissions
                .AsNoTracking()
                .Include(g => g.Track)
                .Include(g => g.TTProfile)
                .Where(g => g.TrackId == trackId && g.CC == cc)
                .OrderBy(g => g.FinishTimeMs)
                .ThenBy(g => g.SubmittedAt)
                .Take(count)
                .ToListAsync();
        }

        public async Task<GhostSubmissionEntity?> GetWorldRecordAsync(int trackId, short cc)
        {
            return await _context.GhostSubmissions
                .AsNoTracking()
                .Include(g => g.Track)
                .Include(g => g.TTProfile)
                .Where(g => g.TrackId == trackId && g.CC == cc)
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

        // Stats
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
            // Get all tracks and CCs
            var trackCCCombinations = await _context.GhostSubmissions
                .Select(g => new { g.TrackId, g.CC })
                .Distinct()
                .ToListAsync();

            int wrCount = 0;

            // For each track/CC combination, check if this profile holds the WR
            foreach (var combo in trackCCCombinations)
            {
                var wr = await GetWorldRecordAsync(combo.TrackId, combo.CC);
                if (wr?.TTProfileId == ttProfileId)
                {
                    wrCount++;
                }
            }

            return wrCount;
        }

        public async Task<List<GhostSubmissionEntity>> GetWorldRecordHistoryAsync(int trackId, short cc)
        {
            // Get all submissions for this track/CC ordered by submission time
            var allSubmissions = await _context.GhostSubmissions
                .AsNoTracking()
                .Include(g => g.Track)
                .Include(g => g.TTProfile)
                .Where(g => g.TrackId == trackId && g.CC == cc)
                .OrderBy(g => g.DateSet)
                .ToListAsync();

            var wrHistory = new List<GhostSubmissionEntity>();
            int? currentBestTime = null;

            // Iterate through submissions chronologically
            foreach (var submission in allSubmissions)
            {
                // If this is a new WR (no previous record or faster than current best)
                if (currentBestTime == null || submission.FinishTimeMs < currentBestTime)
                {
                    wrHistory.Add(submission);
                    currentBestTime = submission.FinishTimeMs;
                }
            }

            return wrHistory;
        }

        public async Task<double> CalculateAverageFinishPositionAsync(int ttProfileId)
        {
            var submissions = await GetPlayerSubmissionsAsync(ttProfileId);
            if (submissions.Count == 0) return 0;

            var positions = new List<int>();

            foreach (var submission in submissions)
            {
                var betterTimes = await _context.GhostSubmissions
                    .Where(g => g.TrackId == submission.TrackId &&
                               g.CC == submission.CC &&
                               g.FinishTimeMs < submission.FinishTimeMs)
                    .CountAsync();

                positions.Add(betterTimes + 1);
            }

            return positions.Average();
        }

        public async Task<int> CountTop10FinishesAsync(int ttProfileId)
        {
            var submissions = await GetPlayerSubmissionsAsync(ttProfileId);
            int count = 0;

            foreach (var submission in submissions)
            {
                var betterTimes = await _context.GhostSubmissions
                    .Where(g => g.TrackId == submission.TrackId &&
                               g.CC == submission.CC &&
                               g.FinishTimeMs < submission.FinishTimeMs)
                    .CountAsync();

                if (betterTimes < 10) count++;
            }

            return count;
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

        public async Task<int?> GetFastestLapForTrackAsync(int trackId, short cc)
        {
            var submissions = await _context.GhostSubmissions
                .AsNoTracking()
                .Where(g => g.TrackId == trackId && g.CC == cc)
                .ToListAsync();

            if (submissions.Count == 0)
                return null;

            var allLapTimes = new List<int>();

            foreach (var submission in submissions)
            {
                var lapSplits = System.Text.Json.JsonSerializer.Deserialize<List<int>>(submission.LapSplitsMs);
                if (lapSplits != null && lapSplits.Count > 0)
                {
                    allLapTimes.AddRange(lapSplits);
                }
            }

            return allLapTimes.Count > 0 ? allLapTimes.Min() : null;
        }
    }
}