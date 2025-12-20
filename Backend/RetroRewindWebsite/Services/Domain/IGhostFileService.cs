namespace RetroRewindWebsite.Services.Domain
{
    public interface IGhostFileService
    {
        Task<GhostFileParseResult> ParseGhostFileAsync(Stream fileStream);
        Task<string> SaveGhostFileAsync(Stream fileStream, int trackId, short cc, string discordUserId);
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