namespace RetroRewindWebsite.Models.DTOs
{
    public class PlayerDto
    {
        public required string Pid { get; set; }
        public required string Name { get; set; }
        public required string FriendCode { get; set; }
        public int VR { get; set; }
        public int Rank { get; set; }
        public DateTime LastSeen { get; set; }
        public bool IsSuspicious { get; set; }
        public VRStatsDto VRStats { get; set; } = new();
        public string? MiiImageBase64 { get; set; }
        public string? MiiData { get; set; }
    }

    public class TopPlayerDto
    {
        public required string Name { get; set; }
        public required string FriendCode { get; set; }
        public int VR { get; set; }
        public int Rank { get; set; }
        public string? MiiData { get; set; }
    }

    public class VRStatsDto
    {
        public int Last24Hours { get; set; }
        public int LastWeek { get; set; }
        public int LastMonth { get; set; }
    }

    public class ModerationActionResultDto
    {
        public bool Success { get; set; }
        public required string Message { get; set; }
        public PlayerDto? Player { get; set; }
    }
}
