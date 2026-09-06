using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.DTOs.Multiplier;
using RetroRewindWebsite.Services.Application;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Services;

[Collection("Integration")]
[Trait("Category", "Integration")]
public class MultiplierServiceTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;

    public MultiplierServiceTests(DatabaseFixture fixture)
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

    // ===== GetActiveValueAsync =====

    [Fact]
    public async Task GetActiveValueAsync_NoActiveRange_ReturnsOne()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IMultiplierService>();

        var value = await service.GetActiveValueAsync("stable");

        value.ShouldBe(1.0);
    }

    [Fact]
    public async Task GetActiveValueAsync_ActiveRange_ReturnsItsValue()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IMultiplierService>();

        var now = DateTime.UtcNow;
        await service.CreateAsync(new CreateMultiplierRequest
        {
            Channel = "beta",
            Value = 1.5,
            StartTime = now.AddHours(-1),
            EndTime = now.AddHours(1)
        });

        var value = await service.GetActiveValueAsync("beta");

        value.ShouldBe(1.5);
    }

    [Fact]
    public async Task GetActiveValueAsync_ChannelIsCaseInsensitive()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IMultiplierService>();

        var now = DateTime.UtcNow;
        await service.CreateAsync(new CreateMultiplierRequest
        {
            Channel = "Beta",
            Value = 2.0,
            StartTime = now.AddHours(-1),
            EndTime = now.AddHours(1)
        });

        var value = await service.GetActiveValueAsync("BETA");

        value.ShouldBe(2.0);
    }

    [Fact]
    public async Task GetActiveValueAsync_NullOrEmptyChannel_DefaultsToStable()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IMultiplierService>();

        var now = DateTime.UtcNow;
        await service.CreateAsync(new CreateMultiplierRequest
        {
            Channel = "stable",
            Value = 3.0,
            StartTime = now.AddHours(-1),
            EndTime = now.AddHours(1)
        });

        (await service.GetActiveValueAsync(null!)).ShouldBe(3.0);
        (await service.GetActiveValueAsync("")).ShouldBe(3.0);
    }

    [Fact]
    public async Task GetActiveValueAsync_UnknownChannel_ThrowsArgumentException()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IMultiplierService>();

        await Should.ThrowAsync<ArgumentException>(() => service.GetActiveValueAsync("nightly"));
    }

    // ===== CreateAsync =====

    [Fact]
    public async Task CreateAsync_ValidRange_PersistsAndReturnsSuccess()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IMultiplierService>();

        var start = new DateTime(2026, 7, 1, 0, 0, 0, DateTimeKind.Utc);
        var result = await service.CreateAsync(new CreateMultiplierRequest
        {
            Channel = "stable",
            Value = 2.0,
            StartTime = start,
            EndTime = start.AddDays(1)
        });

        result.Success.ShouldBeTrue();
        result.Multiplier.ShouldNotBeNull();
        result.Multiplier.Id.ShouldBeGreaterThan(0);
    }

    [Fact]
    public async Task CreateAsync_EndNotAfterStart_ReturnsFailure()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IMultiplierService>();

        var start = new DateTime(2026, 7, 5, 0, 0, 0, DateTimeKind.Utc);
        var result = await service.CreateAsync(new CreateMultiplierRequest
        {
            Channel = "stable",
            Value = 2.0,
            StartTime = start,
            EndTime = start
        });

        result.Success.ShouldBeFalse();
    }

    [Fact]
    public async Task CreateAsync_InvalidChannel_ReturnsFailure()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IMultiplierService>();

        var start = new DateTime(2026, 7, 10, 0, 0, 0, DateTimeKind.Utc);
        var result = await service.CreateAsync(new CreateMultiplierRequest
        {
            Channel = "nightly",
            Value = 2.0,
            StartTime = start,
            EndTime = start.AddDays(1)
        });

        result.Success.ShouldBeFalse();
    }

    [Fact]
    public async Task CreateAsync_OverlapsExistingRange_ReturnsFailure()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IMultiplierService>();

        var start = new DateTime(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(2026, 8, 5, 0, 0, 0, DateTimeKind.Utc);
        await service.CreateAsync(new CreateMultiplierRequest
        {
            Channel = "stable",
            Value = 2.0,
            StartTime = start,
            EndTime = end
        });

        var result = await service.CreateAsync(new CreateMultiplierRequest
        {
            Channel = "stable",
            Value = 3.0,
            StartTime = start.AddDays(2),
            EndTime = end.AddDays(2)
        });

        result.Success.ShouldBeFalse();
    }

    // ===== GetAllAsync / GetByIdAsync =====

    [Fact]
    public async Task GetAllAsync_FiltersByChannel()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IMultiplierService>();

        var start = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc);
        await service.CreateAsync(new CreateMultiplierRequest { Channel = "stable", Value = 2.0, StartTime = start, EndTime = start.AddDays(1) });
        await service.CreateAsync(new CreateMultiplierRequest { Channel = "beta", Value = 3.0, StartTime = start, EndTime = start.AddDays(1) });

        var result = await service.GetAllAsync("beta");

        result.Count.ShouldBe(1);
        result.Multipliers[0].Channel.ShouldBe("Beta");
    }

    [Fact]
    public async Task GetByIdAsync_UnknownId_ReturnsNull()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IMultiplierService>();

        (await service.GetByIdAsync(-999)).ShouldBeNull();
    }

    // ===== UpdateAsync =====

    [Fact]
    public async Task UpdateAsync_ValidChange_Persists()
    {
        var start = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);

        // Create and update each use their own DI scope (and therefore their own DbContext),
        // mirroring how these calls are always in separate HTTP requests in production. See
        // GhostBlobFlowTests.DeleteGhostAsync_CascadesBlobDeletion for the same pattern.
        int createdId;
        using (var createScope = _fixture.Factory.Services.CreateScope())
        {
            var createService = createScope.ServiceProvider.GetRequiredService<IMultiplierService>();
            var created = await createService.CreateAsync(new CreateMultiplierRequest
            {
                Channel = "stable",
                Value = 2.0,
                StartTime = start,
                EndTime = start.AddDays(1)
            });
            createdId = created.Multiplier!.Id;
        }

        using var updateScope = _fixture.Factory.Services.CreateScope();
        var updateService = updateScope.ServiceProvider.GetRequiredService<IMultiplierService>();
        var result = await updateService.UpdateAsync(createdId, new UpdateMultiplierRequest
        {
            Value = 9.0,
            StartTime = start,
            EndTime = start.AddDays(1)
        });

        result.Success.ShouldBeTrue();
        result.Multiplier!.Value.ShouldBe(9.0);
    }

    [Fact]
    public async Task UpdateAsync_UnknownId_ReturnsFailure()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IMultiplierService>();

        var start = new DateTime(2026, 10, 5, 0, 0, 0, DateTimeKind.Utc);
        var result = await service.UpdateAsync(-999, new UpdateMultiplierRequest
        {
            Value = 9.0,
            StartTime = start,
            EndTime = start.AddDays(1)
        });

        result.Success.ShouldBeFalse();
    }

    [Fact]
    public async Task UpdateAsync_OverlapsAnotherRange_ReturnsFailure()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IMultiplierService>();

        var start = new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(2026, 11, 5, 0, 0, 0, DateTimeKind.Utc);
        await service.CreateAsync(new CreateMultiplierRequest { Channel = "stable", Value = 2.0, StartTime = start, EndTime = end });

        var second = await service.CreateAsync(new CreateMultiplierRequest
        {
            Channel = "stable",
            Value = 3.0,
            StartTime = end,
            EndTime = end.AddDays(4)
        });
        second.Success.ShouldBeTrue();

        // Try to stretch the second range back so it overlaps the first
        var result = await service.UpdateAsync(second.Multiplier!.Id, new UpdateMultiplierRequest
        {
            Value = 3.0,
            StartTime = start.AddDays(2),
            EndTime = end.AddDays(4)
        });

        result.Success.ShouldBeFalse();
    }

    [Fact]
    public async Task UpdateAsync_DoesNotOverlapItself()
    {
        var start = new DateTime(2026, 12, 1, 0, 0, 0, DateTimeKind.Utc);

        int createdId;
        using (var createScope = _fixture.Factory.Services.CreateScope())
        {
            var createService = createScope.ServiceProvider.GetRequiredService<IMultiplierService>();
            var created = await createService.CreateAsync(new CreateMultiplierRequest
            {
                Channel = "stable",
                Value = 2.0,
                StartTime = start,
                EndTime = start.AddDays(1)
            });
            createdId = created.Multiplier!.Id;
        }

        // Update the range's own value without moving the window -- must not be rejected
        // as "overlapping itself"
        using var updateScope = _fixture.Factory.Services.CreateScope();
        var updateService = updateScope.ServiceProvider.GetRequiredService<IMultiplierService>();
        var result = await updateService.UpdateAsync(createdId, new UpdateMultiplierRequest
        {
            Value = 5.0,
            StartTime = start,
            EndTime = start.AddDays(1)
        });

        result.Success.ShouldBeTrue();
    }

    // ===== DeleteAsync =====

    [Fact]
    public async Task DeleteAsync_RemovesEntry_ReturnsSuccess()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IMultiplierService>();

        var start = new DateTime(2027, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var created = await service.CreateAsync(new CreateMultiplierRequest
        {
            Channel = "stable",
            Value = 2.0,
            StartTime = start,
            EndTime = start.AddDays(1)
        });

        var result = await service.DeleteAsync(created.Multiplier!.Id);

        result.Success.ShouldBeTrue();
        (await service.GetByIdAsync(created.Multiplier.Id)).ShouldBeNull();
    }

    [Fact]
    public async Task DeleteAsync_UnknownId_ReturnsFailure()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IMultiplierService>();

        var result = await service.DeleteAsync(-999);

        result.Success.ShouldBeFalse();
    }
}
