using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.Room;
using RetroRewindWebsite.Repositories.Room;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Repositories;

/// <summary>
/// Characterises the activity-chart series: snapshots collapse into fixed-width buckets, each
/// reporting the peak within it. Bucket boundaries must not shift, because the frontend plots the
/// returned timestamps directly.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class RoomSnapshotSeriesTests : IAsyncLifetime
{
    private static readonly DateTime Base = new(2026, 6, 10, 0, 0, 0, DateTimeKind.Utc);

    private readonly DatabaseFixture _fixture;

    public RoomSnapshotSeriesTests(DatabaseFixture fixture) => _fixture = fixture;

    public async ValueTask InitializeAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.Database.ExecuteSqlRawAsync("""TRUNCATE TABLE "RoomSnapshots" """);

        db.RoomSnapshots.AddRange(
            // First hour: peak 40 players / 8 rooms.
            Snapshot(Base.AddMinutes(0), players: 10, rooms: 2),
            Snapshot(Base.AddMinutes(20), players: 40, rooms: 8),
            Snapshot(Base.AddMinutes(59), players: 30, rooms: 6),
            // Second hour: peak 25 players / 5 rooms.
            Snapshot(Base.AddMinutes(60), players: 25, rooms: 5),
            Snapshot(Base.AddMinutes(90), players: 15, rooms: 3),
            // Fourth hour, leaving the third empty so gaps stay gaps.
            Snapshot(Base.AddMinutes(200), players: 50, rooms: 9));

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
    public async Task BucketsHourlyOnTheHourAndReportsThePeakInEachBucket()
    {
        var series = await QueryAsync(cutoff: null, TimeSpan.FromHours(1));

        series.Select(s => s.Bucket).ShouldBe([Base, Base.AddHours(1), Base.AddHours(3)]);
        series.Select(s => s.MaxPlayers).ShouldBe([40, 25, 50]);
        series.Select(s => s.MaxRooms).ShouldBe([8, 5, 9]);

        // Boundaries land on the hour, not on the first sample.
        series[0].Bucket.Minute.ShouldBe(0);
        series[0].Bucket.Kind.ShouldBe(DateTimeKind.Utc);
    }

    [Fact]
    public async Task WiderBucketsMergeAdjacentHours()
    {
        var series = await QueryAsync(cutoff: null, TimeSpan.FromHours(4));

        // Everything seeded falls inside one four-hour bucket starting at midnight.
        series.Count.ShouldBe(1);
        series[0].Bucket.ShouldBe(Base);
        series[0].MaxPlayers.ShouldBe(50);
        series[0].MaxRooms.ShouldBe(9);
    }

    [Fact]
    public async Task CutoffExcludesEarlierSnapshots()
    {
        var series = await QueryAsync(cutoff: Base.AddHours(1), TimeSpan.FromHours(1));

        series.Select(s => s.Bucket).ShouldBe([Base.AddHours(1), Base.AddHours(3)]);
        series.Select(s => s.MaxPlayers).ShouldBe([25, 50]);
    }

    [Fact]
    public async Task TenMinuteBucketsSplitWithinTheHour()
    {
        var series = await QueryAsync(cutoff: null, TimeSpan.FromMinutes(10));

        series.Select(s => s.Bucket).ShouldBe([
            Base,
            Base.AddMinutes(20),
            Base.AddMinutes(50),
            Base.AddMinutes(60),
            Base.AddMinutes(90),
            Base.AddMinutes(200)
        ]);
        series.Select(s => s.MaxPlayers).ShouldBe([10, 40, 30, 25, 15, 50]);
    }

    private async Task<List<(DateTime Bucket, int MaxPlayers, int MaxRooms)>> QueryAsync(
        DateTime? cutoff, TimeSpan bucketSize)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRoomSnapshotRepository>();
        return await repository.GetPlayerCountSeriesAsync(cutoff, bucketSize);
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
