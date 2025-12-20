using System.Text;

namespace RetroRewindWebsite.Services.Domain
{
    public class GhostFileService : IGhostFileService
    {
        private readonly ILogger<GhostFileService> _logger;
        private readonly string _ghostStoragePath;

        public GhostFileService(ILogger<GhostFileService> logger, IConfiguration configuration)
        {
            _logger = logger;
            // Default to "ghosts" folder in project root, similar to "logs"
            _ghostStoragePath = configuration["GhostStoragePath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "ghosts");

            // Ensure directory exists
            if (!Directory.Exists(_ghostStoragePath))
            {
                Directory.CreateDirectory(_ghostStoragePath);
            }
        }

        public async Task<GhostFileParseResult> ParseGhostFileAsync(Stream fileStream)
        {
            var result = new GhostFileParseResult();

            try
            {
                using var reader = new BinaryReader(fileStream, Encoding.UTF8, leaveOpen: true);

                // Verify file size (minimum header size is 0x88 bytes)
                if (fileStream.Length < 0x88)
                {
                    result.Success = false;
                    result.ErrorMessage = "Invalid ghost file: file too small";
                    return result;
                }

                // Read magic bytes "RKGD"
                var magic = Encoding.ASCII.GetString(reader.ReadBytes(4));
                if (magic != "RKGD")
                {
                    result.Success = false;
                    result.ErrorMessage = "Invalid ghost file: incorrect magic bytes";
                    return result;
                }

                // Read finish time (offset 0x04)
                var timeByte1 = reader.ReadByte();
                var timeByte2 = reader.ReadByte();
                var timeByte3 = reader.ReadByte();

                int minutes = (timeByte1 >> 1) & 0x7F;
                int seconds = ((timeByte1 & 0x01) << 6) | ((timeByte2 >> 2) & 0x3F);
                int milliseconds = ((timeByte2 & 0x03) << 8) | timeByte3;

                result.FinishTimeMs = (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;
                result.FinishTimeDisplay = $"{minutes}:{seconds:D2}.{milliseconds:D3}";

                // Read track and vehicle info (offset 0x07)
                var trackVehicleByte1 = reader.ReadByte();
                var trackVehicleByte2 = reader.ReadByte();

                result.CourseId = (short)(trackVehicleByte1 >> 2);
                result.VehicleId = (short)(((trackVehicleByte1 & 0x03) << 4) | ((trackVehicleByte2 >> 4) & 0x0F));
                result.CharacterId = (short)(trackVehicleByte2 & 0x0F);

                // Read date (offset 0x09)
                var dateByte1 = reader.ReadByte();
                var dateByte2 = reader.ReadByte();

                int year = 2000 + ((dateByte1 >> 1) & 0x7F);
                int month = ((dateByte1 & 0x01) << 3) | ((dateByte2 >> 5) & 0x07);
                int day = dateByte2 & 0x1F;

                try
                {
                    result.DateSet = new DateOnly(year, month, day);
                }
                catch
                {
                    result.DateSet = DateOnly.FromDateTime(DateTime.UtcNow);
                }

                // Read controller type (offset 0x0B)
                var controllerByte = reader.ReadByte();
                result.ControllerType = (short)((controllerByte >> 4) & 0x0F);

                // Read drift type and lap count (offset 0x0C - 0x10)
                var flagsByte = reader.ReadByte();
                result.DriftType = (short)((flagsByte >> 6) & 0x01);

                reader.ReadByte(); // Skip 0x0D
                reader.ReadUInt16(); // Skip input data length (0x0E)

                var lapCountByte = reader.ReadByte(); // 0x10
                result.LapCount = (short)(lapCountByte & 0x0F);

                // Read lap splits (offset 0x11 - 0x20)
                result.LapSplitsMs = [];
                for (int i = 0; i < Math.Min((int)result.LapCount, 7); i++)
                {
                    var lapByte1 = reader.ReadByte();
                    var lapByte2 = reader.ReadByte();
                    var lapByte3 = reader.ReadByte();

                    int lapMinutes = (lapByte1 >> 1) & 0x7F;
                    int lapSeconds = ((lapByte1 & 0x01) << 6) | ((lapByte2 >> 2) & 0x3F);
                    int lapMilliseconds = ((lapByte2 & 0x03) << 8) | lapByte3;

                    int lapTimeMs = (lapMinutes * 60 * 1000) + (lapSeconds * 1000) + lapMilliseconds;

                    if (lapTimeMs > 0) // Only add non-zero lap times
                    {
                        result.LapSplitsMs.Add(lapTimeMs);
                    }
                }

                // Skip to Mii data (offset 0x3C)
                fileStream.Seek(0x3C, SeekOrigin.Begin);

                // Read Mii name (first 10 UTF-16 chars of Mii data)
                var miiNameBytes = reader.ReadBytes(20); // 10 chars * 2 bytes
                result.MiiName = Encoding.Unicode.GetString(miiNameBytes).TrimEnd('\0');

                result.Success = true;
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing ghost file");
                result.Success = false;
                result.ErrorMessage = $"Failed to parse ghost file: {ex.Message}";
                return result;
            }
        }

        public async Task<string> SaveGhostFileAsync(Stream fileStream, int trackId, short cc, string discordUserId)
        {
            try
            {
                // Create directory structure: ghosts/track-{trackId}/{cc}cc/
                var trackDir = Path.Combine(_ghostStoragePath, $"track-{trackId}", $"{cc}cc");
                Directory.CreateDirectory(trackDir);

                // Generate unique filename: {timestamp}_{discordUserId}.rkg
                var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                var fileName = $"{timestamp}_{discordUserId}.rkg";
                var filePath = Path.Combine(trackDir, fileName);

                // Save file
                fileStream.Seek(0, SeekOrigin.Begin);
                using var fileStreamOut = new FileStream(filePath, FileMode.Create, FileAccess.Write);
                await fileStream.CopyToAsync(fileStreamOut);

                // Return relative path from project root
                var relativePath = Path.GetRelativePath(Directory.GetCurrentDirectory(), filePath);

                _logger.LogInformation("Saved ghost file to {FilePath}", relativePath);

                return relativePath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving ghost file");
                throw;
            }
        }

        public string GetGhostDownloadPath(string ghostFilePath)
        {
            // Convert relative path to absolute path for serving
            return Path.Combine(Directory.GetCurrentDirectory(), ghostFilePath);
        }
    }
}