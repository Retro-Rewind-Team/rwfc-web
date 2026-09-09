using System.Text;
using System.Text.Json;

namespace RetroRewindWebsite.Services.Domain;

/// <summary>
/// Sends auto-flag and moderation alert notifications to a configured Discord webhook URL.
/// </summary>
public class DiscordWebhookService : IDiscordWebhookService
{
    /// <summary>Named HTTP client registered in Program.cs with a short timeout.</summary>
    public const string DiscordClientName = "discord";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string? _webhookUrl;
    private readonly ILogger<DiscordWebhookService> _logger;

    public DiscordWebhookService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<DiscordWebhookService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _webhookUrl = configuration["Discord:AutoFlagWebhookUrl"];
        _logger = logger;
    }

    public async Task SendAutoFlagAsync(
        string playerName, string friendCode, string reason, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_webhookUrl))
            return;

        var payload = new
        {
            embeds = new[]
            {
                new
                {
                    title = "Player Auto-Flagged",
                    color = 0xf38ba8, // red
                    fields = new[]
                    {
                        new { name = "Player", value = playerName, inline = true },
                        new { name = "Friend Code", value = friendCode, inline = true },
                        new { name = "Reason", value = reason, inline = false },
                    },
                    timestamp = DateTime.UtcNow.ToString("o")
                }
            }
        };

        try
        {
            // Named client so the timeout below is enforced; the default client waits 100 seconds.
            var client = _httpClientFactory.CreateClient(DiscordClientName);
            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync(_webhookUrl, content, cancellationToken);

            if (!response.IsSuccessStatusCode)
                _logger.LogWarning("Discord webhook returned {StatusCode} for auto-flag notification of {Player}",
                    response.StatusCode, playerName);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send auto-flag Discord webhook for {Player}", playerName);
        }
    }
}
