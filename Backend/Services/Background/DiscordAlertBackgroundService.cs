using RetroRewindWebsite.Services.Domain;

namespace RetroRewindWebsite.Services.Background;

/// <summary>
/// Drains <see cref="DiscordAlertQueue"/> and posts each alert. Runs on its own so a slow or
/// unreachable Discord delays only notifications, never the leaderboard sync that raised them.
/// </summary>
public class DiscordAlertBackgroundService : BackgroundService
{
    private readonly DiscordAlertQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DiscordAlertBackgroundService> _logger;

    public DiscordAlertBackgroundService(
        DiscordAlertQueue queue,
        IServiceScopeFactory scopeFactory,
        ILogger<DiscordAlertBackgroundService> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Discord alert sender started");

        try
        {
            await foreach (var alert in _queue.Reader.ReadAllAsync(stoppingToken))
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var webhook = scope.ServiceProvider.GetRequiredService<IDiscordWebhookService>();
                    await webhook.SendAutoFlagAsync(alert.PlayerName, alert.FriendCode, alert.Reason, stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    // One bad alert must not stop the drain loop.
                    _logger.LogWarning(ex, "Failed to send Discord alert for {Player}", alert.PlayerName);
                }
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Discord alert sender stopping");
        }
    }
}
