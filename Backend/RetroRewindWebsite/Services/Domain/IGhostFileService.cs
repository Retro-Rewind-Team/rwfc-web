namespace RetroRewindWebsite.Services.Domain
{
    public interface IGhostFileService
    {
        /// <summary>
        /// Parses a Mario Kart Wii ghost file (.rkg) and extracts metadata
        /// </summary>
        /// <param name="fileStream">Stream containing the .rkg file data</param>
        /// <returns>Parse result containing extracted ghost data or error information</returns>
        Task<GhostFileParseResult> ParseGhostFileAsync(Stream fileStream);

        /// <summary>
        /// Saves a ghost file to disk in the appropriate directory structure
        /// </summary>
        /// <param name="fileStream">Stream containing the .rkg file data</param>
        /// <param name="trackId">ID of the track this ghost is for</param>
        /// <param name="cc">CC value (150 or 200)</param>
        /// <param name="playerDisplayName">Display name of the player who set this time</param>
        /// <returns>File path where the ghost was saved</returns>
        Task<string> SaveGhostFileAsync(Stream fileStream, int trackId, short cc, string playerDisplayName);
    }

    public class GhostFileParseResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }

        // Extracted data
        public short CourseId { get; set; }
        public int FinishTimeMs { get; set; }
        public string FinishTimeDisplay { get; set; } = string.Empty;
        public short VehicleId { get; set; }
        public short CharacterId { get; set; }
        public short ControllerType { get; set; }
        public short DriftType { get; set; }
        public string MiiName { get; set; } = string.Empty;
        public short LapCount { get; set; }
        public List<int> LapSplitsMs { get; set; } = [];
        public DateOnly DateSet { get; set; }
    }
}