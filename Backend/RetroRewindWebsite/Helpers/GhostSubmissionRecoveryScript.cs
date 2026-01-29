using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities;
using RetroRewindWebsite.Services.Domain;
using System.Text.RegularExpressions;

namespace RetroRewindWebsite.Helpers
{
    /// <summary>
    /// Recovery script to rebuild GhostSubmissions table from .rkg files on disk
    /// 
    /// </summary>
    public class GhostSubmissionRecoveryScript
    {
        private readonly LeaderboardDbContext _context;
        private readonly IGhostFileService _ghostFileService;
        private readonly ILogger<GhostSubmissionRecoveryScript> _logger;
        private readonly string _ghostStoragePath;

        public GhostSubmissionRecoveryScript(
            LeaderboardDbContext context,
            IGhostFileService ghostFileService,
            IConfiguration configuration,
            ILogger<GhostSubmissionRecoveryScript> logger)
        {
            _context = context;
            _ghostFileService = ghostFileService;
            _logger = logger;
            _ghostStoragePath = configuration["GhostStoragePath"] ?? "ghosts";
        }

        public async Task<RecoveryResult> RecoverAllGhostSubmissions()
        {
            var result = new RecoveryResult();

            _logger.LogInformation("Starting ghost submission recovery from {Path}", _ghostStoragePath);

            if (!Directory.Exists(_ghostStoragePath))
            {
                _logger.LogError("Ghost storage path does not exist: {Path}", _ghostStoragePath);
                result.ErrorMessage = $"Ghost storage path not found: {_ghostStoragePath}";
                return result;
            }

            // Get all .rkg files recursively
            var rkgFiles = Directory.GetFiles(_ghostStoragePath, "*.rkg", SearchOption.AllDirectories);
            _logger.LogInformation("Found {Count} .rkg files to process", rkgFiles.Length);
            result.TotalFiles = rkgFiles.Length;

            // Load all tracks and profiles into memory for fast lookup
            var tracks = await _context.Tracks.ToDictionaryAsync(t => t.Id);
            var profiles = await _context.TTProfiles.ToListAsync();
            var profilesByName = profiles
                .ToDictionary(p => NormalizeName(p.DisplayName), p => p, StringComparer.OrdinalIgnoreCase);

            _logger.LogInformation("Loaded {TrackCount} tracks and {ProfileCount} profiles",
                tracks.Count, profiles.Count);

            // Process each file
            foreach (var filePath in rkgFiles)
            {
                try
                {
                    var recovery = await ProcessSingleFile(filePath, tracks, profilesByName);

                    if (recovery.Success)
                    {
                        result.SuccessCount++;
                    }
                    else
                    {
                        result.FailedCount++;
                        result.FailedFiles.Add(new FailedFile
                        {
                            FilePath = filePath,
                            Reason = recovery.ErrorMessage ?? "Unknown error"
                        });
                    }

                    // Log progress every 50 files
                    if ((result.SuccessCount + result.FailedCount) % 50 == 0)
                    {
                        _logger.LogInformation("Progress: {Success} succeeded, {Failed} failed out of {Total}",
                            result.SuccessCount, result.FailedCount, rkgFiles.Length);
                    }
                }
                catch (Exception ex)
                {
                    result.FailedCount++;
                    result.FailedFiles.Add(new FailedFile
                    {
                        FilePath = filePath,
                        Reason = ex.Message
                    });
                    _logger.LogError(ex, "Unexpected error processing file: {FilePath}", filePath);
                }
            }

            // Update profile submission counts
            _logger.LogInformation("Updating profile submission counts...");
            foreach (var profile in profiles)
            {
                profile.TotalSubmissions = await _context.GhostSubmissions
                    .CountAsync(g => g.TTProfileId == profile.Id);
                profile.UpdatedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();

            // Update world record counts
            _logger.LogInformation("Updating world record counts...");
            await _context.Database.ExecuteSqlAsync($@"
                UPDATE ""TTProfiles"" p
                SET ""CurrentWorldRecords"" = (
                    SELECT CAST(COUNT(*) AS INTEGER)
                    FROM (
                        SELECT DISTINCT ON (""TrackId"", ""CC"", ""Glitch"")
                            ""TrackId"", ""CC"", ""Glitch"", ""TTProfileId""
                        FROM ""GhostSubmissions""
                        ORDER BY ""TrackId"", ""CC"", ""Glitch"", ""FinishTimeMs"", ""SubmittedAt""
                    ) wr
                    WHERE wr.""TTProfileId"" = p.""Id""
                ),
                ""UpdatedAt"" = {DateTime.UtcNow}
            ");

            result.Success = true;
            _logger.LogInformation(
                "Recovery complete! Success: {Success}, Failed: {Failed}, Total: {Total}",
                result.SuccessCount, result.FailedCount, result.TotalFiles);

            return result;
        }

        private async Task<SingleFileRecovery> ProcessSingleFile(
            string filePath,
            Dictionary<int, TrackEntity> tracks,
            Dictionary<string, TTProfileEntity> profilesByName)
        {
            // Parse directory structure: ghosts/track-{trackId}/{cc}cc/{filename}.rkg
            var pathParts = filePath.Split(Path.DirectorySeparatorChar);

            // Find track-X directory
            var trackDir = pathParts.FirstOrDefault(p => p.StartsWith("track-"));
            if (trackDir == null || !int.TryParse(trackDir.Replace("track-", ""), out int trackId))
            {
                return new SingleFileRecovery
                {
                    Success = false,
                    ErrorMessage = $"Could not parse track ID from path: {filePath}"
                };
            }

            // Find XccXX directory
            var ccDir = pathParts.FirstOrDefault(p => p.EndsWith("cc"));
            if (ccDir == null || !short.TryParse(ccDir.Replace("cc", ""), out short cc))
            {
                return new SingleFileRecovery
                {
                    Success = false,
                    ErrorMessage = $"Could not parse CC from path: {filePath}"
                };
            }

            // Validate track exists
            if (!tracks.TryGetValue(trackId, out var track))
            {
                return new SingleFileRecovery
                {
                    Success = false,
                    ErrorMessage = $"Track ID {trackId} not found in database"
                };
            }

            // Parse filename: {timestamp}_{playerName}.rkg
            var filename = Path.GetFileNameWithoutExtension(filePath);
            var filenameParts = filename.Split('_', 2);

            string playerName = "Unknown";
            if (filenameParts.Length >= 2)
            {
                playerName = filenameParts[1];
            }

            // Try to find matching profile
            var normalizedName = NormalizeName(playerName);
            if (!profilesByName.TryGetValue(normalizedName, out var profile))
            {
                // Try fuzzy matching
                profile = FindBestMatchingProfile(playerName, profilesByName.Values);

                if (profile == null)
                {
                    return new SingleFileRecovery
                    {
                        Success = false,
                        ErrorMessage = $"No matching TTProfile found for player name: {playerName}"
                    };
                }
                else
                {
                    _logger.LogInformation(
                        "Fuzzy matched '{PlayerName}' to profile '{ProfileName}' (ID: {ProfileId})",
                        playerName, profile.DisplayName, profile.Id);
                }
            }

            // Parse the ghost file
            GhostFileParseResult ghostData;
            using (var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read))
            {
                ghostData = await _ghostFileService.ParseGhostFileAsync(fileStream);
            }

            if (!ghostData.Success)
            {
                return new SingleFileRecovery
                {
                    Success = false,
                    ErrorMessage = $"Failed to parse ghost file: {ghostData.ErrorMessage}"
                };
            }

            // Determine if this is a glitch run (we don't have this info, so default to false)
            // You may want to manually review tracks that support glitches
            bool glitch = false;

            // Determine shroomless (default to false as we don't have this info)
            bool shroomless = false;

            // Create submission entity
            var submission = new GhostSubmissionEntity
            {
                TrackId = trackId,
                TTProfileId = profile.Id,
                CC = cc,
                FinishTimeMs = ghostData.FinishTimeMs,
                FinishTimeDisplay = ghostData.FinishTimeDisplay,
                VehicleId = ghostData.VehicleId,
                CharacterId = ghostData.CharacterId,
                ControllerType = ghostData.ControllerType,
                DriftType = ghostData.DriftType,
                DriftCategory = ghostData.DriftCategory, // Now automatically extracted from ghost file
                MiiName = ghostData.MiiName,
                LapCount = ghostData.LapCount,
                LapSplitsMs = System.Text.Json.JsonSerializer.Serialize(ghostData.LapSplitsMs),
                GhostFilePath = filePath,
                DateSet = ghostData.DateSet,
                SubmittedAt = File.GetCreationTimeUtc(filePath), // Use file creation time
                Shroomless = shroomless,
                Glitch = glitch
            };

            // Check if this exact submission already exists (in case script is run multiple times)
            var exists = await _context.GhostSubmissions.AnyAsync(g =>
                g.TrackId == submission.TrackId &&
                g.TTProfileId == submission.TTProfileId &&
                g.CC == submission.CC &&
                g.FinishTimeMs == submission.FinishTimeMs &&
                g.GhostFilePath == submission.GhostFilePath);

            if (exists)
            {
                return new SingleFileRecovery
                {
                    Success = false,
                    ErrorMessage = "Submission already exists in database (duplicate)"
                };
            }

            // Add to database
            await _context.GhostSubmissions.AddAsync(submission);
            await _context.SaveChangesAsync();

            return new SingleFileRecovery
            {
                Success = true,
                SubmissionId = submission.Id
            };
        }

        private static string NormalizeName(string name)
        {
            // Remove spaces, underscores, and convert to lowercase for comparison
            return Regex.Replace(name.ToLowerInvariant(), @"[\s_-]", "");
        }

        private TTProfileEntity? FindBestMatchingProfile(string playerName, IEnumerable<TTProfileEntity> profiles)
        {
            var normalizedSearch = NormalizeName(playerName);

            // Try exact match first
            var exact = profiles.FirstOrDefault(p =>
                NormalizeName(p.DisplayName) == normalizedSearch);
            if (exact != null) return exact;

            // Try contains match
            var contains = profiles.FirstOrDefault(p =>
                NormalizeName(p.DisplayName).Contains(normalizedSearch) ||
                normalizedSearch.Contains(NormalizeName(p.DisplayName)));

            return contains;
        }
    }

    // Result classes
    public class RecoveryResult
    {
        public bool Success { get; set; }
        public int TotalFiles { get; set; }
        public int SuccessCount { get; set; }
        public int FailedCount { get; set; }
        public string? ErrorMessage { get; set; }
        public List<FailedFile> FailedFiles { get; set; } = new();
    }

    public class FailedFile
    {
        public string FilePath { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
    }

    public class SingleFileRecovery
    {
        public bool Success { get; set; }
        public int SubmissionId { get; set; }
        public string? ErrorMessage { get; set; }
    }
}