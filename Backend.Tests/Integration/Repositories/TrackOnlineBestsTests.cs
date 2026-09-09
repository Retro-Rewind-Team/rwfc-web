using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.RaceResult;
using RetroRewindWebsite.Models.Entities.TimeTrial;
using RetroRewindWebsite.Repositories.RaceResult;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Repositories;

/// <summary>
/// Characterises the online-bests rules: one entry per player at their best valid time, ordered
/// ascending, with times outside the plausible range dropped. <c>FinishTime</c> stores the IEEE 754
/// bit pattern of a float in seconds, which is why every seeded time goes through
/// <see cref="BitConverter.SingleToInt32Bits"/>.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class TrackOnlineBestsTests : IAsyncLifetime
{
    private const short CourseId = 940;
    private const short EngineClass150 = 2;
    private const string Room = "obr-1";

    private readonly DatabaseFixture _fixture;

    public TrackOnlineBestsTests(DatabaseFixture fixture) => _fixture = fixture;

    public async ValueTask InitializeAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var raceNumber = 0;
        RaceResultEntity Race(long profileId, float seconds) => new()
        {
            RoomId = Room,
            RaceNumber = ++raceNumber,
            RaceTimestamp = new DateTime(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc),
            ProfileId = profileId,
            PlayerId = 0,
            FinishTime = BitConverter.SingleToInt32Bits(seconds),
            CharacterId = 0,
            VehicleId = 0,
            PlayerCount = 4,
            FinishPos = 1,
            FramesIn1st = 0,
            CourseId = CourseId,
            EngineClassId = EngineClass150,
            IsPublic = true,
            Rk = "vs_10"
        };

        db.RaceResults.AddRange(
            Race(9501, 105.0f),          // best valid time for 9501
            Race(9501, 140.0f),          // slower, must not win over the above
            Race(9502, 99.0f),           // fastest overall
            Race(9503, 400.0f),          // above the 330s cap, player drops out entirely
            Race(9504, 120.0f),
            Race(9504, 110.0f));         // best valid time for 9504

        await db.SaveChangesAsync();
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.RaceResults.Where(r => r.RoomId == Room).ExecuteDeleteAsync();
        await db.GhostSubmissions.Where(g => g.MiiName == "obr-ghost").ExecuteDeleteAsync();
        await db.Tracks.Where(t => t.CourseId == CourseId).ExecuteDeleteAsync();
        await db.TTProfiles.Where(p => p.DisplayName == "obr-profile").ExecuteDeleteAsync();
    }

    [Fact]
    public async Task ReturnsOneEntryPerPlayerAtTheirBestTime_OrderedAscending()
    {
        var (rows, totalCount, avgSeconds) = await QueryAsync(page: 1, pageSize: 20);

        // 9503 is over the cap and drops out; the other three appear once each.
        totalCount.ShouldBe(3);
        rows.Select(r => r.ProfileId).ShouldBe([9502L, 9501L, 9504L]);
        rows.Select(r => Seconds(r.FinishTime)).ShouldBe([99.0f, 105.0f, 110.0f]);

        // Average of the per-player bests, not of every race.
        avgSeconds!.Value.ShouldBe((99.0f + 105.0f + 110.0f) / 3, tolerance: 0.01f);
    }

    [Fact]
    public async Task PagesWithoutChangingTheTotalOrTheAverage()
    {
        var (firstPage, totalCount, avgSeconds) = await QueryAsync(page: 1, pageSize: 2);
        firstPage.Select(r => r.ProfileId).ShouldBe([9502L, 9501L]);
        totalCount.ShouldBe(3);

        var (secondPage, secondTotal, secondAvg) = await QueryAsync(page: 2, pageSize: 2);
        secondPage.Select(r => r.ProfileId).ShouldBe([9504L]);

        // Total and average describe the whole result set, not the page.
        secondTotal.ShouldBe(3);
        secondAvg!.Value.ShouldBe(avgSeconds!.Value, tolerance: 0.001f);
    }

    [Fact]
    public async Task DropsTimesBelowTheWorldRecordFloorButKeepsThePlayersNextBest()
    {
        // A 150cc world record of 100s puts the floor at 98s. 9502's 99.0s survives; give 9501 a
        // 97.0s that must be rejected as impossible, leaving their 105.0s standing.
        await SeedWorldRecordAsync(finishTimeMs: 100_000);
        await AddRaceAsync(9501, 97.0f);

        var (rows, totalCount, _) = await QueryAsync(page: 1, pageSize: 20, engineClassId: EngineClass150);

        totalCount.ShouldBe(3);
        rows.Select(r => r.ProfileId).ShouldBe([9502L, 9501L, 9504L]);

        // The sub-floor time is discarded rather than becoming this player's best.
        Seconds(rows.Single(r => r.ProfileId == 9501).FinishTime).ShouldBe(105.0f, tolerance: 0.01f);
    }

    private async Task<(List<(long ProfileId, int FinishTime, DateTime AchievedAt, string Rk)> Rows, int TotalCount, float? AverageBestSeconds)>
        QueryAsync(int page, int pageSize, short? engineClassId = null)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRaceStatsRepository>();
        return await repository.GetTrackOnlineBestsAsync(CourseId, engineClassId, page, pageSize);
    }

    private async Task AddRaceAsync(long profileId, float seconds)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var nextRaceNumber = await db.RaceResults.Where(r => r.RoomId == Room)
            .MaxAsync(r => (int?)r.RaceNumber, TestContext.Current.CancellationToken) ?? 0;

        db.RaceResults.Add(new RaceResultEntity
        {
            RoomId = Room,
            RaceNumber = nextRaceNumber + 1,
            RaceTimestamp = new DateTime(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc),
            ProfileId = profileId,
            PlayerId = 0,
            FinishTime = BitConverter.SingleToInt32Bits(seconds),
            CharacterId = 0,
            VehicleId = 0,
            PlayerCount = 4,
            FinishPos = 1,
            FramesIn1st = 0,
            CourseId = CourseId,
            EngineClassId = EngineClass150,
            IsPublic = true,
            Rk = "vs_10"
        });

        await db.SaveChangesAsync();
    }

    private async Task SeedWorldRecordAsync(int finishTimeMs)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var track = new TrackEntity
        {
            Name = "Online Bests Test Track",
            CourseId = CourseId,
            Category = "custom",
            Laps = 3,
            SortOrder = 9999
        };
        db.Tracks.Add(track);

        var profile = new TTProfileEntity { DisplayName = "obr-profile" };
        db.TTProfiles.Add(profile);
        await db.SaveChangesAsync();

        db.GhostSubmissions.Add(new GhostSubmissionEntity
        {
            TrackId = track.Id,
            TTProfileId = profile.Id,
            CC = 150,
            FinishTimeMs = finishTimeMs,
            FinishTimeDisplay = "1:40.000",
            MiiName = "obr-ghost",
            LapCount = 3,
            LapSplitsMs = [33_000, 33_000, 34_000],
            Shroomless = false,
            Glitch = false,
            DateSet = new DateOnly(2026, 6, 1)
        });

        await db.SaveChangesAsync();
    }

    private static float Seconds(int finishTime) => BitConverter.Int32BitsToSingle(finishTime);
}
