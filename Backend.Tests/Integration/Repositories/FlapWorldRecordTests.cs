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
/// A flap record is the fastest single lap, not the fastest total time, and the two are
/// independent: a run can contain the best lap on the track and still finish slower overall.
/// The seeded data below crosses them deliberately so any place that ranks flap submissions by
/// finish time credits the wrong profile and fails.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class FlapWorldRecordTests : IAsyncLifetime
{
    private const short CourseId = 942;

    private readonly DatabaseFixture _fixture;

    private int _trackId;
    private int _fastestLapProfileId;
    private int _fastestTotalProfileId;

    public FlapWorldRecordTests(DatabaseFixture fixture) => _fixture = fixture;

    public async ValueTask InitializeAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var track = new TrackEntity
        {
            Name = "Flap Test Track",
            CourseId = CourseId,
            Category = "custom",
            Laps = 3,
            SortOrder = 9997
        };
        db.Tracks.Add(track);

        var fastestLap = new TTProfileEntity { DisplayName = "flap-fastest-lap" };
        var fastestTotal = new TTProfileEntity { DisplayName = "flap-fastest-total" };
        db.TTProfiles.AddRange(fastestLap, fastestTotal);
        await db.SaveChangesAsync();

        _trackId = track.Id;
        _fastestLapProfileId = fastestLap.Id;
        _fastestTotalProfileId = fastestTotal.Id;

        db.GhostSubmissions.AddRange(
            // Best lap on the track (25.000) inside the slower overall run.
            Flap(_fastestLapProfileId, finishTimeMs: 100_000, laps: [25_000, 40_000, 35_000]),
            // Best total time (90.000) but no lap quicker than 30.000.
            Flap(_fastestTotalProfileId, finishTimeMs: 90_000, laps: [30_000, 30_000, 30_000]));

        await db.SaveChangesAsync();
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.GhostSubmissions.Where(g => g.TrackId == _trackId).ExecuteDeleteAsync();
        await db.TTProfiles.Where(p => p.Id == _fastestLapProfileId || p.Id == _fastestTotalProfileId).ExecuteDeleteAsync();
        await db.Tracks.Where(t => t.Id == _trackId).ExecuteDeleteAsync();
    }

    [Fact]
    public async Task FlapHistoryRanksByFastestLap()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IGhostSubmissionRepository>();

        var history = await repository.GetFlapWorldRecordHistoryAsync(_trackId, 150, glitchAllowed: true);

        // The standing flap record is the last entry in the progression.
        history.ShouldNotBeEmpty();
        history[^1].TTProfileId.ShouldBe(_fastestLapProfileId);
    }

    [Fact]
    public async Task WorldRecordCountCreditsTheFastestLapNotTheFastestTotalTime()
    {
        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var repository = scope.ServiceProvider.GetRequiredService<IGhostSubmissionRepository>();
            await repository.UpdateWorldRecordCountsAsync();
        }

        // Must agree with the history view above: the flap record belongs to the fastest lap.
        (await ReadAsync(_fastestLapProfileId)).CurrentWorldRecords.ShouldBe(1);
        (await ReadAsync(_fastestTotalProfileId)).CurrentWorldRecords.ShouldBe(0);
    }

    private async Task<TTProfileEntity> ReadAsync(int profileId)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        return await db.TTProfiles.AsNoTracking()
            .SingleAsync(p => p.Id == profileId, TestContext.Current.CancellationToken);
    }

    private GhostSubmissionEntity Flap(int profileId, int finishTimeMs, List<int> laps) => new()
    {
        TrackId = _trackId,
        TTProfileId = profileId,
        CC = 150,
        FinishTimeMs = finishTimeMs,
        FinishTimeDisplay = "1:30.000",
        MiiName = "flap",
        LapCount = (short)laps.Count,
        LapSplitsMs = laps,
        VehicleId = 0,
        Shroomless = false,
        Glitch = false,
        IsFlap = true,
        DateSet = new DateOnly(2026, 6, 1)
    };
}
