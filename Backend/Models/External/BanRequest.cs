namespace RetroRewindWebsite.Models.External;

/// <summary>
/// Ban payload sent by wfc-bot after it has already banned the player on the WFC server. Only
/// <see cref="Pid"/> is read: this endpoint just marks the player banned on the leaderboard.
/// </summary>
/// <remarks>
/// The remaining properties are bound and then discarded. They are kept rather than deleted
/// because the bot populates them with real moderation data -- who issued the ban, why, and for
/// how long -- which is what an audit trail would need. Recording that means a schema change, so
/// it is a deliberate decision rather than something to fold into a cleanup.
/// <para>
/// <see cref="ReasonHidden"/> never binds at all: the bot sends <c>reason_hidden</c>, and the JSON
/// binder matches camelCase to PascalCase but not snake_case. It is always the empty default.
/// </para>
/// </remarks>
public class BanRequest
{
    /// <summary>The only property this endpoint reads.</summary>
    public string Pid { get; set; } = string.Empty;

    // Accepted and discarded. See the remarks above before removing or relying on any of these.
    public int Days { get; set; }
    public int Hours { get; set; }
    public int Minutes { get; set; }
    public bool Tos { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string ReasonHidden { get; set; } = string.Empty;
    public string Moderator { get; set; } = string.Empty;
}
