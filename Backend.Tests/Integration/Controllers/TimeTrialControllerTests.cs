using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.TimeTrial;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using RetroRewindWebsite.Tests.TestHelpers;
using Shouldly;
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Controllers;

[Collection("Integration")]
[Trait("Category", "Integration")]
public class TimeTrialControllerTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;
    private readonly HttpClient _client;
    private int _trackId;
    private int _profileId;

    public TimeTrialControllerTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.Client;
    }

    public async ValueTask InitializeAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var track = new TrackEntity
        {
            Name = "Ghost Download Test Track",
            CourseId = 5,
            Category = "Retro",
            Laps = 3,
            SupportsGlitch = false,
            SortOrder = 9002
        };
        db.Tracks.Add(track);

        var profile = new TTProfileEntity { DisplayName = "GhostDownloadTester" };
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
    public async Task GetLeaderboard_InvalidCc_ReturnsBadRequest()
    {
        var response = await _client.GetAsync("/api/timeTrial/leaderboard?cc=100&trackId=0", TestContext.Current.CancellationToken);
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData(150)]
    [InlineData(200)]
    public async Task GetLeaderboard_ReturnsTheSubmissionsForThatCc(int cc)
    {
        // One entry per cc, so the response identifies which one the filter selected. The previous
        // version of this test asked for trackId=0, which cannot exist, and asserted only that the
        // status was not 400 or 500 -- it passed on a 404 and proved nothing.
        await SeedSubmissionAsync(cc: 150, finishTimeMs: 90_000, vehicleId: 0);
        await SeedSubmissionAsync(cc: 200, finishTimeMs: 80_000, vehicleId: 0);

        var response = await _client.GetAsync(
            $"/api/timeTrial/leaderboard?cc={cc}&trackId={_trackId}", TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var items = await ReadLeaderboardItemsAsync(response);
        items.Count.ShouldBe(1);
        items[0].GetProperty("cc").GetInt16().ShouldBe((short)cc);
        items[0].GetProperty("finishTimeMs").GetInt32().ShouldBe(cc == 150 ? 90_000 : 80_000);
    }

    [Fact]
    public async Task GetLeaderboard_OrdersByFinishTimeAscending()
    {
        await SeedSubmissionAsync(cc: 150, finishTimeMs: 95_000, vehicleId: 0);
        await SeedSubmissionAsync(cc: 150, finishTimeMs: 85_000, vehicleId: 0);
        await SeedSubmissionAsync(cc: 150, finishTimeMs: 90_000, vehicleId: 0);

        var response = await _client.GetAsync(
            $"/api/timeTrial/leaderboard?cc=150&trackId={_trackId}", TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var times = (await ReadLeaderboardItemsAsync(response))
            .Select(i => i.GetProperty("finishTimeMs").GetInt32())
            .ToList();

        times.ShouldBe([85_000, 90_000, 95_000]);
    }

    [Theory]
    [InlineData("karts", 0, 1)]
    [InlineData("bikes", 18, 1)]
    public async Task GetLeaderboard_VehicleFilter_SelectsOnlyThatCategory(
        string vehicle, short matchingVehicleId, int expectedCount)
    {
        await SeedSubmissionAsync(cc: 150, finishTimeMs: 90_000, vehicleId: matchingVehicleId);

        var response = await _client.GetAsync(
            $"/api/timeTrial/leaderboard?cc=150&trackId={_trackId}&vehicle={vehicle}",
            TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var items = await ReadLeaderboardItemsAsync(response);
        items.Count.ShouldBe(expectedCount);
        items[0].GetProperty("vehicleId").GetInt16().ShouldBe(matchingVehicleId);
    }

    [Fact]
    public async Task GetLeaderboard_VehicleFilter_ExcludesTheOtherCategory()
    {
        // A kart-only run must not appear under the bike filter.
        await SeedSubmissionAsync(cc: 150, finishTimeMs: 90_000, vehicleId: 0);

        var response = await _client.GetAsync(
            $"/api/timeTrial/leaderboard?cc=150&trackId={_trackId}&vehicle=bikes",
            TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await ReadLeaderboardItemsAsync(response)).ShouldBeEmpty();
    }

    private static async Task<List<JsonElement>> ReadLeaderboardItemsAsync(HttpResponseMessage response)
    {
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return [.. document.RootElement.GetProperty("submissions").EnumerateArray()
            .Select(e => e.Clone())];
    }

    private async Task SeedSubmissionAsync(short cc, int finishTimeMs, short vehicleId)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        db.GhostSubmissions.Add(new GhostSubmissionEntity
        {
            TrackId = _trackId,
            TTProfileId = _profileId,
            CC = cc,
            FinishTimeMs = finishTimeMs,
            FinishTimeDisplay = "1:30.000",
            MiiName = "ttc",
            LapCount = 3,
            LapSplitsMs = [30_000, 30_000, 30_000],
            VehicleId = vehicleId,
            Shroomless = false,
            Glitch = false,
            IsFlap = false,
            DateSet = new DateOnly(2026, 6, 1)
        });

        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task DownloadGhost_ExistingSubmission_ReturnsUploadedBytes()
    {
        var rkgBytes = RkgTestData.BuildValidRkg(trackId: 5, lapCount: 3);

        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(rkgBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        content.Add(fileContent, "GhostFile", "test.rkg");
        content.Add(new StringContent(_trackId.ToString()), "TrackId");
        content.Add(new StringContent("150"), "Cc");
        content.Add(new StringContent(_profileId.ToString()), "TtProfileId");
        content.Add(new StringContent("false"), "Shroomless");
        content.Add(new StringContent("false"), "Glitch");
        content.Add(new StringContent("false"), "IsFlap");

        using var submitRequest = new HttpRequestMessage(HttpMethod.Post, "/api/moderation/timetrial/submit");
        submitRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "test-secret-do-not-use-in-prod");
        submitRequest.Content = content;

        var submitResponse = await _client.SendAsync(submitRequest, TestContext.Current.CancellationToken);
        submitResponse.StatusCode.ShouldBe(HttpStatusCode.OK);

        var submitJson = await submitResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        using var submitDoc = JsonDocument.Parse(submitJson);
        var submissionId = submitDoc.RootElement.GetProperty("submission").GetProperty("id").GetInt32();

        var downloadResponse = await _client.GetAsync($"/api/timeTrial/ghost/{submissionId}/download", TestContext.Current.CancellationToken);

        downloadResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        downloadResponse.Content.Headers.ContentType!.MediaType.ShouldBe("application/octet-stream");
        var downloadedBytes = await downloadResponse.Content.ReadAsByteArrayAsync(TestContext.Current.CancellationToken);
        downloadedBytes.ShouldBe(rkgBytes);
    }

    [Fact]
    public async Task DownloadGhost_NonexistentId_ReturnsNotFound()
    {
        var response = await _client.GetAsync("/api/timeTrial/ghost/999999999/download", TestContext.Current.CancellationToken);
        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }
}
