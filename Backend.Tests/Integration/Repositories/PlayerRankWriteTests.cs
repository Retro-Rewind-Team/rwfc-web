using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.Player;
using RetroRewindWebsite.Repositories.Player;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using RetroRewindWebsite.Tests.TestHelpers;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Repositories;

/// <summary>
/// The ranking updates run every minute against the whole Players table. These tests pin down that
/// they only write rows whose value actually changed -- rewriting every row each tick generates
/// dead tuples and autovacuum pressure that grows with the player count.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class PlayerRankWriteTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;

    private static readonly string[] TestPids = ["9301", "9302", "9303"];

    public PlayerRankWriteTests(DatabaseFixture fixture) => _fixture = fixture;

    public async ValueTask InitializeAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        db.Players.AddRange(
            NewPlayer("9301", "RankTop", ev: 30000),
            NewPlayer("9302", "RankMiddle", ev: 20000),
            NewPlayer("9303", "RankBottom", ev: 10000));

        await db.SaveChangesAsync();
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.Players.Where(p => TestPids.Contains(p.Pid)).ExecuteDeleteAsync();
    }

    [Fact]
    public async Task UpdatePlayerRanksAsync_DoesNotRewriteRowsWhoseRankIsUnchanged()
    {
        await RunAsync(r => r.UpdatePlayerRanksAsync());

        var before = await ReadPlayerVersionsAsync();

        // Nothing changed in between, so the second pass computes identical ranks.
        await RunAsync(r => r.UpdatePlayerRanksAsync());

        var after = await ReadPlayerVersionsAsync();

        after.ShouldBe(before);
    }

    [Fact]
    public async Task UpdatePlayerRanksAsync_StillWritesRowsWhoseRankChanged()
    {
        await RunAsync(r => r.UpdatePlayerRanksAsync());

        var before = await ReadPlayerVersionsAsync();

        // Send the bottom player to the top, which reorders all three.
        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
            await db.Players.Where(p => p.Pid == "9303")
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.Ev, 99000), cancellationToken: TestContext.Current.CancellationToken);
        }

        await RunAsync(r => r.UpdatePlayerRanksAsync());

        var after = await ReadPlayerVersionsAsync();

        // Guarding on IS DISTINCT FROM must not stop real rank changes from being written.
        after.Keys.ShouldBe(before.Keys, ignoreOrder: true);
        foreach (var key in before.Keys)
            after[key].ShouldNotBe(before[key]);

        using var verifyScope = _fixture.Factory.Services.CreateScope();
        var repository = verifyScope.ServiceProvider.GetRequiredService<IPlayerRepository>();
        var promoted = await repository.GetByPidAsync("9303");
        promoted!.Rank.ShouldBe(1);
    }

    [Fact]
    public async Task UpdatePlayerVehicleRanksAsync_DoesNotRewriteRowsWhoseVehicleRankIsUnchanged()
    {
        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
            await db.Players.Where(p => TestPids.Contains(p.Pid))
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.VehiclePreference, VehicleType.Kart), cancellationToken: TestContext.Current.CancellationToken);
        }

        await RunAsync(r => r.UpdatePlayerVehicleRanksAsync());

        var before = await ReadPlayerVersionsAsync();

        await RunAsync(r => r.UpdatePlayerVehicleRanksAsync());

        var after = await ReadPlayerVersionsAsync();

        after.ShouldBe(before);
    }

    private async Task RunAsync(Func<IPlayerRepository, Task> action)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        await action(scope.ServiceProvider.GetRequiredService<IPlayerRepository>());
    }

    private async Task<Dictionary<long, string>> ReadPlayerVersionsAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var ids = await db.Players.AsNoTracking()
            .Where(p => TestPids.Contains(p.Pid))
            .Select(p => (long)p.Id)
            .ToListAsync(TestContext.Current.CancellationToken);

        return await RowVersions.ReadAsync(db, "Players", "Id", ids, TestContext.Current.CancellationToken);
    }

    private static PlayerEntity NewPlayer(string pid, string name, int ev) => new()
    {
        Pid = pid,
        Name = name,
        Fc = $"0000-0000-{pid}",
        Ev = ev,
        Rank = 0,
        MiiData = "",
        LastSeen = DateTime.UtcNow,
        LastUpdated = DateTime.UtcNow,
        IsSuspicious = false,
        SuspiciousVRJumps = 0,
        VRGainLast24Hours = 0,
        VRGainLastWeek = 0,
        VRGainLastMonth = 0
    };
}
