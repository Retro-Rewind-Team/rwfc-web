using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.RaceResult;
using RetroRewindWebsite.Repositories.RaceResult;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Repositories;

/// <summary>
/// The kart/bike split in a player's Race Stats has to follow the same filters as Total Races
/// (engine class, time period, track and the room kinds Race Stats counts), or the card would show
/// a split that doesn't add up to the total above it.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class VehicleSplitTests : IAsyncLifetime
{
    private const string RoomId = "veh-split";
    private const long ProfileId = 990_101;
    private const short Engine200 = 1;
    private const short Engine150 = 2;
    private const short StandardKartS = 0x00;
    private const short StandardBikeS = 0x12;

    private readonly DatabaseFixture _fixture;

    public VehicleSplitTests(DatabaseFixture fixture) => _fixture = fixture;

    public async ValueTask InitializeAsync()
    {
        await ClearAsync();

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        db.RaceResults.AddRange(
            Race(1, StandardKartS, Engine150),
            Race(2, StandardKartS, Engine150),
            Race(3, StandardBikeS, Engine200),
            // A room kind Race Stats doesn't count, so the split mustn't either.
            Race(4, StandardKartS, Engine150, rk: "bt_0"));

        await db.SaveChangesAsync();
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        await ClearAsync();
    }

    [Fact]
    public async Task CountsKartAndBikeRacesOnlyInRoomsRaceStatsCounts()
    {
        var (kart, bike) = await CountAsync(engineClassId: null);

        kart.ShouldBe(2);
        bike.ShouldBe(1);
    }

    [Fact]
    public async Task FollowsTheEngineClassFilter()
    {
        var (kart, bike) = await CountAsync(engineClassId: Engine200);

        kart.ShouldBe(0);
        bike.ShouldBe(1);
    }

    private async Task<(int Kart, int Bike)> CountAsync(short? engineClassId)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRaceStatsRepository>();
        return await repository.GetVehicleTypeCountsByPlayerAsync(
            ProfileId, after: null, courseId: null, engineClassId);
    }

    private static RaceResultEntity Race(int raceNumber, short vehicleId, short engineClassId, string rk = "vs_10") => new()
    {
        RoomId = RoomId,
        RaceNumber = raceNumber,
        RaceTimestamp = new DateTime(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc),
        ProfileId = ProfileId,
        PlayerId = 0,
        // FinishTime stores the IEEE 754 bit pattern of the time in seconds.
        FinishTime = BitConverter.SingleToInt32Bits(120f),
        CharacterId = 0,
        VehicleId = vehicleId,
        PlayerCount = 2,
        FinishPos = 1,
        FramesIn1st = 0,
        CourseId = 30301,
        EngineClassId = engineClassId,
        IsPublic = true,
        Rk = rk,
    };

    private async Task ClearAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.RaceResults.Where(r => r.RoomId == RoomId).ExecuteDeleteAsync();
    }
}
