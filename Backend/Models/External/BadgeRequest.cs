namespace RetroRewindWebsite.Models.External;

public class BadgeRequest
{
    public string Pid { get; set; } = string.Empty;
}

public class BatchBadgeRequest
{
    public required List<string> Pids { get; set; }
}

public class BadgeManagementRequest
{
    public string Pid { get; set; } = string.Empty;
    public int Badge { get; set; } // The badge to add or remove
}
