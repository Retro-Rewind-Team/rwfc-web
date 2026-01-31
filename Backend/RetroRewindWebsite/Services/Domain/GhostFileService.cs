using System.Text;

namespace RetroRewindWebsite.Services.Domain
{
    public class GhostFileService : IGhostFileService
    {
        private readonly string _ghostStoragePath;
        private readonly ILogger<GhostFileService> _logger;

        // ===== CONSTANTS =====
        private const string DEFAULT_GHOST_PATH = "ghosts";
        private const int MIN_RKG_FILE_SIZE = 0x88; // 136 bytes minimum
        private const string RKG_MAGIC = "RKGD";
        private const int MAX_LAP_SPLITS_STORED = 5; // RKG format only stores first 5 laps

        // RKG file offsets
        private const int OFFSET_MAGIC = 0x00;
        private const int OFFSET_TIME_AND_TRACK = 0x04;
        private const int OFFSET_STATS_INFO = 0x08;
        private const int OFFSET_INFO2 = 0x0C;
        private const int OFFSET_LAP_COUNT = 0x10;
        private const int OFFSET_LAP_SPLITS = 0x11;
        private const int OFFSET_MII_NAME = 0x3E;

        public GhostFileService(
            IConfiguration configuration,
            ILogger<GhostFileService> logger)
        {
            _ghostStoragePath = configuration["GhostStoragePath"] ?? DEFAULT_GHOST_PATH;
            _logger = logger;

            // Ensure the base directory exists
            if (!Directory.Exists(_ghostStoragePath))
            {
                Directory.CreateDirectory(_ghostStoragePath);
            }
        }

        public async Task<GhostFileParseResult> ParseGhostFileAsync(Stream fileStream)
        {
            try
            {
                // Read stream into byte array
                using var memoryStream = new MemoryStream();
                await fileStream.CopyToAsync(memoryStream);
                byte[] bytes = memoryStream.ToArray();

                return ParseGhostFileBytes(bytes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse ghost file");
                return new GhostFileParseResult
                {
                    Success = false,
                    ErrorMessage = $"Failed to parse ghost file: {ex.Message}"
                };
            }
        }

        public async Task<string> SaveGhostFileAsync(
            Stream fileStream,
            int trackId,
            short cc,
            string playerDisplayName)
        {
            try
            {
                // Create directory structure: ghosts/track-{trackId}/{cc}cc/
                string trackDir = Path.Combine(_ghostStoragePath, $"track-{trackId}");
                string ccDir = Path.Combine(trackDir, $"{cc}cc");

                Directory.CreateDirectory(ccDir);

                // Generate filename: {timestamp}_{playerDisplayName}.rkg
                string timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
                string safeDisplayName = SanitizeFileName(playerDisplayName);
                string filename = $"{timestamp}_{safeDisplayName}.rkg";
                string filePath = Path.Combine(ccDir, filename);

                // Save the file
                using (var fileStreamOut = new FileStream(filePath, FileMode.Create, FileAccess.Write))
                {
                    fileStream.Position = 0; // Reset stream position
                    await fileStream.CopyToAsync(fileStreamOut);
                }

                _logger.LogInformation(
                    "Ghost file saved: {FilePath} for player {PlayerName}",
                    filePath, playerDisplayName);

                return filePath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save ghost file for player {PlayerName}", playerDisplayName);
                throw new Exception($"Failed to save ghost file: {ex.Message}", ex);
            }
        }

        // ===== PRIVATE PARSING METHODS =====

        private GhostFileParseResult ParseGhostFileBytes(byte[] bytes)
        {
            try
            {
                // Validate file size
                if (bytes == null || bytes.Length < MIN_RKG_FILE_SIZE)
                {
                    return new GhostFileParseResult
                    {
                        Success = false,
                        ErrorMessage = $"Invalid RKG file - expected at least {MIN_RKG_FILE_SIZE} bytes, got {bytes?.Length ?? 0}"
                    };
                }

                // Validate magic bytes
                var magicValidation = ValidateMagicBytes(bytes);
                if (magicValidation != null)
                {
                    return magicValidation;
                }

                // Parse header data
                var (finishTimeMs, finishTimeDisplay, trackSlotId) = ParseFinishTimeAndTrack(bytes);
                var (vehicleId, characterId, dateSet, controllerId) = ParseStatsInfo(bytes);
                var (driftType, transmissionBits) = ParseDriftInfo(bytes);

                // Determine actual drift based on vehicle and transmission bits
                var driftCategory = DetermineActualDrift(vehicleId, transmissionBits);

                // Parse lap data
                var lapCount = bytes[OFFSET_LAP_COUNT];
                var lapSplitsMs = ParseLapSplits(bytes, lapCount, finishTimeMs);

                // Parse Mii name
                var miiName = ParseMiiName(bytes);

                return new GhostFileParseResult
                {
                    Success = true,
                    CourseId = trackSlotId,
                    FinishTimeMs = finishTimeMs,
                    FinishTimeDisplay = finishTimeDisplay,
                    VehicleId = vehicleId,
                    CharacterId = characterId,
                    ControllerType = controllerId,
                    DriftType = driftType,
                    DriftCategory = driftCategory,
                    MiiName = miiName,
                    LapCount = (short)lapCount,
                    LapSplitsMs = lapSplitsMs,
                    DateSet = dateSet
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing ghost file bytes");
                return new GhostFileParseResult
                {
                    Success = false,
                    ErrorMessage = $"Error parsing ghost file: {ex.Message}"
                };
            }
        }

        private static GhostFileParseResult? ValidateMagicBytes(byte[] bytes)
        {
            var magic = Encoding.ASCII.GetString(bytes, OFFSET_MAGIC, 4);
            if (magic != RKG_MAGIC)
            {
                return new GhostFileParseResult
                {
                    Success = false,
                    ErrorMessage = $"Invalid RKG file - expected '{RKG_MAGIC}' magic bytes but got '{magic}'"
                };
            }
            return null;
        }

        private static (int finishTimeMs, string finishTimeDisplay, short trackSlotId) ParseFinishTimeAndTrack(byte[] bytes)
        {
            var timeValue = ReadBigEndianUInt32(bytes, OFFSET_TIME_AND_TRACK);

            // Extract finish time components
            var minutes = (byte)((timeValue >> 25) & 0x7F);        // Bits 25-31
            var seconds = (byte)((timeValue >> 18) & 0x7F);        // Bits 18-24
            var milliseconds = (ushort)((timeValue >> 8) & 0x3FF); // Bits 8-17
            var trackSlotId = (short)((timeValue >> 2) & 0x3F);    // Bits 2-7

            int finishTimeMs = (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;
            string finishTimeDisplay = $"{minutes}:{seconds:D2}.{milliseconds:D3}";

            return (finishTimeMs, finishTimeDisplay, trackSlotId);
        }

        private (short vehicleId, short characterId, DateOnly dateSet, short controllerId) ParseStatsInfo(byte[] bytes)
        {
            var statsInfo = ReadBigEndianUInt32(bytes, OFFSET_STATS_INFO);

            // Extract stats components
            var vehicleId = (short)((statsInfo >> 26) & 0x3F);     // Bits 26-31
            var characterId = (short)((statsInfo >> 20) & 0x3F);   // Bits 20-25
            var year = (ushort)(((statsInfo >> 13) & 0x7F) + 2000); // Bits 13-19
            var month = (byte)((statsInfo >> 9) & 0x0F);           // Bits 9-12
            var day = (byte)((statsInfo >> 4) & 0x1F);             // Bits 4-8
            var controllerId = (short)(statsInfo & 0x0F);          // Bits 0-3

            var dateSet = ParseDate(year, month, day);

            return (vehicleId, characterId, dateSet, controllerId);
        }

        private DateOnly ParseDate(int year, int month, int day)
        {
            try
            {
                if (year < 2000 || year > 2127 || month < 1 || month > 12 || day < 1 || day > 31)
                {
                    _logger.LogWarning(
                        "Invalid date in ghost file: {Year}-{Month}-{Day}, using current date",
                        year, month, day);
                    return DateOnly.FromDateTime(DateTime.Now);
                }

                return new DateOnly(year, month, day);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Failed to parse date {Year}-{Month}-{Day}, using current date",
                    year, month, day);
                return DateOnly.FromDateTime(DateTime.Now);
            }
        }

        private static (short driftType, short transmissionBits) ParseDriftInfo(byte[] bytes)
        {
            var info2 = ReadBigEndianUInt16(bytes, OFFSET_INFO2);

            // Bit 1: Drift type (0=Manual, 1=Auto)
            var driftType = (short)((info2 >> 1) & 0x01);

            // Bits 9-10: Transmission bits (0-3) - for Retro Rewind/Pulsar
            var transmissionBits = (short)((info2 >> 9) & 0x03);

            return (driftType, transmissionBits);
        }

        private static short DetermineActualDrift(short vehicleId, short transmissionBits)
        {
            // Karts: 0x00-0x11 (all outside drift by default)
            // Inside drift bikes: 0x12-0x1D, 0x1F (Standard Bike S/M/L, Bullet Bike, Mach Bike, Flame Runner, etc.)
            // Outside drift bikes: 0x1E, 0x20, 0x21, 0x22, 0x23 (Magikruiser, Spear, Jet Bubble, Dolphin Dasher, Phantom)

            bool isBike = vehicleId >= 0x12 && vehicleId <= 0x23;

            // Check if it's an outside drift bike
            bool isOutsideDriftBike = vehicleId == 0x1E || vehicleId == 0x20 ||
                                      vehicleId == 0x21 || vehicleId == 0x22 || vehicleId == 0x23;

            // Determine default drift (all karts = outside, inside drift bikes = inside, outside drift bikes = outside)
            bool defaultIsInside = isBike && !isOutsideDriftBike;

            // Apply transmission override
            bool actualIsInside = transmissionBits switch
            {
                0 => defaultIsInside,              // Use vehicle's default
                1 => true,                         // Force all inside
                2 => isBike,                       // Bikes inside, karts outside
                3 => false,                        // Force all outside
                _ => defaultIsInside               // Fallback to default
            };

            return actualIsInside ? (short)1 : (short)0;  // Return 0=Outside, 1=Inside
        }

        private List<int> ParseLapSplits(byte[] bytes, int lapCount, int finishTimeMs)
        {
            var lapSplitsMs = new List<int>();
            int storedLaps = Math.Min(lapCount, MAX_LAP_SPLITS_STORED);

            // Parse lap splits from file (max 5 laps stored in RKG format)
            for (int i = 0; i < storedLaps; i++)
            {
                int offset = OFFSET_LAP_SPLITS + (i * 3);

                uint lapValue = ((uint)bytes[offset] << 16) |
                               ((uint)bytes[offset + 1] << 8) |
                               bytes[offset + 2];

                var lapMinutes = (byte)((lapValue >> 17) & 0x7F);      // Bits 17-23
                var lapSeconds = (byte)((lapValue >> 10) & 0x7F);      // Bits 10-16
                var lapMilliseconds = (ushort)(lapValue & 0x3FF);      // Bits 0-9

                int lapTotalMs = (lapMinutes * 60 * 1000) + (lapSeconds * 1000) + lapMilliseconds;
                lapSplitsMs.Add(lapTotalMs);
            }

            // Handle tracks with more than 5 laps (e.g., Baby Park)
            if (lapCount > MAX_LAP_SPLITS_STORED)
            {
                EstimateRemainingLaps(lapSplitsMs, lapCount, finishTimeMs);
            }

            return lapSplitsMs;
        }

        private void EstimateRemainingLaps(List<int> lapSplitsMs, int totalLapCount, int finishTimeMs)
        {
            // For tracks like Baby Park (7 laps), the RKG format only stores the first 5 lap splits
            // We need to estimate the remaining lap times based on the total finish time

            int sumOfStoredLaps = lapSplitsMs.Sum();
            int remainingTime = finishTimeMs - sumOfStoredLaps;
            int remainingLaps = totalLapCount - MAX_LAP_SPLITS_STORED;

            if (remainingTime <= 0 || remainingLaps <= 0)
            {
                _logger.LogWarning(
                    "Invalid lap data: {StoredLaps} stored laps totaling {StoredTime}ms, " +
                    "but finish time is {FinishTime}ms with {TotalLaps} total laps",
                    lapSplitsMs.Count, sumOfStoredLaps, finishTimeMs, totalLapCount);
                return;
            }

            // Distribute remaining time evenly across remaining laps
            int avgTime = remainingTime / remainingLaps;
            int remainder = remainingTime % remainingLaps;

            for (int i = 0; i < remainingLaps; i++)
            {
                // Add 1ms to first few laps to account for rounding
                lapSplitsMs.Add(avgTime + (i < remainder ? 1 : 0));
            }

            _logger.LogDebug(
                "Estimated {RemainingLaps} additional laps for track with {TotalLaps} total laps",
                remainingLaps, totalLapCount);
        }

        private static string ParseMiiName(byte[] bytes)
        {
            // Mii name is stored at offset 0x3E (20 bytes max, UTF-16 Big Endian)
            // The name is null-terminated, so we need to find the first null character
            var miiNameBytes = new byte[20];
            if (bytes.Length >= OFFSET_MII_NAME + 20)
            {
                Array.Copy(bytes, OFFSET_MII_NAME, miiNameBytes, 0, 20);
            }

            // Find the first null terminator (UTF-16 uses 2 bytes, so look for 0x00 0x00)
            int nullIndex = -1;
            for (int i = 0; i < miiNameBytes.Length - 1; i += 2)
            {
                if (miiNameBytes[i] == 0x00 && miiNameBytes[i + 1] == 0x00)
                {
                    nullIndex = i;
                    break;
                }
            }

            // If we found a null terminator, only decode up to that point
            int bytesToDecode = nullIndex >= 0 ? nullIndex : miiNameBytes.Length;

            if (bytesToDecode == 0)
            {
                return string.Empty;
            }

            return Encoding.BigEndianUnicode.GetString(miiNameBytes, 0, bytesToDecode).Trim();
        }

        // ===== HELPER METHODS =====

        private static uint ReadBigEndianUInt32(byte[] bytes, int offset)
        {
            if (offset + 4 > bytes.Length)
                throw new ArgumentException($"Cannot read UInt32 at offset 0x{offset:X}");

            return ((uint)bytes[offset] << 24) |
                   ((uint)bytes[offset + 1] << 16) |
                   ((uint)bytes[offset + 2] << 8) |
                   bytes[offset + 3];
        }

        private static ushort ReadBigEndianUInt16(byte[] bytes, int offset)
        {
            if (offset + 2 > bytes.Length)
                throw new ArgumentException($"Cannot read UInt16 at offset 0x{offset:X}");

            return (ushort)((bytes[offset] << 8) | bytes[offset + 1]);
        }

        private static string SanitizeFileName(string fileName)
        {
            // Remove invalid filename characters
            var invalidChars = Path.GetInvalidFileNameChars();
            var sanitized = new string([.. fileName.Where(c => !invalidChars.Contains(c))]);

            // Limit length and remove spaces
            return sanitized
                .Replace(" ", "_")
                [..Math.Min(sanitized.Length, 50)];
        }
    }
}