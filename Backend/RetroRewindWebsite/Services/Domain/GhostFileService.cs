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

    /// <summary>
    /// Parses the provided byte array representing a ghost file and returns the result of the parsing operation.
    /// </summary>
    /// <remarks>If the input is invalid or an error occurs during parsing, the result will indicate failure
    /// and include a descriptive error message. The returned result contains parsed metadata such as course ID, finish
    /// time, vehicle and character IDs, controller type, drift information, lap splits, Mii name, lap count, and date
    /// set.</remarks>
    /// <param name="bytes">The byte array containing the ghost file data to be parsed. Must not be null and must contain at least the
    /// minimum required number of bytes.</param>
    /// <returns>A GhostFileParseResult indicating either a successful parse with extracted ghost file information or a failure
    /// with an error message.</returns>
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

    /// <summary>
    /// Validates that the provided byte array contains the expected magic bytes for an RKG file.
    /// </summary>
    /// <remarks>Use this method to ensure that the file header matches the expected RKG format before further
    /// parsing. Returns null if the magic bytes are correct, indicating successful validation.</remarks>
    /// <param name="bytes">The byte array to validate. Must contain at least four bytes starting at the magic byte offset.</param>
    /// <returns>A Failure result describing the invalid magic bytes if validation fails; otherwise, null if the magic bytes are
    /// valid.</returns>
    private static GhostFileParseResult.Failure? ValidateMagicBytes(byte[] bytes)
    {
        var magic = Encoding.ASCII.GetString(bytes, OffsetMagic, 4);
        return magic != RkgMagic
            ? new GhostFileParseResult.Failure(
                $"Invalid RKG file - expected '{RkgMagic}' magic bytes but got '{magic}'")
            : null;
    }

    /// <summary>
    /// Parses a byte array to extract the finish time and track slot identifier from a big-endian encoded value.
    /// </summary>
    /// <remarks>The finish time is calculated from minutes, seconds, and milliseconds fields within the
    /// encoded value. The display string is formatted as "minutes:seconds.milliseconds". The track slot identifier is
    /// extracted as a short value. Ensure the byte array contains valid data to avoid incorrect parsing
    /// results.</remarks>
    /// <param name="bytes">The byte array containing the encoded finish time and track slot identifier. Must contain sufficient data
    /// starting at the expected offset.</param>
    /// <returns>A tuple containing the finish time in milliseconds, a formatted display string of the finish time, and the track
    /// slot identifier.</returns>
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

    /// <summary>
    /// Extracts vehicle, character, date, and controller information from a byte array containing encoded statistics
    /// data.
    /// </summary>
    /// <remarks>The returned values are parsed from a 32-bit big-endian integer within the byte array. Ensure
    /// the input array is properly formatted to avoid incorrect results.</remarks>
    /// <param name="bytes">The byte array containing the encoded statistics information. Must be at least 4 bytes in length and formatted
    /// according to the expected encoding scheme.</param>
    /// <returns>A tuple containing the vehicle ID, character ID, date the statistics were set, and controller ID extracted from
    /// the provided byte array.</returns>
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

    /// <summary>
    /// Parses the specified year, month, and day into a DateOnly value, substituting the current date if the input is
    /// invalid.
    /// </summary>
    /// <remarks>If the input values are outside the valid ranges or an exception occurs during parsing, the
    /// method logs a warning and returns the current date. This ensures that a valid DateOnly is always
    /// returned.</remarks>
    /// <param name="year">The year component of the date. Must be between 2000 and 2127, inclusive.</param>
    /// <param name="month">The month component of the date. Must be between 1 and 12, inclusive.</param>
    /// <param name="day">The day component of the date. Must be between 1 and 31, inclusive.</param>
    /// <returns>A DateOnly representing the specified date, or the current date if the input values are invalid.</returns>
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

    /// <summary>
    /// Extracts the drift type and transmission bits from the specified byte array using predefined offsets and bit
    /// masks.
    /// </summary>
    /// <param name="bytes">The byte array containing encoded drift information. Must contain sufficient data at the required offset to
    /// extract values.</param>
    /// <returns>A tuple containing the drift type and transmission bits parsed from the byte array. The first element represents
    /// the drift type; the second element represents the transmission bits.</returns>
    private static (short driftType, short transmissionBits) ParseDriftInfo(byte[] bytes)
    {
        var info2 = ReadBigEndianUInt16(bytes, OffsetInfo2);
        var driftType = (short)((info2 >> 1) & 0x01);
        var transmissionBits = (short)((info2 >> 9) & 0x03);
        return (driftType, transmissionBits);
    }

    /// <summary>
    /// Determines whether a vehicle uses inside drifting based on its identifier and transmission settings.
    /// </summary>
    /// <remarks>The method distinguishes between bikes and other vehicles, and applies specific logic for
    /// certain bike identifiers. Transmission settings override or modify the default drifting behavior. Values outside
    /// the expected range for transmissionBits default to the vehicle's standard drifting mode.</remarks>
    /// <param name="vehicleId">The identifier of the vehicle. Determines the vehicle type and influences the default drifting behavior.</param>
    /// <param name="transmissionBits">The transmission setting for the vehicle. Valid values are 0, 1, 2, or 3, each affecting the drifting mode
    /// selection.</param>
    /// <returns>A value of 1 if the vehicle uses inside drifting; otherwise, 0.</returns>
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

    /// <summary>
    /// Parses lap split times from the specified byte array and returns a list of lap durations in milliseconds.
    /// </summary>
    /// <remarks>If the lap count exceeds the maximum number of stored splits, remaining lap times are
    /// estimated based on the finish time. The method does not validate the integrity of the input data; callers should
    /// ensure the byte array is properly formatted.</remarks>
    /// <param name="bytes">The byte array containing encoded lap split data. Must contain sufficient data for the specified number of laps.</param>
    /// <param name="lapCount">The total number of laps to parse. Determines how many lap splits are extracted from the byte array.</param>
    /// <param name="finishTimeMs">The total finish time, in milliseconds, used to estimate lap splits if the lap count exceeds the maximum stored
    /// splits.</param>
    /// <returns>A list of integers representing the duration of each lap in milliseconds. The list contains one entry per lap,
    /// up to the specified lap count.</returns>
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

    /// <summary>
    /// Estimates and appends the remaining lap split times to the provided list based on the total lap count and
    /// expected finish time.
    /// </summary>
    /// <remarks>If the remaining time or lap count is invalid, no estimation is performed and a warning is
    /// logged. The method distributes the remaining time evenly across the estimated laps, with any remainder
    /// distributed to the earliest laps.</remarks>
    /// <param name="lapSplitsMs">A list containing the split times, in milliseconds, for completed laps. The method appends estimated split times
    /// for remaining laps to this list.</param>
    /// <param name="totalLapCount">The total number of laps expected for the track. Must be greater than the number of stored lap splits.</param>
    /// <param name="finishTimeMs">The expected total finish time for all laps, in milliseconds. Must be greater than the sum of stored lap split
    /// times.</param>
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

    /// <summary>
    /// Extracts and decodes the Mii name from the specified byte array using big-endian Unicode encoding.
    /// </summary>
    /// <remarks>The method searches for the first occurrence of a double null terminator to determine the end
    /// of the Mii name. Any trailing whitespace is removed from the decoded name.</remarks>
    /// <param name="bytes">The byte array containing Mii data. Must be at least large enough to include the Mii name segment; otherwise, an
    /// empty string is returned.</param>
    /// <returns>A string representing the decoded Mii name. Returns an empty string if the name segment is not present or is
    /// empty.</returns>
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

    /// <summary>
    /// Reads a 32-bit unsigned integer from a byte array using big-endian byte order.
    /// </summary>
    /// <param name="bytes">The byte array containing the data to read.</param>
    /// <param name="offset">The zero-based index in the array at which to begin reading the 32-bit value. Must be within the bounds of the
    /// array and allow reading four bytes.</param>
    /// <returns>A 32-bit unsigned integer constructed from four bytes starting at the specified offset, interpreted in
    /// big-endian order.</returns>
    /// <exception cref="ArgumentException">Thrown if the specified offset does not allow reading four bytes from the array.</exception>
    private static uint ReadBigEndianUInt32(byte[] bytes, int offset)
    {
        if (offset + 4 > bytes.Length)
            throw new ArgumentException($"Cannot read UInt32 at offset 0x{offset:X}");

        return ((uint)bytes[offset] << 24) |
               ((uint)bytes[offset + 1] << 16) |
               ((uint)bytes[offset + 2] << 8) |
               bytes[offset + 3];
    }

    /// <summary>
    /// Reads a 16-bit unsigned integer from the specified byte array using big-endian byte order.
    /// </summary>
    /// <param name="bytes">The byte array containing the data to read from.</param>
    /// <param name="offset">The zero-based index in the array at which to begin reading the 16-bit value.</param>
    /// <returns>A 16-bit unsigned integer interpreted from two bytes at the specified offset in big-endian order.</returns>
    /// <exception cref="ArgumentException">Thrown if there are fewer than two bytes available at the specified offset.</exception>
    private static ushort ReadBigEndianUInt16(byte[] bytes, int offset)
    {
        if (offset + 2 > bytes.Length)
            throw new ArgumentException($"Cannot read UInt16 at offset 0x{offset:X}");

        return (ushort)((bytes[offset] << 8) | bytes[offset + 1]);
    }

    /// <summary>
    /// Removes invalid characters from a file name and replaces spaces with underscores.
    /// </summary>
    /// <remarks>The returned file name may be shorter than the input if invalid characters are removed or if
    /// the input exceeds 50 characters. This method does not guarantee uniqueness or check for reserved file
    /// names.</remarks>
    /// <param name="fileName">The file name to sanitize. Cannot be null. Any invalid file name characters will be removed.</param>
    /// <returns>A sanitized string suitable for use as a file name, with invalid characters removed, spaces replaced by
    /// underscores, and truncated to a maximum of 50 characters.</returns>
    private static string SanitizeFileName(string fileName)
    {
        var invalidChars = Path.GetInvalidFileNameChars();
        var sanitized = new string([.. fileName.Where(c => !invalidChars.Contains(c))]);
        return sanitized.Replace(" ", "_")[..Math.Min(sanitized.Length, 50)];
    }
}
