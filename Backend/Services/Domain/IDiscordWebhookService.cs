namespace RetroRewindWebsite.Services.Domain;

public interface IDiscordWebhookService
{
    /// <summary>
    /// Posts an auto-flag notification to the configured Discord webhook.
    /// Does nothing if no webhook URL is configured.
    /// Call this from the background sender rather than from request or sync paths, which should
    /// queue through <see cref="DiscordAlertQueue"/> so they never wait on Discord.
    /// </summary>
    Task SendAutoFlagAsync(
        string playerName, string friendCode, string reason, CancellationToken cancellationToken = default);
}
