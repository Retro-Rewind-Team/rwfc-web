namespace RetroRewindWebsite.Models.DTOs
{
    public class VRHistoryDto
    {
        public DateTime Date { get; set; }
        public int VRChange { get; set; }
        public int TotalVR { get; set; }
    }

    public class VRHistoryRangeResponse
    {
        public required string PlayerId { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public List<VRHistoryDto> History { get; set; } = [];
        public int TotalVRChange { get; set; }
        public int StartingVR { get; set; }
        public int EndingVR { get; set; }
    }

    public class RecentChangeDto
    {
        public required string PlayerId { get; set; }
        public required string FriendCode { get; set; }
        public DateTime Date { get; set; }
        public int VRChange { get; set; }
        public int TotalVR { get; set; }
    }
}
