using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using System.Net;
using System.Text.Json;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Controllers;

[Collection("Integration")]
[Trait("Category", "Integration")]
public class LeaderboardControllerTests
{
    private readonly HttpClient _client;

    public LeaderboardControllerTests(DatabaseFixture fixture)
    {
        _client = fixture.Client;
    }

    [Fact]
    public async Task GetLeaderboard_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/leaderboard", TestContext.Current.CancellationToken);
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetLeaderboard_ResponseContainsSeededPlayers()
    {
        var response = await _client.GetAsync("/api/leaderboard", TestContext.Current.CancellationToken);
        var json = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        json.ShouldContain("Player1");
    }

    [Fact]
    public async Task GetLeaderboard_PageSizeOne_ReturnsOneItem()
    {
        var response = await _client.GetAsync("/api/leaderboard?pageSize=1", TestContext.Current.CancellationToken);
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var json = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        using var doc = JsonDocument.Parse(json);
        doc.RootElement.TryGetProperty("players", out var playersEl).ShouldBeTrue("response should contain a 'players' array");
        playersEl.GetArrayLength().ShouldBe(1);
    }
}
