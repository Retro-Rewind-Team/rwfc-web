using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.TimeTrial;
using RetroRewindWebsite.Services.Application;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using RetroRewindWebsite.Tests.TestHelpers;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Services;

[Collection("Integration")]
[Trait("Category", "Integration")]
public class GhostBlobFlowTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;
    private int _trackId;
    private int _profileId;

    public GhostBlobFlowTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    public async ValueTask InitializeAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var track = new TrackEntity
        {
            Name = "Ghost Blob Test Track",
            CourseId = 5,
            Category = "Retro",
            Laps = 3,
            SupportsGlitch = false,
            SortOrder = 9001
        };
        db.Tracks.Add(track);

        var profile = new TTProfileEntity { DisplayName = "GhostBlobTester" };
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
    public async Task SubmitGhostAsync_StoresBlobRow()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var moderationService = scope.ServiceProvider.GetRequiredService<ITimeTrialModerationService>();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var rkgBytes = RkgTestData.BuildValidRkg(trackId: 5, lapCount: 3);
        using var stream = new MemoryStream(rkgBytes);
        IFormFile file = new FormFile(stream, 0, stream.Length, "ghostFile", "test.rkg");

        var result = await moderationService.SubmitGhostAsync(
            file, _trackId, cc: 150, ttProfileId: _profileId,
            shroomless: false, glitch: false, isFlap: false);

        result.Success.ShouldBeTrue();
        var blob = await db.GhostFileBlobs.FirstOrDefaultAsync(b => b.Id == result.Submission!.Id);
        blob.ShouldNotBeNull();
        blob.Data.ShouldBe(rkgBytes);
    }

    [Fact]
    public async Task DeleteGhostAsync_CascadesBlobDeletion()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var moderationService = scope.ServiceProvider.GetRequiredService<ITimeTrialModerationService>();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var rkgBytes = RkgTestData.BuildValidRkg(trackId: 5, lapCount: 3);
        using var stream = new MemoryStream(rkgBytes);
        IFormFile file = new FormFile(stream, 0, stream.Length, "ghostFile", "test.rkg");

        var submitResult = await moderationService.SubmitGhostAsync(
            file, _trackId, cc: 150, ttProfileId: _profileId,
            shroomless: false, glitch: false, isFlap: false);
        var submissionId = submitResult.Submission!.Id;

        await moderationService.DeleteGhostAsync(submissionId);

        var blob = await db.GhostFileBlobs.FirstOrDefaultAsync(b => b.Id == submissionId);
        blob.ShouldBeNull();
    }

    [Fact]
    public async Task GetGhostDownloadInfoAsync_NoBlob_ReturnsNull()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        var timeTrialService = scope.ServiceProvider.GetRequiredService<ITimeTrialService>();

        // Simulates a legacy submission whose ghost file was already lost before this migration
        var submission = new GhostSubmissionEntity
        {
            TrackId = _trackId,
            TTProfileId = _profileId,
            CC = 150,
            FinishTimeMs = 90000,
            FinishTimeDisplay = "1:30.000",
            MiiName = "Test",
            LapCount = 3,
            LapSplitsMs = [30000, 30000, 30000],
            GhostFilePath = string.Empty,
            DateSet = DateOnly.FromDateTime(DateTime.UtcNow)
        };
        db.GhostSubmissions.Add(submission);
        await db.SaveChangesAsync();

        var info = await timeTrialService.GetGhostDownloadInfoAsync(submission.Id);

        info.ShouldBeNull();
    }

    [Fact]
    public async Task GetGhostDownloadInfoAsync_HasBlob_ReturnsBytes()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var moderationService = scope.ServiceProvider.GetRequiredService<ITimeTrialModerationService>();
        var timeTrialService = scope.ServiceProvider.GetRequiredService<ITimeTrialService>();

        var rkgBytes = RkgTestData.BuildValidRkg(trackId: 5, lapCount: 3);
        using var stream = new MemoryStream(rkgBytes);
        IFormFile file = new FormFile(stream, 0, stream.Length, "ghostFile", "test.rkg");

        var submitResult = await moderationService.SubmitGhostAsync(
            file, _trackId, cc: 150, ttProfileId: _profileId,
            shroomless: false, glitch: false, isFlap: false);

        var info = await timeTrialService.GetGhostDownloadInfoAsync(submitResult.Submission!.Id);

        info.ShouldNotBeNull();
        info.Value.Data.ShouldBe(rkgBytes);
    }
}
