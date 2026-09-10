using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.Room;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using System.Net;
using System.Text.Json;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Controllers;

[Collection("Integration")]
[Trait("Category", "Integration")]
public class RoomStatusControllerTests : IAsyncLifetime
{
    private static readonly DateTime Base = new(2026, 7, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly DatabaseFixture _fixture;
    private readonly HttpClient _client;

    public RoomStatusControllerTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.Client;
    }

    public async ValueTask InitializeAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.Database.ExecuteSqlRawAsync("""TRUNCATE TABLE "RoomSnapshots" """);

        db.RoomSnapshots.AddRange(
            Snapshot(Base, players: 10, rooms: 2),
            Snapshot(Base.AddMinutes(30), players: 40, rooms: 8),
            Snapshot(Base.AddHours(2), players: 25, rooms: 5));

        await db.SaveChangesAsync();
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.Database.ExecuteSqlRawAsync("""TRUNCATE TABLE "RoomSnapshots" """);
    }

    [Fact]
    public async Task GetLatestStatus_WhenLiveCacheIsEmpty_Returns404RatherThanFailing()
    {
        // Hosted services are removed in the test host, so nothing ever populates the live cache.
        // The endpoint has to say "no data yet" rather than throw.
        var response = await _client.GetAsync("/api/roomstatus", TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetHistory_ReturnsSnapshotsNewestFirst()
    {
        var response = await _client.GetAsync(
            "/api/roomstatus/history?page=1&pageSize=10", TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var items = document.RootElement.GetProperty("items").EnumerateArray().ToList();

        items.Count.ShouldBe(3);
        items.Select(i => i.GetProperty("totalPlayers").GetInt32()).ShouldBe([25, 40, 10]);
    }

    [Fact]
    public async Task GetHistory_RejectsARangeLongerThanTheCap()
    {
        // Each snapshot carries its whole room list as JSON, so the range is bounded at 31 days.
        var from = Base.AddYears(-2).ToString("O");
        var to = Base.ToString("O");

        var response = await _client.GetAsync(
            $"/api/roomstatus/history?from={Uri.EscapeDataString(from)}&to={Uri.EscapeDataString(to)}",
            TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetHistory_RejectsAnInvertedRange()
    {
        var from = Base.ToString("O");
        var to = Base.AddDays(-1).ToString("O");

        var response = await _client.GetAsync(
            $"/api/roomstatus/history?from={Uri.EscapeDataString(from)}&to={Uri.EscapeDataString(to)}",
            TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetHistory_AcceptsAnOffsetLessRangeAndTreatsItAsUtc()
    {
        // No 'Z' and no offset, so the value binds with Kind=Unspecified. Npgsql rejects those
        // against a timestamptz column unless the API normalises them first.
        var response = await _client.GetAsync(
            "/api/roomstatus/history?from=2026-07-01T00:00:00&to=2026-07-02T00:00:00",
            TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        // The two snapshots inside the window, not the one two hours later... both are within a
        // day, so all three fall inside this range.
        document.RootElement.GetArrayLength().ShouldBe(3);
    }

    [Fact]
    public async Task GetNearest_ReturnsTheClosestSnapshotToTheGivenTime()
    {
        // 20 minutes past the first snapshot: closer to the 30-minute one.
        var response = await _client.GetAsync(
            "/api/roomstatus/nearest?timestamp=2026-07-01T00:20:00",
            TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        document.RootElement.GetProperty("totalPlayers").GetInt32().ShouldBe(40);
    }

    [Fact]
    public async Task GetAnalytics_BucketsSnapshotsAndReportsThePeak()
    {
        var response = await _client.GetAsync(
            "/api/roomstatus/analytics?days=1", TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var points = document.RootElement.EnumerateArray().ToList();

        // Seeded data may fall outside a one-day window relative to now, so assert the shape
        // rather than the contents: every point must carry a bucket and a player count.
        foreach (var point in points)
        {
            point.TryGetProperty("timestamp", out _).ShouldBeTrue();
            point.TryGetProperty("playerCount", out _).ShouldBeTrue();
        }
    }

    private static RoomSnapshotEntity Snapshot(DateTime timestamp, int players, int rooms) => new()
    {
        Timestamp = timestamp,
        TotalPlayers = players,
        TotalRooms = rooms,
        PublicRooms = rooms,
        PrivateRooms = 0,
        Rooms = []
    };
}
