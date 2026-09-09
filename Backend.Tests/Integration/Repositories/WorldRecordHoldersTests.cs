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
/// Kart, bike, shroomless and flap are separate record categories, so one track and cc offers four
/// records rather than one. These tests pin that down for the rankings query, which decides the
/// "world records held" figure on the player rankings page.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class WorldRecordHoldersTests : IAsyncLifetime
{
    private const short CourseId = 943;
    private const short Cc = 150;

    private const short KartVehicle = 0;
    private const short BikeVehicle = 18;

    private readonly DatabaseFixture _fixture;

    private int _trackId;
    private readonly Dictionary<string, int> _profiles = [];

    public WorldRecordHoldersTests(DatabaseFixture fixture) => _fixture = fixture;

    public async ValueTask InitializeAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var track = new TrackEntity
        {
            Name = "WR Holders Test Track",
            CourseId = CourseId,
            Category = "custom",
            Laps = 3,
            SortOrder = 9996
        };
        db.Tracks.Add(track);

        foreach (var name in new[] { "wrh-kart", "wrh-kart-slower", "wrh-bike", "wrh-shroomless" })
        {
            var profile = new TTProfileEntity { DisplayName = name };
            db.TTProfiles.Add(profile);
        }

        await db.SaveChangesAsync();
        _trackId = track.Id;

        foreach (var profile in await db.TTProfiles
            .Where(p => p.DisplayName.StartsWith("wrh-"))
            .ToListAsync(TestContext.Current.CancellationToken))
        {
            _profiles[profile.DisplayName] = profile.Id;
        }

        db.GhostSubmissions.AddRange(
            Submission(_profiles["wrh-kart"], KartVehicle, finishTimeMs: 90_000, shroomless: false),
            Submission(_profiles["wrh-kart-slower"], KartVehicle, finishTimeMs: 95_000, shroomless: false),
            // A bike time slower than the fastest kart still takes the bike record.
            Submission(_profiles["wrh-bike"], BikeVehicle, finishTimeMs: 92_000, shroomless: false),
            // Slowest of all, but the only shroomless run, so it holds that record.
            Submission(_profiles["wrh-shroomless"], KartVehicle, finishTimeMs: 100_000, shroomless: true));

        await db.SaveChangesAsync();
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.GhostSubmissions.Where(g => g.TrackId == _trackId).ExecuteDeleteAsync();
        await db.TTProfiles.Where(p => p.DisplayName.StartsWith("wrh-")).ExecuteDeleteAsync();
        await db.Tracks.Where(t => t.Id == _trackId).ExecuteDeleteAsync();
    }

    [Fact]
    public async Task KartBikeAndShroomlessAreCountedAsSeparateRecords()
    {
        var holders = await QueryAsync();

        var byProfile = holders
            .Where(h => h.TrackId == _trackId)
            .GroupBy(h => h.TTProfileId)
            .ToDictionary(g => g.Key, g => g.Count());

        // Three distinct records on one track and cc: fastest kart, fastest bike, fastest shroomless.
        byProfile.ShouldContainKeyAndValue(_profiles["wrh-kart"], 1);
        byProfile.ShouldContainKeyAndValue(_profiles["wrh-bike"], 1);
        byProfile.ShouldContainKeyAndValue(_profiles["wrh-shroomless"], 1);

        // Beaten in its own category, so it holds nothing.
        byProfile.ShouldNotContainKey(_profiles["wrh-kart-slower"]);
    }

    [Fact]
    public async Task OnlyTheFastestRunInACategoryIsReturned()
    {
        var holders = await QueryAsync();

        var kartHolders = holders
            .Where(h => h.TrackId == _trackId && !h.Shroomless && h.VehicleId == KartVehicle)
            .ToList();

        kartHolders.Count.ShouldBe(1);
        kartHolders[0].TTProfileId.ShouldBe(_profiles["wrh-kart"]);
        kartHolders[0].FinishTimeMs.ShouldBe(90_000);
    }

    private async Task<List<GhostSubmissionEntity>> QueryAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IGhostSubmissionRepository>();
        return await repository.GetWorldRecordHoldersForRankingsAsync(
            Cc, glitchAllowed: true, shroomless: null, minVehicleId: null, maxVehicleId: null, trackCategory: null);
    }

    private GhostSubmissionEntity Submission(int profileId, short vehicleId, int finishTimeMs, bool shroomless) => new()
    {
        TrackId = _trackId,
        TTProfileId = profileId,
        CC = Cc,
        FinishTimeMs = finishTimeMs,
        FinishTimeDisplay = "1:30.000",
        MiiName = "wrh",
        LapCount = 3,
        LapSplitsMs = [30_000, 30_000, 30_000],
        VehicleId = vehicleId,
        Shroomless = shroomless,
        Glitch = false,
        IsFlap = false,
        DateSet = new DateOnly(2026, 6, 1)
    };
}
