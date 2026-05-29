using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.RaceResult;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using System.Net;
using System.Text.Json;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Controllers;

[Collection("Integration")]
[Trait("Category", "Integration")]
public class RaceStatsControllerTests : IAsyncLifetime
{
    private readonly HttpClient _client;
    private readonly DatabaseFixture _fixture;

    public RaceStatsControllerTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.Client;
    }

    public async ValueTask InitializeAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.Database.ExecuteSqlRawAsync("""TRUNCATE TABLE "RaceResults" """);
        db.RaceResults.AddRange(
            new RaceResultEntity
            {
                RoomId = "room-001", RaceNumber = 1,
                RaceTimestamp = new DateTime(2026, 5, 1, 12, 0, 0, DateTimeKind.Utc),
                ProfileId = 1001, PlayerId = 0,
                FinishTime = 0, CharacterId = 0, VehicleId = 0,
                PlayerCount = 2, FinishPos = 1, FramesIn1st = 0,
                CourseId = 1, EngineClassId = 2
            },
            new RaceResultEntity
            {
                RoomId = "room-001", RaceNumber = 1,
                RaceTimestamp = new DateTime(2026, 5, 1, 12, 0, 0, DateTimeKind.Utc),
                ProfileId = 1002, PlayerId = 0,
                FinishTime = 0, CharacterId = 1, VehicleId = 1,
                PlayerCount = 2, FinishPos = 2, FramesIn1st = 60,
                CourseId = 1, EngineClassId = 2
            },
            new RaceResultEntity
            {
                RoomId = "room-002", RaceNumber = 1,
                RaceTimestamp = new DateTime(2026, 5, 2, 10, 0, 0, DateTimeKind.Utc),
                ProfileId = 1001, PlayerId = 0,
                FinishTime = 0, CharacterId = 0, VehicleId = 0,
                PlayerCount = 1, FinishPos = 1, FramesIn1st = 0,
                CourseId = 2, EngineClassId = 1
            }
        );
        await db.SaveChangesAsync();
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.Database.ExecuteSqlRawAsync("""TRUNCATE TABLE "RaceResults" """);
    }

    [Fact]
    public async Task GetRaces_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/racestats/races", TestContext.Current.CancellationToken);
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetRaces_ReturnsTwoDistinctRaces()
    {
        var response = await _client.GetAsync("/api/racestats/races", TestContext.Current.CancellationToken);
        var json = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        using var doc = JsonDocument.Parse(json);
        doc.RootElement.GetProperty("totalCount").GetInt32().ShouldBe(2);
        doc.RootElement.GetProperty("items").GetArrayLength().ShouldBe(2);
    }

    [Fact]
    public async Task GetRaces_FilterByRoomId_ReturnsOneRace()
    {
        var response = await _client.GetAsync("/api/racestats/races?roomId=room-001", TestContext.Current.CancellationToken);
        var json = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        using var doc = JsonDocument.Parse(json);
        doc.RootElement.GetProperty("totalCount").GetInt32().ShouldBe(1);
        var race = doc.RootElement.GetProperty("items")[0];
        race.GetProperty("roomId").GetString().ShouldBe("room-001");
        race.GetProperty("participants").GetArrayLength().ShouldBe(2);
    }

    [Fact]
    public async Task GetRaces_FilterByEngineClass_ReturnsMatchingRaces()
    {
        var response = await _client.GetAsync("/api/racestats/races?engineClassId=1", TestContext.Current.CancellationToken);
        var json = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        using var doc = JsonDocument.Parse(json);
        doc.RootElement.GetProperty("totalCount").GetInt32().ShouldBe(1);
        doc.RootElement.GetProperty("items")[0].GetProperty("roomId").GetString().ShouldBe("room-002");
    }

    [Fact]
    public async Task GetRaces_ParticipantsOrderedByFinishPos()
    {
        var response = await _client.GetAsync("/api/racestats/races?roomId=room-001", TestContext.Current.CancellationToken);
        var json = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        using var doc = JsonDocument.Parse(json);
        var participants = doc.RootElement.GetProperty("items")[0].GetProperty("participants");
        participants[0].GetProperty("finishPos").GetInt16().ShouldBe((short)1);
        participants[1].GetProperty("finishPos").GetInt16().ShouldBe((short)2);
    }
}
