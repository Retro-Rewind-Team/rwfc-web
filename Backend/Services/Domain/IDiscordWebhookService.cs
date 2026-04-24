namespace RetroRewindWebsite.Services.Domain;

public interface IDiscordWebhookService
{
    /// <summary>
    /// Posts an auto-flag notification to the configured Discord webhook.
    /// Does nothing if no webhook URL is configured.
    /// </summary>
    Task SendAutoFlagAsync(string playerName, string friendCode, string reason);
}
