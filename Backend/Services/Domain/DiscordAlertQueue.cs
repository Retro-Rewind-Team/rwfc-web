using System.Threading.Channels;

namespace RetroRewindWebsite.Services.Domain;

/// <summary>An alert waiting to be posted to Discord.</summary>
public sealed record DiscordAlert(string PlayerName, string FriendCode, string Reason);

/// <summary>
/// Hands alerts from the sync loop to the background sender. Bounded and non-blocking on write:
/// the sync runs on a one-minute schedule and must never wait on Discord, so when the queue is
/// full the newest alert is dropped and logged rather than applying backpressure to the sync.
/// </summary>
public sealed class DiscordAlertQueue
{
    private const int Capacity = 200;

    // FullMode.Wait only governs WriteAsync, which this class never calls. TryWrite returns false
    // immediately when the channel is full, so writers never block and a full queue is visible.
    // DropWrite would discard the alert but still report success, hiding the drop from callers.
    private readonly Channel<DiscordAlert> _channel = Channel.CreateBounded<DiscordAlert>(
        new BoundedChannelOptions(Capacity)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true
        });

    public ChannelReader<DiscordAlert> Reader => _channel.Reader;

    /// <summary>Returns false when the queue is full and the alert was dropped.</summary>
    public bool TryEnqueue(DiscordAlert alert) => _channel.Writer.TryWrite(alert);
}
