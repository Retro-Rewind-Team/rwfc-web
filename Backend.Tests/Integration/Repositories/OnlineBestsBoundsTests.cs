using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.RaceResult;
using RetroRewindWebsite.Models.Entities.TimeTrial;
using RetroRewindWebsite.Repositories.RaceResult;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using Xunit;

/// <summary>
/// The floor and cap in GetTrackOnlineBestsAsync are the only thing standing between implausible
/// race data from the external reporting API and what players see. They had no tests, and the
/// standalone Online Bests page was taken offline because nonsense times were getting through.
/// These pin what the rules actually do, including where they do nothing at all.
/// </summary>
namespace RetroRewindWebsite.Tests.Integration.Repositories;

[Collection("Integration")]
[Trait("Category", "Integration")]
public class OnlineBestsBoundsTests : IAsyncLifetime
{
    private const short CourseWithBkt = 30101;
    private const short CourseWithoutBkt = 30102;
    private const short Engine150 = 2;
    private const string RoomId = "ob-bounds";

    // The ghost that sets the best known time, so the floor is 100s - 2s = 98s.
    private const int BktMs = 100_000;

    private readonly DatabaseFixture _fixture;
    private int _trackId;

    public OnlineBestsBoundsTests(DatabaseFixture fixture) => _fixture = fixture;

    public async ValueTask InitializeAsync()
    {
        await ClearAsync();

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var track = new TrackEntity
        {
            CourseId = CourseWithBkt,
            Name = "Bounds Track",
            Category = "custom",
            Laps = 3,
        };
        var profile = new TTProfileEntity { DisplayName = "bounds-ghost-owner", CountryCode = 0 };
        db.Tracks.Add(track);
        db.TTProfiles.Add(profile);
        await db.SaveChangesAsync();

        _trackId = track.Id;

        db.GhostSubmissions.Add(new GhostSubmissionEntity
        {
            TrackId = track.Id,
            TTProfileId = profile.Id,
            CC = 150,
            Glitch = false,
            Shroomless = false,
            IsFlap = false,
            FinishTimeMs = BktMs,
            FinishTimeDisplay = "1:40.000",
            MiiName = "Ghost",
            VehicleId = 1,
            CharacterId = 1,
            LapCount = 3,
            DateSet = DateOnly.FromDateTime(DateTime.UtcNow),
            SubmittedAt = DateTime.UtcNow,
        });

        await db.SaveChangesAsync();
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        await ClearAsync();
    }

    [Fact]
    public async Task ExcludesATimeFasterThanTheBestKnownTimeMinusTwoSeconds()
    {
        // 97s is below the 98s floor: nobody beats a time trial ghost by more than two seconds in
        // an online race, so this is bad data rather than a record.
        await AddRacesAsync(CourseWithBkt, (profileId: 1, seconds: 97f));

        var (rows, total, _) = await QueryAsync(CourseWithBkt, Engine150);

        rows.ShouldBeEmpty();
        total.ShouldBe(0);
    }

    [Fact]
    public async Task IncludesATimeJustInsideTheFloor()
    {
        await AddRacesAsync(CourseWithBkt, (profileId: 2, seconds: 99f));

        var (rows, total, _) = await QueryAsync(CourseWithBkt, Engine150);

        total.ShouldBe(1);
        rows.ShouldHaveSingleItem().ProfileId.ShouldBe(2);
    }

    [Fact]
    public async Task ExcludesATimeLongerThanTheRaceTimer()
    {
        // Online races end after 5:30, so anything past 330s cannot have happened.
        await AddRacesAsync(CourseWithBkt, (profileId: 3, seconds: 331f));

        var (rows, _, _) = await QueryAsync(CourseWithBkt, Engine150);

        rows.ShouldBeEmpty();
    }

    [Fact]
    public async Task IncludesATimeJustInsideTheCap()
    {
        await AddRacesAsync(CourseWithBkt, (profileId: 4, seconds: 329f));

        var (rows, _, _) = await QueryAsync(CourseWithBkt, Engine150);

        rows.ShouldHaveSingleItem().ProfileId.ShouldBe(4);
    }

    [Fact]
    public async Task KeepsOnlyEachPlayersBestAndOrdersThemAscending()
    {
        await AddRacesAsync(
            CourseWithBkt,
            (profileId: 5, seconds: 120f),
            (profileId: 5, seconds: 110f),
            (profileId: 6, seconds: 105f));

        var (rows, total, average) = await QueryAsync(CourseWithBkt, Engine150);

        total.ShouldBe(2);
        rows.Select(r => r.ProfileId).ShouldBe([6, 5]);
        average!.Value.ShouldBe(107.5f, tolerance: 0.01);
    }

    [Fact]
    public async Task AppliesNoFloorAtAllWhenTheTrackHasNoGhostToCompareAgainst()
    {
        // Documents a real gap rather than asserting desirable behaviour. The floor comes from a
        // time trial ghost, so a track nobody has submitted a ghost for has a floor of zero and a
        // physically impossible one second lap is published as a record.
        await AddRacesAsync(CourseWithoutBkt, (profileId: 7, seconds: 1f));

        var (rows, _, _) = await QueryAsync(CourseWithoutBkt, Engine150);

        rows.ShouldHaveSingleItem().ProfileId.ShouldBe(7);
    }

    [Fact]
    public async Task AppliesNoFloorWhenNoEngineClassIsRequested()
    {
        // The same gap from the other direction: the floor is only computed for a specific cc, so
        // asking for all classes at once drops it entirely, even on a track that has a ghost.
        await AddRacesAsync(CourseWithBkt, (profileId: 8, seconds: 1f));

        var (rows, _, _) = await QueryAsync(CourseWithBkt, engineClassId: null);

        rows.ShouldHaveSingleItem().ProfileId.ShouldBe(8);
    }

    [Fact]
    public async Task IgnoresRacesNobodyFinished()
    {
        await AddRacesAsync(CourseWithBkt, (profileId: 9, seconds: 120f), finishPos: 0);

        var (rows, _, _) = await QueryAsync(CourseWithBkt, Engine150);

        rows.ShouldBeEmpty();
    }

    private async Task<(
        List<(long ProfileId, int FinishTime, DateTime AchievedAt, string Rk)> Rows,
        int TotalCount,
        float? AverageBestSeconds)> QueryAsync(short courseId, short? engineClassId)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRaceStatsRepository>();
        return await repository.GetTrackOnlineBestsAsync(courseId, engineClassId, page: 1, pageSize: 25);
    }

    private async Task AddRacesAsync(
        short courseId,
        params (long profileId, float seconds)[] races)
        => await AddRacesAsync(courseId, finishPos: 1, races);

    private async Task AddRacesAsync(
        short courseId,
        (long profileId, float seconds) race,
        short finishPos)
        => await AddRacesAsync(courseId, finishPos, race);

    private async Task AddRacesAsync(
        short courseId,
        short finishPos,
        params (long profileId, float seconds)[] races)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var raceNumber = 1;
        foreach (var (profileId, seconds) in races)
        {
            db.RaceResults.Add(new RaceResultEntity
            {
                RoomId = RoomId,
                RaceNumber = raceNumber++,
                RaceTimestamp = new DateTime(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc),
                ProfileId = profileId,
                PlayerId = 0,
                // FinishTime stores the IEEE 754 bit pattern of the time in seconds.
                FinishTime = BitConverter.SingleToInt32Bits(seconds),
                CharacterId = 0,
                VehicleId = 0,
                PlayerCount = 12,
                FinishPos = finishPos,
                FramesIn1st = 0,
                CourseId = courseId,
                EngineClassId = Engine150,
                IsPublic = true,
                Rk = "vs_10",
            });
        }

        await db.SaveChangesAsync();
    }

    private async Task ClearAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        await db.RaceResults.Where(r => r.RoomId == RoomId).ExecuteDeleteAsync();

        var trackIds = await db.Tracks
            .Where(t => t.CourseId == CourseWithBkt || t.CourseId == CourseWithoutBkt)
            .Select(t => t.Id)
            .ToListAsync();

        if (trackIds.Count > 0)
        {
            await db.GhostSubmissions.Where(g => trackIds.Contains(g.TrackId)).ExecuteDeleteAsync();
        }

        await db.TTProfiles.Where(p => p.DisplayName == "bounds-ghost-owner").ExecuteDeleteAsync();
        await db.Tracks
            .Where(t => t.CourseId == CourseWithBkt || t.CourseId == CourseWithoutBkt)
            .ExecuteDeleteAsync();
    }
}
