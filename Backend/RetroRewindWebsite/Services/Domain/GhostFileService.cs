using RetroRewindWebsite.Models.Domain;
using System.Text;

namespace RetroRewindWebsite.Services.Domain;

public class GhostFileService : IGhostFileService
{
    private readonly string _ghostStoragePath;
    private readonly ILogger<GhostFileService> _logger;

    private const string DefaultGhostPath = "ghosts";
    private const int MinRkgFileSize = 0x88;
    private const string RkgMagic = "RKGD";
    private const int MaxLapSplitsStored = 5;

    private const int OffsetMagic = 0x00;
    private const int OffsetTimeAndTrack = 0x04;
    private const int OffsetStatsInfo = 0x08;
    private const int OffsetInfo2 = 0x0C;
    private const int OffsetLapCount = 0x10;
    private const int OffsetLapSplits = 0x11;
    private const int OffsetMiiName = 0x3E;

    public GhostFileService(IConfiguration configuration, ILogger<GhostFileService> logger)
    {
        _ghostStoragePath = configuration["GhostStoragePath"] ?? DefaultGhostPath;
        _logger = logger;

        if (!Directory.Exists(_ghostStoragePath))
            Directory.CreateDirectory(_ghostStoragePath);
    }

    public async Task<GhostFileParseResult> ParseGhostFileAsync(Stream fileStream)
    {
        try
        {
            using var memoryStream = new MemoryStream();
            await fileStream.CopyToAsync(memoryStream);
            return ParseGhostFileBytes(memoryStream.ToArray());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse ghost file");
            return new GhostFileParseResult.Failure($"Failed to parse ghost file: {ex.Message}");
        }
    }

    public async Task<string> SaveGhostFileAsync(
        Stream fileStream,
        int trackId,
        short cc,
        string playerDisplayName)
    {
        string ccDir = Path.Combine(_ghostStoragePath, $"track-{trackId}", $"{cc}cc");
        Directory.CreateDirectory(ccDir);

        string timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        string safeDisplayName = SanitizeFileName(playerDisplayName);
        string filePath = Path.Combine(ccDir, $"{timestamp}_{safeDisplayName}.rkg");

        using (var fileStreamOut = new FileStream(filePath, FileMode.Create, FileAccess.Write))
        {
            fileStream.Position = 0;
            await fileStream.CopyToAsync(fileStreamOut);
        }

        _logger.LogInformation("Ghost file saved: {FilePath} for player {PlayerName}",
            filePath, playerDisplayName);

        return filePath;
    }

    // ===== PRIVATE PARSING METHODS =====

    private GhostFileParseResult ParseGhostFileBytes(byte[] bytes)
    {
        try
        {
            if (bytes == null || bytes.Length < MinRkgFileSize)
                return new GhostFileParseResult.Failure(
                    $"Invalid RKG file - expected at least {MinRkgFileSize} bytes, got {bytes?.Length ?? 0}");

            var magicError = ValidateMagicBytes(bytes);
            if (magicError != null)
                return magicError;

            var (finishTimeMs, finishTimeDisplay, trackSlotId) = ParseFinishTimeAndTrack(bytes);
            var (vehicleId, characterId, dateSet, controllerId) = ParseStatsInfo(bytes);
            var (driftType, transmissionBits) = ParseDriftInfo(bytes);
            var driftCategory = DetermineActualDrift(vehicleId, transmissionBits);
            var lapCount = bytes[OffsetLapCount];
            var lapSplitsMs = ParseLapSplits(bytes, lapCount, finishTimeMs);
            var miiName = ParseMiiName(bytes);

            return new GhostFileParseResult.Success(
                CourseId: trackSlotId,
                FinishTimeMs: finishTimeMs,
                FinishTimeDisplay: finishTimeDisplay,
                VehicleId: vehicleId,
                CharacterId: characterId,
                ControllerType: controllerId,
                DriftType: driftType,
                DriftCategory: driftCategory,
                MiiName: miiName,
                LapCount: (short)lapCount,
                LapSplitsMs: lapSplitsMs,
                DateSet: dateSet
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing ghost file bytes");
            return new GhostFileParseResult.Failure($"Error parsing ghost file: {ex.Message}");
        }
    }

    private static GhostFileParseResult.Failure? ValidateMagicBytes(byte[] bytes)
    {
        var magic = Encoding.ASCII.GetString(bytes, OffsetMagic, 4);
        return magic != RkgMagic
            ? new GhostFileParseResult.Failure(
                $"Invalid RKG file - expected '{RkgMagic}' magic bytes but got '{magic}'")
            : null;
    }

    private static (int finishTimeMs, string finishTimeDisplay, short trackSlotId) ParseFinishTimeAndTrack(byte[] bytes)
    {
        var timeValue = ReadBigEndianUInt32(bytes, OffsetTimeAndTrack);

        var minutes = (byte)((timeValue >> 25) & 0x7F);
        var seconds = (byte)((timeValue >> 18) & 0x7F);
        var milliseconds = (ushort)((timeValue >> 8) & 0x3FF);
        var trackSlotId = (short)((timeValue >> 2) & 0x3F);

        int finishTimeMs = (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;
        string finishTimeDisplay = $"{minutes}:{seconds:D2}.{milliseconds:D3}";

        return (finishTimeMs, finishTimeDisplay, trackSlotId);
    }

    private (short vehicleId, short characterId, DateOnly dateSet, short controllerId) ParseStatsInfo(byte[] bytes)
    {
        var statsInfo = ReadBigEndianUInt32(bytes, OffsetStatsInfo);

        var vehicleId = (short)((statsInfo >> 26) & 0x3F);
        var characterId = (short)((statsInfo >> 20) & 0x3F);
        var year = (ushort)(((statsInfo >> 13) & 0x7F) + 2000);
        var month = (byte)((statsInfo >> 9) & 0x0F);
        var day = (byte)((statsInfo >> 4) & 0x1F);
        var controllerId = (short)(statsInfo & 0x0F);
        var dateSet = ParseDate(year, month, day);

        return (vehicleId, characterId, dateSet, controllerId);
    }

    private DateOnly ParseDate(int year, int month, int day)
    {
        try
        {
            if (year < 2000 || year > 2127 || month < 1 || month > 12 || day < 1 || day > 31)
            {
                _logger.LogWarning("Invalid date in ghost file: {Year}-{Month}-{Day}, using current date",
                    year, month, day);
                return DateOnly.FromDateTime(DateTime.Now);
            }

            return new DateOnly(year, month, day);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse date {Year}-{Month}-{Day}, using current date",
                year, month, day);
            return DateOnly.FromDateTime(DateTime.Now);
        }
    }

    private static (short driftType, short transmissionBits) ParseDriftInfo(byte[] bytes)
    {
        var info2 = ReadBigEndianUInt16(bytes, OffsetInfo2);
        var driftType = (short)((info2 >> 1) & 0x01);
        var transmissionBits = (short)((info2 >> 9) & 0x03);
        return (driftType, transmissionBits);
    }

    private static short DetermineActualDrift(short vehicleId, short transmissionBits)
    {
        bool isBike = vehicleId >= 0x12 && vehicleId <= 0x23;
        bool isInsideDriftBike = vehicleId is 0x15 or 0x16 or 0x17 or 0x1B
            or 0x1E or 0x1F or 0x20 or 0x21 or 0x22;

        bool defaultIsInside = isBike && isInsideDriftBike;

        bool actualIsInside = transmissionBits switch
        {
            0 => defaultIsInside,
            1 => true,
            2 => isBike,
            3 => false,
            _ => defaultIsInside
        };

        return actualIsInside ? (short)1 : (short)0;
    }

    private List<int> ParseLapSplits(byte[] bytes, int lapCount, int finishTimeMs)
    {
        var lapSplitsMs = new List<int>();
        int storedLaps = Math.Min(lapCount, MaxLapSplitsStored);

        for (int i = 0; i < storedLaps; i++)
        {
            int offset = OffsetLapSplits + (i * 3);

            uint lapValue = ((uint)bytes[offset] << 16) |
                           ((uint)bytes[offset + 1] << 8) |
                           bytes[offset + 2];

            var lapMinutes = (byte)((lapValue >> 17) & 0x7F);
            var lapSeconds = (byte)((lapValue >> 10) & 0x7F);
            var lapMilliseconds = (ushort)(lapValue & 0x3FF);

            lapSplitsMs.Add((lapMinutes * 60 * 1000) + (lapSeconds * 1000) + lapMilliseconds);
        }

        if (lapCount > MaxLapSplitsStored)
            EstimateRemainingLaps(lapSplitsMs, lapCount, finishTimeMs);

        return lapSplitsMs;
    }

    private void EstimateRemainingLaps(List<int> lapSplitsMs, int totalLapCount, int finishTimeMs)
    {
        int sumOfStoredLaps = lapSplitsMs.Sum();
        int remainingTime = finishTimeMs - sumOfStoredLaps;
        int remainingLaps = totalLapCount - MaxLapSplitsStored;

        if (remainingTime <= 0 || remainingLaps <= 0)
        {
            _logger.LogWarning(
                "Invalid lap data: {StoredLaps} stored laps totaling {StoredTime}ms, " +
                "but finish time is {FinishTime}ms with {TotalLaps} total laps",
                lapSplitsMs.Count, sumOfStoredLaps, finishTimeMs, totalLapCount);
            return;
        }

        int avgTime = remainingTime / remainingLaps;
        int remainder = remainingTime % remainingLaps;

        for (int i = 0; i < remainingLaps; i++)
            lapSplitsMs.Add(avgTime + (i < remainder ? 1 : 0));

        _logger.LogDebug("Estimated {RemainingLaps} additional laps for track with {TotalLaps} total laps",
            remainingLaps, totalLapCount);
    }

    private static string ParseMiiName(byte[] bytes)
    {
        var miiNameBytes = new byte[20];
        if (bytes.Length >= OffsetMiiName + 20)
            Array.Copy(bytes, OffsetMiiName, miiNameBytes, 0, 20);

        int nullIndex = -1;
        for (int i = 0; i < miiNameBytes.Length - 1; i += 2)
        {
            if (miiNameBytes[i] == 0x00 && miiNameBytes[i + 1] == 0x00)
            {
                nullIndex = i;
                break;
            }
        }

        int bytesToDecode = nullIndex >= 0 ? nullIndex : miiNameBytes.Length;
        return bytesToDecode == 0
            ? string.Empty
            : Encoding.BigEndianUnicode.GetString(miiNameBytes, 0, bytesToDecode).Trim();
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
        var invalidChars = Path.GetInvalidFileNameChars();
        var sanitized = new string([.. fileName.Where(c => !invalidChars.Contains(c))]);
        return sanitized.Replace(" ", "_")[..Math.Min(sanitized.Length, 50)];
    }
}
