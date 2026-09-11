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
/// GetIdBoundsAsync replaced two separate MIN and MAX queries with one aggregate. The rewrite uses
/// GroupBy, which returns no row at all for an empty table rather than a row of nulls, so the
/// empty case is the one worth pinning.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class SnapshotIdBoundsTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;

    public SnapshotIdBoundsTests(DatabaseFixture fixture) => _fixture = fixture;

    public ValueTask InitializeAsync() => ValueTask.CompletedTask;

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        await ClearAsync();
    }

    [Fact]
    public async Task ReportsTheLowestAndHighestIdPresent()
    {
        await ClearAsync();

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        var snapshots = new[] { Snapshot(1), Snapshot(2), Snapshot(3) };
        db.RoomSnapshots.AddRange(snapshots);
        await db.SaveChangesAsync();

        var repository = scope.ServiceProvider.GetRequiredService<IRoomSnapshotRepository>();
        var (minId, maxId) = await repository.GetIdBoundsAsync();

        minId.ShouldBe(snapshots.Min(s => s.Id));
        maxId.ShouldBe(snapshots.Max(s => s.Id));
        minId.ShouldBeLessThan(maxId);
    }

    [Fact]
    public async Task ReportsZerosWhenThereAreNoSnapshots()
    {
        // The GroupBy yields no row here rather than one full of nulls, so this is the case the
        // rewrite could plausibly have got wrong.
        await ClearAsync();

        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRoomSnapshotRepository>();

        var bounds = await repository.GetIdBoundsAsync();

        bounds.ShouldBe((0, 0));
    }

    private async Task ClearAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.RoomSnapshots.ExecuteDeleteAsync();
    }

    private static RoomSnapshotEntity Snapshot(int minutesAgo) => new()
    {
        Timestamp = DateTime.UtcNow.AddMinutes(-minutesAgo),
        TotalPlayers = 10,
        TotalRooms = 2,
        PublicRooms = 2,
        PrivateRooms = 0,
        Rooms = []
    };
}
