namespace RetroRewindWebsite.Models.External
{
    public class UnflagRequest
    {
        public string Pid { get; set; } = string.Empty;
        public string Moderator { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
    }
}
