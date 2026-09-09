using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.Player;
using RetroRewindWebsite.Repositories.Player;
using RetroRewindWebsite.Services.Application;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Services;

/// <summary>
/// The one-minute sync loop reads every active player, works for several seconds, then writes
/// them back. These tests pin down what that write is allowed to touch: only the columns the
/// sync itself changed, and never the cached Mii row.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class SyncModerationRaceTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;

    private const string Pid = "9201";
    private const string Fc = "0000-0000-9201";

    public SyncModerationRaceTests(DatabaseFixture fixture) => _fixture = fixture;

    public async ValueTask InitializeAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var player = new PlayerEntity
        {
            Pid = Pid,
            Name = "SyncRacePlayer",
            Fc = Fc,
            Ev = 5000,
            Rank = 0,
            MiiData = "original-mii-data",
            LastSeen = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
            IsSuspicious = false,
            SuspiciousVRJumps = 0,
            VRGainLast24Hours = 0,
            VRGainLastWeek = 0,
            VRGainLastMonth = 0
        };

        db.Players.Add(player);
        await db.SaveChangesAsync();

        db.Set<PlayerMiiCacheEntity>().Add(new PlayerMiiCacheEntity
        {
            PlayerId = player.Id,
            MiiImageBase64 = "cached-mii-image",
            MiiImageFetchedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.Players.Where(p => p.Pid == Pid).ExecuteDeleteAsync();
    }

    [Fact]
    public async Task SyncWriteBack_DoesNotRevertAModerationFlagAppliedMidTick()
    {
        // One scope for the whole "tick", mirroring the scope the background service creates.
        using var syncScope = _fixture.Factory.Services.CreateScope();
        var syncRepository = syncScope.ServiceProvider.GetRequiredService<IPlayerRepository>();

        // The tick reads every active player up front.
        var syncBatch = await syncRepository.GetPlayersByPidsForUpdateAsync([Pid]);
        syncBatch.Count.ShouldBe(1);

        // While the tick is still running, a moderator flags the player from another request.
        using (var moderatorScope = _fixture.Factory.Services.CreateScope())
        {
            var moderation = moderatorScope.ServiceProvider.GetRequiredService<IPlayerModerationService>();
            var flagged = await moderation.FlagPlayerAsync(Pid, "flagged mid-tick");
            flagged.ShouldNotBeNull();
        }

        // The tick finishes and writes back the change it actually made.
        syncBatch[0].Ev = 6000;
        syncBatch[0].LastUpdated = DateTime.UtcNow;
        await syncRepository.UpdateRangeAsync(syncBatch);

        using var verifyScope = _fixture.Factory.Services.CreateScope();
        var db = verifyScope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        var after = await db.Players.AsNoTracking().SingleAsync(p => p.Pid == Pid, cancellationToken: TestContext.Current.CancellationToken);

        // The moderator's write must survive the tick.
        after.IsSuspicious.ShouldBeTrue();
        after.FlagReason.ShouldBe("flagged mid-tick");

        // And the sync's own change must still land.
        after.Ev.ShouldBe(6000);
    }

    [Fact]
    public async Task FlagPlayerAsync_DoesNotRewriteTheCachedMiiImageRow()
    {
        int playerId;
        using (var setupScope = _fixture.Factory.Services.CreateScope())
        {
            var db = setupScope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
            playerId = await db.Players.AsNoTracking()
                .Where(p => p.Pid == Pid).Select(p => p.Id).SingleAsync(cancellationToken: TestContext.Current.CancellationToken);
        }

        var before = await ReadMiiCacheRowVersionAsync(playerId);

        using (var moderatorScope = _fixture.Factory.Services.CreateScope())
        {
            var moderation = moderatorScope.ServiceProvider.GetRequiredService<IPlayerModerationService>();
            var flagged = await moderation.FlagPlayerAsync(Pid, "mii cache check");
            flagged.ShouldNotBeNull();
        }

        var after = await ReadMiiCacheRowVersionAsync(playerId);

        // Flagging touches only the Players row. The Mii blob can be several KB, and rewriting
        // it on every moderation action is pure churn.
        after.ShouldBe(before);
    }

    /// <summary>
    /// Reads the Postgres <c>xmin</c> system column, which changes on any UPDATE to the row even
    /// when every value written is identical. That makes it the only way to tell "not written"
    /// apart from "written with the same values".
    /// </summary>
    private async Task<string> ReadMiiCacheRowVersionAsync(int playerId)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var versions = await db.Database
            .SqlQueryRaw<string>(
                """SELECT xmin::text AS "Value" FROM "PlayerMiiCaches" WHERE "PlayerId" = {0}""",
                playerId)
            .ToListAsync();

        return versions.ShouldHaveSingleItem();
    }
}
