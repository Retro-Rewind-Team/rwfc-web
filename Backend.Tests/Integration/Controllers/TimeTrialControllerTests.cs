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
    public async Task GetLeaderboard_ValidCc_DoesNotReturn400Or500(int cc)
    {
        // No TT data seeded — endpoint returns 404 (track not found) or 200 (empty),
        // but must never return 400 (validation error) or 500 (crash)
        var response = await _client.GetAsync($"/api/timeTrial/leaderboard?cc={cc}&trackId=0", TestContext.Current.CancellationToken);
        (response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound)
            .ShouldBeTrue($"expected 200 or 404, got {(int)response.StatusCode}");
    }

    [Theory]
    [InlineData("karts")]
    [InlineData("bikes")]
    [InlineData("")]
    public async Task GetLeaderboard_VehicleFilter_DoesNotReturn400Or500(string vehicle)
    {
        var url = string.IsNullOrEmpty(vehicle)
            ? "/api/timeTrial/leaderboard?cc=150&trackId=0"
            : $"/api/timeTrial/leaderboard?cc=150&trackId=0&vehicle={vehicle}";
        var response = await _client.GetAsync(url, TestContext.Current.CancellationToken);
        (response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound)
            .ShouldBeTrue($"expected 200 or 404, got {(int)response.StatusCode}");
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
