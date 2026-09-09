using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Models.Entities.Player;
using RetroRewindWebsite.Models.Entities.RaceResult;
using RetroRewindWebsite.Services.Application;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Services;

/// <summary>
/// Covers <see cref="IPlayerModerationService.SwapPlayerStatsAsync"/>, which moves VR history
/// and race results between two players. Players are seeded per test; race results are added
/// only by the tests that need them so each failure mode is isolated.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class PlayerStatSwapTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;

    private const string SourcePid = "9101";
    private const string TargetPid = "9102";
    private const long SourceProfileId = 9101;
    private const long TargetProfileId = 9102;
    private const string SourceFc = "0000-0000-9101";
    private const string TargetFc = "0000-0000-9102";

    private static readonly string[] TestPids = [SourcePid, TargetPid, "swap-nan-a", "swap-nan-b"];

    public PlayerStatSwapTests(DatabaseFixture fixture) => _fixture = fixture;

    public async ValueTask InitializeAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        // The source carries moderation state and the target is clean, so a swap that only
        // moved VR would be indistinguishable from one that moved the flags too.
        var source = NewPlayer(SourcePid, "SwapSource", SourceFc, ev: 5000);
        source.IsSuspicious = true;
        source.SuspiciousVRJumps = 3;
        source.FlagReason = "seeded flag reason";
        source.UnflagReason = "seeded unflag reason";
        source.IsBanned = true;
        source.VRGainLast24Hours = 250;
        source.VRGainLastWeek = 900;
        source.VRGainLastMonth = 1800;

        db.Players.AddRange(
            source,
            NewPlayer(TargetPid, "SwapTarget", TargetFc, ev: 1000),
            NewPlayer("swap-nan-a", "NonNumericA", "0000-0000-8001", ev: 100),
            NewPlayer("swap-nan-b", "NonNumericB", "0000-0000-8002", ev: 200));

        // Source owns two history rows, target owns one. The counts differ so a merge
        // onto one side is distinguishable from a correct swap.
        db.VRHistories.AddRange(
            NewHistory(SourcePid, SourceFc, totalVr: 5000),
            NewHistory(SourcePid, SourceFc, totalVr: 4500),
            NewHistory(TargetPid, TargetFc, totalVr: 1000));

        await db.SaveChangesAsync();
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        await db.RaceResults
            .Where(r => r.ProfileId == SourceProfileId || r.ProfileId == TargetProfileId)
            .ExecuteDeleteAsync();
        await db.VRHistories.Where(v => TestPids.Contains(v.PlayerId)).ExecuteDeleteAsync();
        await db.Players.Where(p => TestPids.Contains(p.Pid)).ExecuteDeleteAsync();
    }

    [Fact]
    public async Task SwapPlayerStatsAsync_MovesVRHistoryToTheOtherPlayer_WithoutMerging()
    {
        var result = await SwapAsync(SourcePid, TargetPid);
        result.ShouldNotBeNull();

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var sourceHistory = await db.VRHistories.AsNoTracking()
            .Where(v => v.PlayerId == SourcePid).ToListAsync(cancellationToken: TestContext.Current.CancellationToken);
        var targetHistory = await db.VRHistories.AsNoTracking()
            .Where(v => v.PlayerId == TargetPid).ToListAsync(cancellationToken: TestContext.Current.CancellationToken);

        // Source had two rows and target one, so after the swap those counts invert.
        sourceHistory.Count.ShouldBe(1);
        targetHistory.Count.ShouldBe(2);

        sourceHistory.Select(v => v.TotalVR).ShouldBe([1000]);
        targetHistory.Select(v => v.TotalVR).Order().ShouldBe([4500, 5000]);

        // The denormalised friend code follows the new owner.
        sourceHistory.ShouldAllBe(v => v.Fc == SourceFc);
        targetHistory.ShouldAllBe(v => v.Fc == TargetFc);
    }

    [Fact]
    public async Task SwapPlayerStatsAsync_SwapsRaceResults_WhenBothPlayersRacedTheSameRace()
    {
        await AddRaceResultsAsync(
            NewRaceResult(SourceProfileId, "swp-src", raceNumber: 1),
            NewRaceResult(SourceProfileId, "swp-shared", raceNumber: 1),
            NewRaceResult(TargetProfileId, "swp-shared", raceNumber: 1));

        var result = await SwapAsync(SourcePid, TargetPid);
        result.ShouldNotBeNull();

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var sourceRooms = await db.RaceResults.AsNoTracking()
            .Where(r => r.ProfileId == SourceProfileId)
            .Select(r => r.RoomId).ToListAsync(cancellationToken: TestContext.Current.CancellationToken);
        var targetRooms = await db.RaceResults.AsNoTracking()
            .Where(r => r.ProfileId == TargetProfileId)
            .Select(r => r.RoomId).ToListAsync(cancellationToken: TestContext.Current.CancellationToken);

        // Source raced swp-src and swp-shared; target raced only swp-shared. After the
        // swap the source holds the target's single row and the target holds both of the
        // source's, including the one they shared a race in.
        sourceRooms.Order().ShouldBe(["swp-shared"]);
        targetRooms.Order().ShouldBe(["swp-shared", "swp-src"]);
    }

    [Fact]
    public async Task SwapPlayerStatsAsync_LeavesRaceResultCoopMarkerAtZero()
    {
        await AddRaceResultsAsync(
            NewRaceResult(SourceProfileId, "swp-src", raceNumber: 1),
            NewRaceResult(TargetProfileId, "swp-tgt", raceNumber: 1));

        var result = await SwapAsync(SourcePid, TargetPid);
        result.ShouldNotBeNull();

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var moved = await db.RaceResults.AsNoTracking()
            .Where(r => r.ProfileId == SourceProfileId || r.ProfileId == TargetProfileId)
            .ToListAsync(cancellationToken: TestContext.Current.CancellationToken);

        moved.Count.ShouldBe(2);

        // RaceResults.PlayerId is the co-op slot marker (0 = the online racer), not a foreign
        // key to Players.Id. Every stats query filters on PlayerId == 0, so writing anything
        // else here hides the rows from all statistics.
        moved.ShouldAllBe(r => r.PlayerId == 0);
    }

    [Fact]
    public async Task SwapPlayerStatsAsync_SwapsPlayerColumns()
    {
        var result = await SwapAsync(SourcePid, TargetPid);
        result.ShouldNotBeNull();
        result.Success.ShouldBeTrue();

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var source = await db.Players.AsNoTracking().SingleAsync(p => p.Pid == SourcePid, cancellationToken: TestContext.Current.CancellationToken);
        var target = await db.Players.AsNoTracking().SingleAsync(p => p.Pid == TargetPid, cancellationToken: TestContext.Current.CancellationToken);

        source.Ev.ShouldBe(1000);
        target.Ev.ShouldBe(5000);

        // Moderation state moves with the stats: the source was flagged and banned, the
        // target was clean, so after the swap that is reversed.
        source.IsSuspicious.ShouldBeFalse();
        source.SuspiciousVRJumps.ShouldBe(0);
        // FlagReason/UnflagReason are non-nullable and default to string.Empty, so the clean
        // target's empty reasons are what land on the source.
        source.FlagReason.ShouldBeEmpty();
        source.UnflagReason.ShouldBeEmpty();
        source.IsBanned.ShouldBeFalse();

        target.IsSuspicious.ShouldBeTrue();
        target.SuspiciousVRJumps.ShouldBe(3);
        target.FlagReason.ShouldBe("seeded flag reason");
        target.UnflagReason.ShouldBe("seeded unflag reason");
        target.IsBanned.ShouldBeTrue();

        // VR gain windows move too.
        source.VRGainLast24Hours.ShouldBe(0);
        target.VRGainLast24Hours.ShouldBe(250);
        target.VRGainLastWeek.ShouldBe(900);
        target.VRGainLastMonth.ShouldBe(1800);

        // Identity stays put; only the stats move.
        source.Name.ShouldBe("SwapSource");
        target.Name.ShouldBe("SwapTarget");
        source.Fc.ShouldBe(SourceFc);
        target.Fc.ShouldBe(TargetFc);
    }

    [Fact]
    public async Task SwapPlayerStatsAsync_ReportsFailure_WhenPidIsNotNumeric()
    {
        var result = await SwapAsync("swap-nan-a", "swap-nan-b");

        // Both players exist, so this is not a 404 case. A PID that is not a valid
        // ProfileId must be reported rather than throwing out of the service.
        result.ShouldNotBeNull();
        result.Success.ShouldBeFalse();

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        // Nothing was swapped.
        var a = await db.Players.AsNoTracking().SingleAsync(p => p.Pid == "swap-nan-a", cancellationToken: TestContext.Current.CancellationToken);
        var b = await db.Players.AsNoTracking().SingleAsync(p => p.Pid == "swap-nan-b", cancellationToken: TestContext.Current.CancellationToken);
        a.Ev.ShouldBe(100);
        b.Ev.ShouldBe(200);
    }

    private async Task<SwapResultDto?> SwapAsync(string sourcePid, string targetPid)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IPlayerModerationService>();
        return await service.SwapPlayerStatsAsync(sourcePid, targetPid, "integration test");
    }

    private async Task AddRaceResultsAsync(params RaceResultEntity[] results)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        db.RaceResults.AddRange(results);
        await db.SaveChangesAsync();
    }

    private static PlayerEntity NewPlayer(string pid, string name, string fc, int ev) => new()
    {
        Pid = pid,
        Name = name,
        Fc = fc,
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

    private static VRHistoryEntity NewHistory(string pid, string fc, int totalVr) => new()
    {
        PlayerId = pid,
        Fc = fc,
        Date = DateTime.UtcNow,
        VRChange = 0,
        TotalVR = totalVr
    };

    private static RaceResultEntity NewRaceResult(long profileId, string roomId, int raceNumber) => new()
    {
        RoomId = roomId,
        RaceNumber = raceNumber,
        RaceTimestamp = DateTime.UtcNow,
        ProfileId = profileId,
        PlayerId = 0,
        FinishTime = 0,
        CharacterId = 0,
        VehicleId = 0,
        PlayerCount = 2,
        FinishPos = 1,
        FramesIn1st = 0,
        CourseId = 1,
        EngineClassId = 1
    };
}
