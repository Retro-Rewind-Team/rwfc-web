using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.Player;
using RetroRewindWebsite.Models.Entities.RaceResult;
using RetroRewindWebsite.Repositories.Player;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Repositories;

[Collection("Integration")]
[Trait("Category", "Integration")]
public class PlayerRepositoryVehiclePreferenceTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;
    private static readonly string[] TestPids = ["9001", "9002", "9003"];

    public PlayerRepositoryVehiclePreferenceTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    public async ValueTask InitializeAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        // Pid must equal ProfileId's string form for UpdatePlayerVehiclePreferencesAsync's
        // join (Pid = ProfileId::text) to match, mirroring the real Player/RaceResult pairing.
        db.Players.AddRange(
            NewPlayer("KartMajority", 9001),
            NewPlayer("BikeMajority", 9002),
            NewPlayer("TiedPlayer", 9003));

        db.RaceResults.AddRange(
            RaceResult(9001, 1, vehicleId: 0), RaceResult(9001, 2, vehicleId: 0),
            RaceResult(9001, 3, vehicleId: 0), RaceResult(9001, 4, vehicleId: 18),
            RaceResult(9002, 1, vehicleId: 18), RaceResult(9002, 2, vehicleId: 18),
            RaceResult(9002, 3, vehicleId: 18), RaceResult(9002, 4, vehicleId: 0),
            RaceResult(9003, 1, vehicleId: 0), RaceResult(9003, 2, vehicleId: 0),
            RaceResult(9003, 3, vehicleId: 18), RaceResult(9003, 4, vehicleId: 18));

        await db.SaveChangesAsync();
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.RaceResults.Where(r => r.ProfileId >= 9001 && r.ProfileId <= 9003).ExecuteDeleteAsync();
        await db.Players.Where(p => TestPids.Contains(p.Pid)).ExecuteDeleteAsync();
    }

    [Fact]
    public async Task UpdatePlayerVehiclePreferencesAsync_ClassifiesByStrictMajority()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IPlayerRepository>();

        await repository.UpdatePlayerVehiclePreferencesAsync();

        var kartPlayer = await repository.GetByPidAsync("9001");
        var bikePlayer = await repository.GetByPidAsync("9002");
        var tiedPlayer = await repository.GetByPidAsync("9003");

        kartPlayer!.VehiclePreference.ShouldBe(VehicleType.Kart);
        bikePlayer!.VehiclePreference.ShouldBe(VehicleType.Bike);
        tiedPlayer!.VehiclePreference.ShouldBeNull();
    }

    [Fact]
    public async Task UpdatePlayerVehicleRanksAsync_RanksWithinCategoryOnly()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IPlayerRepository>();

        await repository.UpdatePlayerVehiclePreferencesAsync();
        await repository.UpdatePlayerVehicleRanksAsync();

        var kartPlayer = await repository.GetByPidAsync("9001");
        var bikePlayer = await repository.GetByPidAsync("9002");
        var tiedPlayer = await repository.GetByPidAsync("9003");

        kartPlayer!.KartRank.ShouldBe(1);
        kartPlayer.BikeRank.ShouldBeNull();

        bikePlayer!.BikeRank.ShouldBe(1);
        bikePlayer.KartRank.ShouldBeNull();

        tiedPlayer!.KartRank.ShouldBeNull();
        tiedPlayer.BikeRank.ShouldBeNull();
    }

    [Fact]
    public async Task UpdatePlayerVehicleRanksAsync_ResetsRankWhenPlayerNoLongerInCategory()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IPlayerRepository>();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        await repository.UpdatePlayerVehiclePreferencesAsync();
        await repository.UpdatePlayerVehicleRanksAsync();

        var kartPlayerBefore = await repository.GetByPidAsync("9001");
        kartPlayerBefore!.KartRank.ShouldNotBeNull();
        kartPlayerBefore.BikeRank.ShouldBeNull();

        // Tip player 9001 from kart-majority (3 kart, 1 bike) to bike-majority by adding 3 more bike races
        db.RaceResults.AddRange(
            RaceResult(9001, 5, vehicleId: 18),
            RaceResult(9001, 6, vehicleId: 18),
            RaceResult(9001, 7, vehicleId: 18));
        await db.SaveChangesAsync();

        await repository.UpdatePlayerVehiclePreferencesAsync();
        await repository.UpdatePlayerVehicleRanksAsync();

        var kartPlayerAfter = await repository.GetByPidAsync("9001");
        kartPlayerAfter!.VehiclePreference.ShouldBe(VehicleType.Bike);
        kartPlayerAfter.KartRank.ShouldBeNull();
        kartPlayerAfter.BikeRank.ShouldNotBeNull();
    }

    private static PlayerEntity NewPlayer(string name, long profileId) => new()
    {
        Pid = profileId.ToString(),
        Name = name,
        Fc = $"0000-0000-{profileId}",
        Ev = 1000,
        Rank = 0,
        MiiData = "",
        LastSeen = DateTime.UtcNow,
        LastUpdated = DateTime.UtcNow,
        IsSuspicious = false,
        SuspiciousVRJumps = 0,
        VRGainLast24Hours = 0,
        VRGainLastWeek = 0,
        VRGainLastMonth = 0
    };

    private static RaceResultEntity RaceResult(long profileId, int raceNumber, short vehicleId) => new()
    {
        RoomId = $"vp-{profileId}",
        RaceNumber = raceNumber,
        RaceTimestamp = DateTime.UtcNow,
        ProfileId = profileId,
        PlayerId = 0,
        FinishTime = 0,
        CharacterId = 0,
        VehicleId = vehicleId,
        PlayerCount = 1,
        FinishPos = 1,
        FramesIn1st = 0,
        CourseId = 1,
        EngineClassId = 1
    };
}
