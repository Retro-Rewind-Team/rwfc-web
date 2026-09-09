using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.RaceResult;
using RetroRewindWebsite.Services.Application;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Services;

/// <summary>
/// The stats endpoints run whole-table aggregates over RaceResults, so repeat calls must be served
/// from memory rather than recomputed. This class builds its own host with caching switched on --
/// the factory shared by the Integration collection disables it so seeded data is always visible.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class RaceStatsCacheTests : IAsyncLifetime
{
    private CustomWebApplicationFactory _factory = null!;

    public async ValueTask InitializeAsync()
    {
        _factory = new CustomWebApplicationFactory(new Dictionary<string, string?>
        {
            ["RaceStatsCache:GlobalSeconds"] = "300",
            ["RaceStatsCache:PlayerSeconds"] = "120"
        });

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.Database.ExecuteSqlRawAsync("""TRUNCATE TABLE "RaceResults" """);
        db.RaceResults.Add(NewRaceResult("cache-r1", raceNumber: 1));
        await db.SaveChangesAsync();
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
            await db.Database.ExecuteSqlRawAsync("""TRUNCATE TABLE "RaceResults" """);
        }

        await _factory.DisposeAsync();
    }

    [Fact]
    public async Task GetGlobalRaceStatsAsync_ServesRepeatCallsFromCache()
    {
        var first = await GetGlobalAsync(days: null);
        first.TotalRacesTracked.ShouldBe(1);

        await AddRaceAsync("cache-r2", raceNumber: 1);

        // Same filter, so this must come back from the cache and not see the new race.
        var second = await GetGlobalAsync(days: null);
        second.TotalRacesTracked.ShouldBe(1);
    }

    [Fact]
    public async Task GetGlobalRaceStatsAsync_CachesEachDaysFilterSeparately()
    {
        var unfiltered = await GetGlobalAsync(days: null);
        unfiltered.TotalRacesTracked.ShouldBe(1);

        await AddRaceAsync("cache-r3", raceNumber: 1);

        // A different filter is a different cache key, so this one is computed fresh and sees
        // both races. Without per-filter keys the two windows would shadow each other.
        var filtered = await GetGlobalAsync(days: 30);
        filtered.TotalRacesTracked.ShouldBe(2);
    }

    private async Task<RetroRewindWebsite.Models.DTOs.RaceStats.GlobalRaceStatsDto> GetGlobalAsync(int? days)
    {
        using var scope = _factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IRaceStatsService>();
        return await service.GetGlobalRaceStatsAsync(days);
    }

    private async Task AddRaceAsync(string roomId, int raceNumber)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        db.RaceResults.Add(NewRaceResult(roomId, raceNumber));
        await db.SaveChangesAsync();
    }

    private static RaceResultEntity NewRaceResult(string roomId, int raceNumber) => new()
    {
        RoomId = roomId,
        RaceNumber = raceNumber,
        RaceTimestamp = DateTime.UtcNow,
        ProfileId = 9401,
        PlayerId = 0,
        FinishTime = 0,
        CharacterId = 0,
        VehicleId = 0,
        PlayerCount = 1,
        FinishPos = 1,
        FramesIn1st = 0,
        CourseId = 1,
        EngineClassId = 1
    };
}
