namespace RetroRewindWebsite.Models.External
{
    public class BanRequest
    {
        public string Pid { get; set; } = string.Empty;
        public int Days { get; set; }
        public int Hours { get; set; }
        public int Minutes { get; set; }
        public bool Tos { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string ReasonHidden { get; set; } = string.Empty;
        public string Moderator { get; set; } = string.Empty;
    }
}
