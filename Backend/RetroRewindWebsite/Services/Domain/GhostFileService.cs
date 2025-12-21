using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;

namespace RetroRewindWebsite.Services.Domain
{
    public class GhostFileService : IGhostFileService
    {
        private readonly string _ghostStoragePath;

        public GhostFileService(IConfiguration configuration)
        {
            _ghostStoragePath = configuration["GhostStoragePath"] ?? "ghosts";

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
                return new GhostFileParseResult
                {
                    Success = false,
                    ErrorMessage = $"Failed to parse ghost file: {ex.Message}"
                };
            }
        }

        private static GhostFileParseResult ParseGhostFileBytes(byte[] bytes)
        {
            try
            {
                if (bytes == null || bytes.Length < 0x88)
                {
                    return new GhostFileParseResult
                    {
                        Success = false,
                        ErrorMessage = "Invalid RKG file - file is too small"
                    };
                }

                // Helper methods to read big-endian values
                uint ReadBigEndianUInt32(int offset)
                {
                    if (offset + 4 > bytes.Length)
                        throw new ArgumentException($"Cannot read UInt32 at offset {offset:X}");

                    return ((uint)bytes[offset] << 24) |
                           ((uint)bytes[offset + 1] << 16) |
                           ((uint)bytes[offset + 2] << 8) |
                           bytes[offset + 3];
                }

                ushort ReadBigEndianUInt16(int offset)
                {
                    if (offset + 2 > bytes.Length)
                        throw new ArgumentException($"Cannot read UInt16 at offset {offset:X}");

                    return (ushort)((bytes[offset] << 8) | bytes[offset + 1]);
                }

                // Verify magic bytes "RKGD"
                var magic = Encoding.ASCII.GetString(bytes, 0, 4);
                if (magic != "RKGD")
                {
                    return new GhostFileParseResult
                    {
                        Success = false,
                        ErrorMessage = $"Invalid RKG file - expected 'RKGD' magic bytes but got '{magic}'"
                    };
                }

                // Parse finish time and track SLOT ID (offset 0x04 - 4 bytes as UInt32)
                var timeValue = ReadBigEndianUInt32(0x04);
                var minutes = (byte)((timeValue >> 25) & 0x7F);        // Bits 25-31: Minutes
                var seconds = (byte)((timeValue >> 18) & 0x7F);        // Bits 18-24: Seconds
                var milliseconds = (ushort)((timeValue >> 8) & 0x3FF); // Bits 8-17: Milliseconds
                var trackSlotId = (short)((timeValue >> 2) & 0x3F);    // Bits 2-7: Track SLOT ID (0-31, not custom track ID!)

                // Calculate total milliseconds
                int finishTimeMs = (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;

                // Parse stats info (offset 0x08 - 4 bytes as UInt32)
                var statsInfo = ReadBigEndianUInt32(0x08);
                var vehicleId = (short)((statsInfo >> 26) & 0x3F);     // Bits 26-31: Vehicle ID
                var characterId = (short)((statsInfo >> 20) & 0x3F);   // Bits 20-25: Character ID
                var year = (ushort)(((statsInfo >> 13) & 0x7F) + 2000); // Bits 13-19: Year - 2000
                var month = (byte)((statsInfo >> 9) & 0x0F);           // Bits 9-12: Month
                var day = (byte)((statsInfo >> 4) & 0x1F);             // Bits 4-8: Day
                var controllerId = (short)(statsInfo & 0x0F);          // Bits 0-3: Controller

                // Validate date - if invalid, use current date
                DateOnly dateSet;
                try
                {
                    if (year < 2000 || year > 2127 || month < 1 || month > 12 || day < 1 || day > 31)
                    {
                        dateSet = DateOnly.FromDateTime(DateTime.Now);
                    }
                    else
                    {
                        dateSet = new DateOnly(year, month, day);
                    }
                }
                catch
                {
                    dateSet = DateOnly.FromDateTime(DateTime.Now);
                }

                // Parse info2 (offset 0x0C - 2 bytes as UInt16)
                var info2 = ReadBigEndianUInt16(0x0C);
                var driftType = (short)((info2 >> 1) & 0x01);          // Bit 1: Drift type (0=Manual, 1=Auto)

                // Parse lap data info
                var lapCount = (short)bytes[0x10];                      // Number of laps

                // Parse lap splits (offset 0x11 - 8 laps × 3 bytes each)
                var lapSplitsMs = new List<int>();

                for (int i = 0; i < Math.Min((int)lapCount, 5); i++)
                {
                    int offset = 0x11 + (i * 3);

                    uint lapValue = ((uint)bytes[offset] << 16) |
                                   ((uint)bytes[offset + 1] << 8) |
                                   bytes[offset + 2];

                    var lapMinutes = (byte)((lapValue >> 17) & 0x7F);      // Bits 17-23: Minutes
                    var lapSeconds = (byte)((lapValue >> 10) & 0x7F);      // Bits 10-16: Seconds
                    var lapMilliseconds = (ushort)(lapValue & 0x3FF);      // Bits 0-9: Milliseconds

                    int lapTotalMs = (lapMinutes * 60 * 1000) + (lapSeconds * 1000) + lapMilliseconds;
                    lapSplitsMs.Add(lapTotalMs);
                }

                // For tracks with more than 5 laps, estimate remaining laps (Baby Park)
                if (lapCount > 5)
                {
                    int sumOfFirst5Laps = lapSplitsMs.Sum();
                    int remainingTime = finishTimeMs - sumOfFirst5Laps;
                    int remainingLaps = lapCount - 5;

                    // Distribute remaining time across remaining laps
                    int avgTime = remainingTime / remainingLaps;
                    int remainder = remainingTime % remainingLaps;

                    for (int i = 0; i < remainingLaps; i++)
                    {
                        // Add 1ms to first few laps to account for rounding
                        lapSplitsMs.Add(avgTime + (i < remainder ? 1 : 0));
                    }
                }

                // Parse Mii name (offset 0x3C for Mii data, name starts at +0x02)
                var miiNameBytes = new byte[20];
                if (bytes.Length >= 0x3E + 20)
                {
                    Array.Copy(bytes, 0x3E, miiNameBytes, 0, 20); // 0x3C + 0x02 = 0x3E
                }

                var miiName = Encoding.BigEndianUnicode.GetString(miiNameBytes)
                    .Replace("\0", "")
                    .Trim();

                // Format finish time display
                string finishTimeDisplay = $"{minutes}:{seconds:D2}.{milliseconds:D3}";

                return new GhostFileParseResult
                {
                    Success = true,
                    CourseId = trackSlotId,  // This is the track SLOT ID (0-31) (Base game tracks only)
                    FinishTimeMs = finishTimeMs,
                    FinishTimeDisplay = finishTimeDisplay,
                    VehicleId = vehicleId,
                    CharacterId = characterId,
                    ControllerType = controllerId,
                    DriftType = driftType,
                    MiiName = miiName,
                    LapCount = lapCount,
                    LapSplitsMs = lapSplitsMs,
                    DateSet = dateSet
                };
            }
            catch (Exception ex)
            {
                return new GhostFileParseResult
                {
                    Success = false,
                    ErrorMessage = $"Error parsing ghost file: {ex.Message}"
                };
            }
        }

        public async Task<string> SaveGhostFileAsync(Stream fileStream, int trackId, short cc, string discordUserId)
        {
            try
            {
                // Create directory structure: ghosts/track-{trackId}/{cc}cc/
                string trackDir = Path.Combine(_ghostStoragePath, $"track-{trackId}");
                string ccDir = Path.Combine(trackDir, $"{cc}cc");

                Directory.CreateDirectory(ccDir);

                // Generate filename: {timestamp}_{discordUserId}.rkg
                string timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
                string filename = $"{timestamp}_{discordUserId}.rkg";
                string filePath = Path.Combine(ccDir, filename);

                // Save the file
                using (var fileStreamOut = new FileStream(filePath, FileMode.Create, FileAccess.Write))
                {
                    fileStream.Position = 0; // Reset stream position
                    await fileStream.CopyToAsync(fileStreamOut);
                }

                return filePath;
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to save ghost file: {ex.Message}", ex);
            }
        }
    }
}