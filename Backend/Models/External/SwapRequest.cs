namespace RetroRewindWebsite.Models.External;

public class SwapRequest
{
    public string SourcePid { get; set; } = string.Empty;
    public string TargetPid { get; set; } = string.Empty;
    public string Moderator { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}
