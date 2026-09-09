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
/// World-record counts are recalculated on every ghost submit and delete. This pins down that the
/// recalculation writes only the profiles whose count actually moved: an unqualified update
/// rewrote every row and stamped UpdatedAt across the table, so the column could not be used to
/// tell when a profile last changed.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class WorldRecordCountUpdateTests : IAsyncLifetime
{
    private const short CourseId = 941;

    private readonly DatabaseFixture _fixture;

    private int _trackId;
    private int _holderProfileId;
    private int _bystanderProfileId;

    public WorldRecordCountUpdateTests(DatabaseFixture fixture) => _fixture = fixture;

    public async ValueTask InitializeAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var track = new TrackEntity
        {
            Name = "WR Count Test Track",
            CourseId = CourseId,
            Category = "custom",
            Laps = 3,
            SortOrder = 9998
        };
        db.Tracks.Add(track);

        var holder = new TTProfileEntity { DisplayName = "wrc-holder" };
        var bystander = new TTProfileEntity { DisplayName = "wrc-bystander" };
        db.TTProfiles.AddRange(holder, bystander);
        await db.SaveChangesAsync();

        _trackId = track.Id;
        _holderProfileId = holder.Id;
        _bystanderProfileId = bystander.Id;
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.GhostSubmissions.Where(g => g.TrackId == _trackId).ExecuteDeleteAsync();
        await db.TTProfiles.Where(p => p.Id == _holderProfileId || p.Id == _bystanderProfileId).ExecuteDeleteAsync();
        await db.Tracks.Where(t => t.Id == _trackId).ExecuteDeleteAsync();
    }

    [Fact]
    public async Task CountsTheWorldRecordForTheHoldingProfile()
    {
        await AddSubmissionAsync(_holderProfileId, finishTimeMs: 90_000);
        await RecalculateAsync();

        (await ReadAsync(_holderProfileId)).CurrentWorldRecords.ShouldBe(1);
        (await ReadAsync(_bystanderProfileId)).CurrentWorldRecords.ShouldBe(0);
    }

    [Fact]
    public async Task DoesNotTouchProfilesWhoseCountIsUnchanged()
    {
        await AddSubmissionAsync(_holderProfileId, finishTimeMs: 90_000);
        await RecalculateAsync();

        var bystanderBefore = (await ReadAsync(_bystanderProfileId)).UpdatedAt;
        var holderBefore = (await ReadAsync(_holderProfileId)).UpdatedAt;

        // A second, slower ghost from the same profile does not take the record, so no profile's
        // count changes and nothing should be rewritten.
        await AddSubmissionAsync(_holderProfileId, finishTimeMs: 95_000);
        await RecalculateAsync();

        (await ReadAsync(_bystanderProfileId)).UpdatedAt.ShouldBe(bystanderBefore);
        (await ReadAsync(_holderProfileId)).UpdatedAt.ShouldBe(holderBefore);
    }

    [Fact]
    public async Task StillWritesProfilesWhoseCountChanged()
    {
        await RecalculateAsync();
        var before = (await ReadAsync(_holderProfileId)).UpdatedAt;

        // Guarding on IS DISTINCT FROM must not stop a real change from being written.
        await AddSubmissionAsync(_holderProfileId, finishTimeMs: 90_000);
        await RecalculateAsync();

        var after = await ReadAsync(_holderProfileId);
        after.CurrentWorldRecords.ShouldBe(1);
        after.UpdatedAt.ShouldBeGreaterThan(before);
    }

    private async Task RecalculateAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IGhostSubmissionRepository>();
        await repository.UpdateWorldRecordCountsAsync();
    }

    private async Task<TTProfileEntity> ReadAsync(int profileId)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        return await db.TTProfiles.AsNoTracking()
            .SingleAsync(p => p.Id == profileId, TestContext.Current.CancellationToken);
    }

    private async Task AddSubmissionAsync(int profileId, int finishTimeMs)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        db.GhostSubmissions.Add(new GhostSubmissionEntity
        {
            TrackId = _trackId,
            TTProfileId = profileId,
            CC = 150,
            FinishTimeMs = finishTimeMs,
            FinishTimeDisplay = "1:30.000",
            MiiName = "wrc",
            LapCount = 3,
            LapSplitsMs = [30_000, 30_000, 30_000],
            VehicleId = 0,
            Shroomless = false,
            Glitch = false,
            IsFlap = false,
            DateSet = new DateOnly(2026, 6, 1)
        });

        await db.SaveChangesAsync();
    }
}
