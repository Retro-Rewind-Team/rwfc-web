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
/// RaceTimestamp is the collector's tick time, not when the race ended, so every race collected in
/// one tick (the backlog after a deploy or a WFC outage) shares a timestamp. Race history pages
/// through that sort, so without a tiebreaker those races come back in arbitrary order and can
/// repeat or go missing between pages.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class RaceHistoryOrderingTests : IAsyncLifetime
{
    private const string RoomId = "rh-order";
    private const long ProfileId = 990_001;

    // Inserted out of order so neither physical row order nor a backward index scan can return the
    // expected order by accident.
    private static readonly int[] InsertionOrder = [3, 1, 5, 2, 4];
    private static readonly int[] NewestFirst = [5, 4, 3, 2, 1];

    private readonly DatabaseFixture _fixture;

    public RaceHistoryOrderingTests(DatabaseFixture fixture) => _fixture = fixture;

    public async ValueTask InitializeAsync()
    {
        await ClearAsync();

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        var sharedTick = new DateTime(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc);

        foreach (var raceNumber in InsertionOrder)
        {
            db.RaceResults.Add(new RaceResultEntity
            {
                RoomId = RoomId,
                RaceNumber = raceNumber,
                RaceTimestamp = sharedTick,
                ProfileId = ProfileId,
                PlayerId = 0,
                FinishTime = BitConverter.SingleToInt32Bits(120f),
                CharacterId = 0,
                VehicleId = 0,
                PlayerCount = 2,
                FinishPos = 1,
                FramesIn1st = 0,
                CourseId = 30201,
                EngineClassId = 2,
                IsPublic = true,
                Rk = "vs_10",
            });

            // One save per row, so rows are written in InsertionOrder.
            await db.SaveChangesAsync();
        }
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        await ClearAsync();
    }

    [Fact]
    public async Task PlayerRaceHistoryPagesTiedRacesByRaceNumber()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRaceStatsRepository>();

        var seen = new List<int>();
        for (var page = 1; page <= NewestFirst.Length; page++)
        {
            var (rows, total) = await repository.GetRecentRacesByPlayerAsync(
                ProfileId, page, pageSize: 1, after: null, courseId: null);

            total.ShouldBe(NewestFirst.Length);
            seen.Add(rows.ShouldHaveSingleItem().RaceNumber);
        }

        seen.ShouldBe(NewestFirst);
    }

    [Fact]
    public async Task RaceBrowserPagesTiedRacesByRaceNumber()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRaceStatsRepository>();

        var seen = new List<int>();
        for (var page = 1; page <= NewestFirst.Length; page++)
        {
            var (races, total) = await repository.GetDistinctRacesAsync(
                roomId: RoomId, raceNumber: null, courseId: null, engineClassId: null,
                profileId: null, from: null, to: null, page, pageSize: 1);

            total.ShouldBe(NewestFirst.Length);
            seen.Add(races.ShouldHaveSingleItem().RaceNumber);
        }

        seen.ShouldBe(NewestFirst);
    }

    private async Task ClearAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.RaceResults.Where(r => r.RoomId == RoomId).ExecuteDeleteAsync();
    }
}
