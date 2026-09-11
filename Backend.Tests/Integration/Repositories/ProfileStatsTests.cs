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
/// GetProfileStatsAsync replaced five separate queries, two of which ranked every non-flap
/// submission in the table before filtering down to one profile. These pin the numbers it has to
/// produce, in particular that narrowing the ranking to the partitions a profile competes in
/// leaves that profile's positions untouched.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class ProfileStatsTests : IAsyncLifetime
{
    private const string ProfileName = "stats-subject";
    private const string RivalName = "stats-rival";
    private const string ElsewhereName = "stats-elsewhere";

    // CourseId is a short. These identify the rows to clean up; submissions reference Track.Id.
    private const short CourseA = 30001;
    private const short CourseB = 30002;
    private const short CourseUnrelated = 30003;

    private readonly DatabaseFixture _fixture;

    private int _profileId;
    private int _elsewhereId;
    private int _trackA;
    private int _trackB;
    private int _trackUnrelated;

    public ProfileStatsTests(DatabaseFixture fixture) => _fixture = fixture;

    public async ValueTask InitializeAsync()
    {
        await ClearAsync();

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var trackA = Track(CourseA);
        var trackB = Track(CourseB);
        var trackUnrelated = Track(CourseUnrelated);
        db.Tracks.AddRange(trackA, trackB, trackUnrelated);

        var profile = Profile(ProfileName);
        var rival = Profile(RivalName);
        var elsewhere = Profile(ElsewhereName);
        db.TTProfiles.AddRange(profile, rival, elsewhere);

        // Saved first because submissions reference the generated surrogate ids, not CourseId.
        await db.SaveChangesAsync();

        _profileId = profile.Id;
        _elsewhereId = elsewhere.Id;
        _trackA = trackA.Id;
        _trackB = trackB.Id;
        _trackUnrelated = trackUnrelated.Id;

        db.GhostSubmissions.AddRange(
            // Track A, 150cc: the subject is beaten by the rival, so it ranks 2nd.
            Submission(rival.Id, _trackA, cc: 150, timeMs: 90_000),
            Submission(_profileId, _trackA, cc: 150, timeMs: 95_000),
            // Track B, 200cc: the subject is fastest, so it ranks 1st.
            Submission(_profileId, _trackB, cc: 200, timeMs: 80_000),
            Submission(rival.Id, _trackB, cc: 200, timeMs: 85_000),
            // A partition the subject never entered. Narrowing the ranking must skip it without
            // changing anything above.
            Submission(_elsewhereId, _trackUnrelated, cc: 150, timeMs: 70_000),
            // Flap submissions are excluded from ranking but still count toward distinct tracks.
            Submission(_profileId, _trackUnrelated, cc: 150, timeMs: 99_000, isFlap: true));

        await db.SaveChangesAsync();
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        await ClearAsync();
    }

    [Fact]
    public async Task CountsDistinctTracksOverallAndPerEngineClass()
    {
        var stats = await StatsAsync();

        // A (150), B (200) and Unrelated (150, flap). Flap counts here: the queries this replaced
        // did not filter it out of the track counts either.
        stats.TotalTracks.ShouldBe(3);
        stats.Tracks150.ShouldBe(2);
        stats.Tracks200.ShouldBe(1);
    }

    [Fact]
    public async Task AveragesFinishPositionAcrossRankedSubmissionsOnly()
    {
        var stats = await StatsAsync();

        // 2nd on track A, 1st on track B. The flap submission is not ranked.
        stats.AverageFinishPosition.ShouldBe(1.5, tolerance: 0.0001);
    }

    [Fact]
    public async Task CountsTopTenFinishes()
    {
        var stats = await StatsAsync();

        stats.Top10Finishes.ShouldBe(2);
    }

    [Fact]
    public async Task NarrowingTheRankingLeavesPositionsIdenticalToRankingEverything()
    {
        // The guarantee the rewrite rests on: RANK() is partitioned by track, cc and glitch, so a
        // partition the profile never entered cannot affect its positions. This ranks the whole
        // table by hand and compares, rather than taking that on trust.
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var everything = await db.GhostSubmissions
            .AsNoTracking()
            .Where(g => !g.IsFlap)
            .Select(g => new { g.TTProfileId, g.TrackId, g.CC, g.Glitch, g.FinishTimeMs })
            .ToListAsync();

        var positions = everything
            .GroupBy(g => (g.TrackId, g.CC, g.Glitch))
            .SelectMany(grp => grp
                .OrderBy(g => g.FinishTimeMs)
                .Select((g, i) => (g.TTProfileId, Position: i + 1)))
            .Where(x => x.TTProfileId == _profileId)
            .Select(x => x.Position)
            .ToList();

        var stats = await StatsAsync();

        stats.AverageFinishPosition.ShouldBe(positions.Average(), tolerance: 0.0001);
        stats.Top10Finishes.ShouldBe(positions.Count(p => p <= 10));
    }

    [Fact]
    public async Task AProfileWithNoSubmissionsGetsZerosRatherThanNull()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IGhostSubmissionRepository>();

        var stats = await repository.GetProfileStatsAsync(_elsewhereId + 100_000);

        stats.ShouldBe(new TTProfileStatsRow(0, 0, 0, 0.0, 0));
    }

    private async Task<TTProfileStatsRow> StatsAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IGhostSubmissionRepository>();
        return await repository.GetProfileStatsAsync(_profileId);
    }

    private async Task ClearAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var trackIds = await db.Tracks
            .Where(t => t.CourseId == CourseA || t.CourseId == CourseB || t.CourseId == CourseUnrelated)
            .Select(t => t.Id)
            .ToListAsync();

        if (trackIds.Count > 0)
        {
            await db.GhostSubmissions
                .Where(g => trackIds.Contains(g.TrackId))
                .ExecuteDeleteAsync();
        }

        await db.TTProfiles
            .Where(p => p.DisplayName == ProfileName
                     || p.DisplayName == RivalName
                     || p.DisplayName == ElsewhereName)
            .ExecuteDeleteAsync();

        await db.Tracks
            .Where(t => t.CourseId == CourseA || t.CourseId == CourseB || t.CourseId == CourseUnrelated)
            .ExecuteDeleteAsync();
    }

    private static TrackEntity Track(short courseId) => new()
    {
        CourseId = courseId,
        Name = $"Stats Track {courseId}",
        Category = "custom",
        Laps = 3,
        IsHidden = false
    };

    private static TTProfileEntity Profile(string name) => new()
    {
        DisplayName = name,
        CountryCode = 0
    };

    private static GhostSubmissionEntity Submission(
        int profileId,
        int trackId,
        short cc,
        int timeMs,
        bool isFlap = false) => new()
        {
            TTProfileId = profileId,
            TrackId = trackId,
            CC = cc,
            Glitch = false,
            Shroomless = false,
            IsFlap = isFlap,
            FinishTimeMs = timeMs,
            FinishTimeDisplay = $"{timeMs / 60000}:{timeMs % 60000 / 1000:00}.{timeMs % 1000:000}",
            MiiName = "Tester",
            VehicleId = 1,
            CharacterId = 1,
            LapCount = 3,
            DateSet = DateOnly.FromDateTime(DateTime.UtcNow),
            SubmittedAt = DateTime.UtcNow
        };
}
