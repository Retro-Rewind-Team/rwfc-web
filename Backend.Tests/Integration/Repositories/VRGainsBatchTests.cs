using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.Player;
using RetroRewindWebsite.Repositories.Player;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Repositories;

/// <summary>
/// The sync recalculates VR gains for every player whose VR moved on a tick, which was one
/// round-trip each. These lock the batched replacement to the behaviour of the per-player version
/// it replaces, since the two now have to agree.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class VRGainsBatchTests : IAsyncLifetime
{
    private const string PidA = "gain-batch-a";
    private const string PidB = "gain-batch-b";
    private const string PidSilent = "gain-batch-silent";

    private readonly DatabaseFixture _fixture;

    public VRGainsBatchTests(DatabaseFixture fixture) => _fixture = fixture;

    public async ValueTask InitializeAsync()
    {
        await ClearAsync();

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        var now = DateTime.UtcNow;

        // The VRHistories foreign key is RESTRICT, so the players have to exist before their
        // history does. PidSilent gets a row and no history on purpose.
        db.Players.AddRange(Player(PidA), Player(PidB), Player(PidSilent));
        await db.SaveChangesAsync();

        db.VRHistories.AddRange(
            // Player A: one entry inside each window, so the three totals differ.
            History(PidA, now.AddHours(-2), 100),
            History(PidA, now.AddDays(-3), 30),
            History(PidA, now.AddDays(-20), 7),
            // Outside 30 days: must not appear in any total.
            History(PidA, now.AddDays(-40), 9999),
            // Player B: a loss, to prove sums are signed rather than counted.
            History(PidB, now.AddHours(-5), -50));

        await db.SaveChangesAsync();
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        await ClearAsync();
    }

    [Fact]
    public async Task SumsEachWindowSeparatelyAndExcludesAnythingOlderThanThirtyDays()
    {
        var gains = await BatchAsync(PidA);

        var a = gains[PidA];
        a.Gain24h.ShouldBe(100);
        a.Gain7d.ShouldBe(130);
        a.Gain30d.ShouldBe(137);
    }

    [Fact]
    public async Task KeepsLossesNegative()
    {
        var gains = await BatchAsync(PidB);

        gains[PidB].ShouldBe((-50, -50, -50));
    }

    [Fact]
    public async Task AgreesWithThePerPlayerCalculationItReplaces()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IVRHistoryRepository>();

        var single = await repository.CalculateAllVRGainsAsync(PidA);
        var batched = (await repository.CalculateVRGainsBatchAsync([PidA]))[PidA];

        batched.ShouldBe(single);
    }

    [Fact]
    public async Task SeparatesPlayersInsteadOfPoolingThem()
    {
        var gains = await BatchAsync(PidA, PidB);

        gains[PidA].Gain30d.ShouldBe(137);
        gains[PidB].Gain30d.ShouldBe(-50);
    }

    [Fact]
    public async Task OmitsAPlayerWithNoHistoryInTheWindowRatherThanReturningZero()
    {
        // The caller treats a miss as a real zero; this pins that it is a miss, not a zero row.
        var gains = await BatchAsync(PidSilent);

        gains.ShouldNotContainKey(PidSilent);
    }

    [Fact]
    public async Task AnEmptyRequestDoesNotQuery()
    {
        (await BatchAsync()).ShouldBeEmpty();
    }

    private async Task<Dictionary<string, (int Gain24h, int Gain7d, int Gain30d)>> BatchAsync(
        params string[] pids)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IVRHistoryRepository>();
        return await repository.CalculateVRGainsBatchAsync(pids);
    }

    private async Task ClearAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        // History first: the foreign key refuses to let a player go while its history is there,
        // which is the whole point of the RESTRICT added alongside this work.
        await db.VRHistories
            .Where(v => v.PlayerId == PidA || v.PlayerId == PidB || v.PlayerId == PidSilent)
            .ExecuteDeleteAsync();

        await db.Players
            .Where(p => p.Pid == PidA || p.Pid == PidB || p.Pid == PidSilent)
            .ExecuteDeleteAsync();
    }

    private static PlayerEntity Player(string pid) => new()
    {
        Pid = pid,
        Name = pid,
        Fc = "0000-0000-0000",
        Ev = 5000,
        Rank = 1,
        MiiData = "",
        LastSeen = DateTime.UtcNow,
        LastUpdated = DateTime.UtcNow,
        IsSuspicious = false,
        SuspiciousVRJumps = 0,
        VRGainLast24Hours = 0,
        VRGainLastWeek = 0,
        VRGainLastMonth = 0
    };

    private static VRHistoryEntity History(string pid, DateTime date, int change) => new()
    {
        PlayerId = pid,
        Fc = "0000-0000-0000",
        Date = date,
        VRChange = change,
        TotalVR = 5000
    };
}
