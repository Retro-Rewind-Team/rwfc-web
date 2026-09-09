using RetroRewindWebsite.Services.Domain;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Unit.Domain;

/// <summary>
/// The sync loop runs on a one-minute schedule and must never wait on Discord. These tests pin the
/// two properties that guarantee it: writes complete without a reader present, and a full queue
/// drops rather than blocking.
/// </summary>
[Trait("Category", "Unit")]
public class DiscordAlertQueueTests
{
    [Fact]
    public void EnqueueSucceedsWithNoReaderAttached()
    {
        var queue = new DiscordAlertQueue();

        queue.TryEnqueue(new DiscordAlert("Player", "0000-0000-0001", "high initial VR")).ShouldBeTrue();
    }

    [Fact]
    public async Task QueuedAlertsAreReadBackInOrder()
    {
        var queue = new DiscordAlertQueue();

        queue.TryEnqueue(new DiscordAlert("First", "0000-0000-0001", "a")).ShouldBeTrue();
        queue.TryEnqueue(new DiscordAlert("Second", "0000-0000-0002", "b")).ShouldBeTrue();

        var read = new List<string>();
        for (var i = 0; i < 2; i++)
        {
            var alert = await queue.Reader.ReadAsync(TestContext.Current.CancellationToken);
            read.Add(alert.PlayerName);
        }

        read.ShouldBe(["First", "Second"]);
    }

    [Fact]
    public void AFullQueueDropsInsteadOfBlocking()
    {
        var queue = new DiscordAlertQueue();

        // Fill well past capacity with nothing draining. Every call must return immediately;
        // blocking here would be the sync loop stalling behind an unreachable Discord.
        var accepted = 0;
        var rejected = 0;
        for (var i = 0; i < 500; i++)
        {
            if (queue.TryEnqueue(new DiscordAlert($"Player{i}", "0000-0000-0001", "reason")))
                accepted++;
            else
                rejected++;
        }

        accepted.ShouldBeGreaterThan(0);
        rejected.ShouldBeGreaterThan(0);
        (accepted + rejected).ShouldBe(500);
    }
}
