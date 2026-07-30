using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.Player;
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
    private readonly DatabaseFixture _fixture;
    private readonly HttpClient _client;

    public LeaderboardControllerTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
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

    [Fact]
    public async Task GetLeaderboard_VehicleFilterKart_ExcludesPlayersWithNoPreference()
    {
        var response = await _client.GetAsync("/api/leaderboard?vehicleFilter=kart", TestContext.Current.CancellationToken);
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var json = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        using var doc = JsonDocument.Parse(json);
        doc.RootElement.GetProperty("players").GetArrayLength().ShouldBe(0);
    }

    [Fact]
    public async Task GetLeaderboard_InvalidVehicleFilter_ReturnsBadRequest()
    {
        var response = await _client.GetAsync("/api/leaderboard?vehicleFilter=moped", TestContext.Current.CancellationToken);
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetLeaderboard_VehicleFilterKart_ReturnsKartScopedRank()
    {
        const string pid = "kart-rank-test";

        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
            db.Players.Add(new PlayerEntity
            {
                Pid = pid,
                Name = "KartRankTest",
                Fc = "9999-9999-0001",
                Ev = 500,
                Rank = 999,
                MiiData = "",
                LastSeen = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow,
                IsSuspicious = false,
                SuspiciousVRJumps = 0,
                VRGainLast24Hours = 0,
                VRGainLastWeek = 0,
                VRGainLastMonth = 0,
                VehiclePreference = VehicleType.Kart,
                KartRank = 3
            });
            await db.SaveChangesAsync();
        }

        try
        {
            var response = await _client.GetAsync("/api/leaderboard?vehicleFilter=kart", TestContext.Current.CancellationToken);
            var json = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
            using var doc = JsonDocument.Parse(json);
            var players = doc.RootElement.GetProperty("players");
            players.GetArrayLength().ShouldBe(1);
            players[0].GetProperty("rank").GetInt32().ShouldBe(3);
        }
        finally
        {
            using var scope = _fixture.Factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
            await db.Players.Where(p => p.Pid == pid).ExecuteDeleteAsync();
        }
    }
}
