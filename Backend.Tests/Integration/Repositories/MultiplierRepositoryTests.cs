using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.Multiplier;
using RetroRewindWebsite.Repositories.Multiplier;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Repositories;

[Collection("Integration")]
[Trait("Category", "Integration")]
public class MultiplierRepositoryTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;

    public MultiplierRepositoryTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    public ValueTask InitializeAsync() => ValueTask.CompletedTask;

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.Multipliers.ExecuteDeleteAsync();
    }

    private static MultiplierEntity NewMultiplier(
        MultiplierChannel channel, double value, DateTime start, DateTime end) => new()
        {
            Channel = channel,
            Value = value,
            StartTime = start,
            EndTime = end,
            CreatedAt = DateTime.UtcNow
        };

    [Fact]
    public async Task CreateAsync_PersistsAndAssignsId()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IMultiplierRepository>();

        var created = await repository.CreateAsync(NewMultiplier(
            MultiplierChannel.Stable, 2.0,
            new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc)));

        created.Id.ShouldBeGreaterThan(0);

        var fetched = await repository.GetByIdAsync(created.Id);
        fetched.ShouldNotBeNull();
        fetched.Value.ShouldBe(2.0);
    }

    [Fact]
    public async Task GetByIdAsync_UnknownId_ReturnsNull()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IMultiplierRepository>();

        var result = await repository.GetByIdAsync(-999);

        result.ShouldBeNull();
    }

    [Fact]
    public async Task GetActiveAsync_RangeCoversNow_ReturnsIt()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IMultiplierRepository>();

        var now = DateTime.UtcNow;
        await repository.CreateAsync(NewMultiplier(
            MultiplierChannel.Beta, 3.0, now.AddHours(-1), now.AddHours(1)));

        var active = await repository.GetActiveAsync(MultiplierChannel.Beta, now);

        active.ShouldNotBeNull();
        active.Value.ShouldBe(3.0);
    }

    [Fact]
    public async Task GetActiveAsync_NoRangeCoversNow_ReturnsNull()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IMultiplierRepository>();

        var now = DateTime.UtcNow;
        await repository.CreateAsync(NewMultiplier(
            MultiplierChannel.Stable, 2.5, now.AddDays(-2), now.AddDays(-1)));

        var active = await repository.GetActiveAsync(MultiplierChannel.Stable, now);

        active.ShouldBeNull();
    }

    [Fact]
    public async Task GetActiveAsync_DifferentChannel_IsIgnored()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IMultiplierRepository>();

        var now = DateTime.UtcNow;
        await repository.CreateAsync(NewMultiplier(
            MultiplierChannel.Beta, 4.0, now.AddHours(-1), now.AddHours(1)));

        var active = await repository.GetActiveAsync(MultiplierChannel.Stable, now);

        active.ShouldBeNull();
    }

    [Fact]
    public async Task GetOverlappingAsync_OverlappingRange_IsReturned()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IMultiplierRepository>();

        var start = new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(2026, 2, 5, 0, 0, 0, DateTimeKind.Utc);
        await repository.CreateAsync(NewMultiplier(MultiplierChannel.Stable, 2.0, start, end));

        // New range [Feb 3, Feb 10) overlaps the existing [Feb 1, Feb 5)
        var overlapping = await repository.GetOverlappingAsync(
            MultiplierChannel.Stable, start.AddDays(2), end.AddDays(5));

        overlapping.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task GetOverlappingAsync_AdjacentNonOverlappingRange_IsNotReturned()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IMultiplierRepository>();

        var start = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(2026, 3, 5, 0, 0, 0, DateTimeKind.Utc);
        await repository.CreateAsync(NewMultiplier(MultiplierChannel.Stable, 2.0, start, end));

        // New range starts exactly when the existing one ends -- back-to-back, not overlapping
        var overlapping = await repository.GetOverlappingAsync(
            MultiplierChannel.Stable, end, end.AddDays(4));

        overlapping.ShouldBeEmpty();
    }

    [Fact]
    public async Task GetOverlappingAsync_ExcludesGivenId()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IMultiplierRepository>();

        var start = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(2026, 4, 5, 0, 0, 0, DateTimeKind.Utc);
        var existing = await repository.CreateAsync(NewMultiplier(MultiplierChannel.Stable, 2.0, start, end));

        var overlapping = await repository.GetOverlappingAsync(
            MultiplierChannel.Stable, start, end, excludeId: existing.Id);

        overlapping.ShouldBeEmpty();
    }

    [Fact]
    public async Task UpdateAsync_PersistsChanges()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IMultiplierRepository>();

        var created = await repository.CreateAsync(NewMultiplier(
            MultiplierChannel.Stable, 2.0,
            new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc)));

        created.Value = 9.0;
        await repository.UpdateAsync(created);

        var fetched = await repository.GetByIdAsync(created.Id);
        fetched!.Value.ShouldBe(9.0);
    }

    [Fact]
    public async Task DeleteAsync_RemovesEntry_ReturnsTrue()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IMultiplierRepository>();

        var created = await repository.CreateAsync(NewMultiplier(
            MultiplierChannel.Stable, 2.0,
            new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 6, 2, 0, 0, 0, DateTimeKind.Utc)));

        var deleted = await repository.DeleteAsync(created.Id);

        deleted.ShouldBeTrue();
        (await repository.GetByIdAsync(created.Id)).ShouldBeNull();
    }

    [Fact]
    public async Task DeleteAsync_UnknownId_ReturnsFalse()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IMultiplierRepository>();

        var deleted = await repository.DeleteAsync(-999);

        deleted.ShouldBeFalse();
    }
}
