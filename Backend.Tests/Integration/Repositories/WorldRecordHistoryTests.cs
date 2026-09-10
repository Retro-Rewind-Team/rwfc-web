using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.TimeTrial;
using RetroRewindWebsite.Repositories.TimeTrial;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Repositories;

/// <summary>
/// The world-record progression is raw SQL with window functions, so nothing about it is checked
/// by the compiler. It must return only the submissions that actually took the record, in the
/// order they took it -- a slower run that happened later is not part of the history.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class WorldRecordHistoryTests : IAsyncLifetime
{
    private const short CourseId = 944;
    private const short Cc = 150;

    private readonly DatabaseFixture _fixture;

    private int _trackId;
    private int _profileId;

    public WorldRecordHistoryTests(DatabaseFixture fixture) => _fixture = fixture;

    public async ValueTask InitializeAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var track = new TrackEntity
        {
            Name = "WR History Test Track",
            CourseId = CourseId,
            Category = "custom",
            Laps = 3,
            SupportsGlitch = true,
            SortOrder = 9995
        };
        db.Tracks.Add(track);

        var profile = new TTProfileEntity { DisplayName = "wrh-history" };
        db.TTProfiles.Add(profile);
        await db.SaveChangesAsync();

        _trackId = track.Id;
        _profileId = profile.Id;
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.GhostSubmissions.Where(g => g.TrackId == _trackId).ExecuteDeleteAsync();
        await db.TTProfiles.Where(p => p.Id == _profileId).ExecuteDeleteAsync();
        await db.Tracks.Where(t => t.Id == _trackId).ExecuteDeleteAsync();
    }

    [Fact]
    public async Task ReturnsOnlyTheSubmissionsThatTookTheRecord()
    {
        await SeedAsync(day: 1, finishTimeMs: 100_000);
        // Slower than the standing record, so it never held it.
        await SeedAsync(day: 2, finishTimeMs: 105_000);
        await SeedAsync(day: 3, finishTimeMs: 95_000);
        await SeedAsync(day: 4, finishTimeMs: 96_000);
        await SeedAsync(day: 5, finishTimeMs: 90_000);

        var history = await QueryAsync();

        history.Select(h => h.FinishTimeMs).ShouldBe([100_000, 95_000, 90_000]);
    }

    [Fact]
    public async Task OrdersOldestFirstSoTheProgressionReadsForward()
    {
        await SeedAsync(day: 1, finishTimeMs: 100_000);
        await SeedAsync(day: 2, finishTimeMs: 90_000);
        await SeedAsync(day: 3, finishTimeMs: 80_000);

        var history = await QueryAsync();

        history.Select(h => h.DateSet).ShouldBeInOrder();
        history.First().FinishTimeMs.ShouldBe(100_000);
        history.Last().FinishTimeMs.ShouldBe(80_000);
    }

    [Fact]
    public async Task TheFirstSubmissionIsAlwaysARecord()
    {
        await SeedAsync(day: 1, finishTimeMs: 120_000);

        var history = await QueryAsync();

        history.ShouldHaveSingleItem().FinishTimeMs.ShouldBe(120_000);
    }

    [Fact]
    public async Task ExcludesGlitchRunsWhenGlitchIsNotAllowed()
    {
        await SeedAsync(day: 1, finishTimeMs: 100_000);
        // Faster, but a glitch run: invisible on the non-glitch leaderboard.
        await SeedAsync(day: 2, finishTimeMs: 80_000, glitch: true);

        var history = await QueryAsync(glitchAllowed: false);

        history.Select(h => h.FinishTimeMs).ShouldBe([100_000]);
    }

    [Fact]
    public async Task IncludesGlitchRunsWhenGlitchIsAllowed()
    {
        await SeedAsync(day: 1, finishTimeMs: 100_000);
        await SeedAsync(day: 2, finishTimeMs: 80_000, glitch: true);

        var history = await QueryAsync(glitchAllowed: true);

        history.Select(h => h.FinishTimeMs).ShouldBe([100_000, 80_000]);
    }

    [Fact]
    public async Task ExcludesFlapSubmissionsEntirely()
    {
        await SeedAsync(day: 1, finishTimeMs: 100_000);
        // Flap is a separate category and has its own history query.
        await SeedAsync(day: 2, finishTimeMs: 70_000, isFlap: true);

        var history = await QueryAsync();

        history.Select(h => h.FinishTimeMs).ShouldBe([100_000]);
    }

    [Fact]
    public async Task ReturnsNothingForATrackWithNoSubmissions()
    {
        (await QueryAsync()).ShouldBeEmpty();
    }

    private async Task<List<GhostSubmissionEntity>> QueryAsync(bool glitchAllowed = true)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IGhostSubmissionRepository>();
        return await repository.GetWorldRecordHistoryAsync(_trackId, Cc, glitchAllowed);
    }

    private async Task SeedAsync(int day, int finishTimeMs, bool glitch = false, bool isFlap = false)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        db.GhostSubmissions.Add(new GhostSubmissionEntity
        {
            TrackId = _trackId,
            TTProfileId = _profileId,
            CC = Cc,
            FinishTimeMs = finishTimeMs,
            FinishTimeDisplay = "1:30.000",
            MiiName = "wrh",
            LapCount = 3,
            LapSplitsMs = [30_000, 30_000, 30_000],
            VehicleId = 0,
            Shroomless = false,
            Glitch = glitch,
            IsFlap = isFlap,
            DateSet = new DateOnly(2026, 6, day),
            SubmittedAt = new DateTime(2026, 6, day, 12, 0, 0, DateTimeKind.Utc)
        });

        await db.SaveChangesAsync();
    }
}
