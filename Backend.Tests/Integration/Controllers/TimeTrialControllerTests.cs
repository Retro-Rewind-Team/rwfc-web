using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using System.Net;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Controllers;

[Collection("Integration")]
[Trait("Category", "Integration")]
public class TimeTrialControllerTests
{
    private readonly HttpClient _client;

    public TimeTrialControllerTests(DatabaseFixture fixture)
    {
        _client = fixture.Client;
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
}
