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
/// Two polling ticks can read the same room before either writes it, so a batch regularly arrives
/// carrying a row that already exists. Postgres aborts the whole INSERT on the first unique
/// violation, which used to cost every other race in that batch.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class RaceResultDuplicateInsertTests : IAsyncLifetime
{
    // RoomId is varchar(10).
    private const string RoomId = "dup-batch";

    private readonly DatabaseFixture _fixture;

    public RaceResultDuplicateInsertTests(DatabaseFixture fixture) => _fixture = fixture;

    public ValueTask InitializeAsync() => ValueTask.CompletedTask;

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.RaceResults.Where(r => r.RoomId == RoomId).ExecuteDeleteAsync();
    }

    [Fact]
    public async Task StoresEveryRowWhenNoneOfThemCollide()
    {
        var inserted = await AddAsync(Result(raceNumber: 1, profileId: 1), Result(raceNumber: 1, profileId: 2));

        inserted.ShouldBe(2);
        (await StoredCountAsync()).ShouldBe(2);
    }

    [Fact]
    public async Task KeepsTheRestOfTheBatchWhenOneRowAlreadyExists()
    {
        await AddAsync(Result(raceNumber: 1, profileId: 1));

        // The other tick's batch covers race 1 again plus two races it is the first to see.
        var inserted = await AddAsync(
            Result(raceNumber: 1, profileId: 1),
            Result(raceNumber: 2, profileId: 1),
            Result(raceNumber: 3, profileId: 1));

        inserted.ShouldBe(2);
        (await StoredCountAsync()).ShouldBe(3);
    }

    [Fact]
    public async Task ReportsNothingStoredWhenTheWholeBatchIsAlreadyThere()
    {
        var rows = new[] { Result(raceNumber: 1, profileId: 1), Result(raceNumber: 1, profileId: 2) };
        await AddAsync(rows[0], rows[1]);

        var inserted = await AddAsync(Result(raceNumber: 1, profileId: 1), Result(raceNumber: 1, profileId: 2));

        inserted.ShouldBe(0);
        (await StoredCountAsync()).ShouldBe(2);
    }

    [Fact]
    public async Task DoesNotTouchTheAlreadyStoredRow()
    {
        await AddAsync(Result(raceNumber: 1, profileId: 1, finishPos: 1));

        // Same key, different payload: the stored row wins, the incoming one is dropped whole.
        await AddAsync(Result(raceNumber: 1, profileId: 1, finishPos: 8));

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        var stored = await db.RaceResults
            .AsNoTracking()
            .Where(r => r.RoomId == RoomId)
            .ToListAsync();

        stored.ShouldHaveSingleItem().FinishPos.ShouldBe((short)1);
    }

    [Fact]
    public async Task AnEmptyBatchStoresNothing()
    {
        (await AddAsync()).ShouldBe(0);
    }

    private async Task<int> AddAsync(params RaceResultEntity[] results)
    {
        // A fresh scope per call, because each poll tick gets its own.
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRaceResultRepository>();
        return await repository.AddRaceResultsAsync([.. results]);
    }

    private async Task<int> StoredCountAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        return await db.RaceResults.CountAsync(r => r.RoomId == RoomId);
    }

    private static RaceResultEntity Result(int raceNumber, long profileId, short finishPos = 1) => new()
    {
        RoomId = RoomId,
        RaceNumber = raceNumber,
        RaceTimestamp = new DateTime(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc),
        ProfileId = profileId,
        PlayerId = 0,
        FinishTime = 0,
        CharacterId = 0,
        VehicleId = 0,
        PlayerCount = 2,
        FinishPos = finishPos,
        FramesIn1st = 0,
        CourseId = 1,
        EngineClassId = 1
    };
}
