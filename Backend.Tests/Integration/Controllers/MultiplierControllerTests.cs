using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using System.Net;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Controllers;

[Collection("Integration")]
[Trait("Category", "Integration")]
public class MultiplierControllerTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;

    public MultiplierControllerTests(DatabaseFixture fixture)
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

    [Fact]
    public async Task Get_NoActiveMultiplier_ReturnsOneAsPlainText()
    {
        var response = await _fixture.Client.GetAsync("/api/multiplier", TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        response.Content.Headers.ContentType!.MediaType.ShouldBe("text/plain");
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        body.ShouldBe("1");
    }

    [Fact]
    public async Task Get_ActiveStableMultiplier_ReturnsItsValue()
    {
        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
            db.Multipliers.Add(new Models.Entities.Multiplier.MultiplierEntity
            {
                Channel = Models.Entities.Multiplier.MultiplierChannel.Stable,
                Value = 2.5,
                StartTime = DateTime.UtcNow.AddHours(-1),
                EndTime = DateTime.UtcNow.AddHours(1),
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        var response = await _fixture.Client.GetAsync("/api/multiplier", TestContext.Current.CancellationToken);

        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        body.ShouldBe("2.5");
    }

    [Fact]
    public async Task Get_ChannelQueryParam_SelectsThatChannel()
    {
        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
            db.Multipliers.Add(new Models.Entities.Multiplier.MultiplierEntity
            {
                Channel = Models.Entities.Multiplier.MultiplierChannel.Beta,
                Value = 3.0,
                StartTime = DateTime.UtcNow.AddHours(-1),
                EndTime = DateTime.UtcNow.AddHours(1),
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        var stableResponse = await _fixture.Client.GetAsync("/api/multiplier", TestContext.Current.CancellationToken);
        var betaResponse = await _fixture.Client.GetAsync("/api/multiplier?channel=beta", TestContext.Current.CancellationToken);

        (await stableResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken)).ShouldBe("1");
        (await betaResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken)).ShouldBe("3");
    }

    [Fact]
    public async Task Get_UnknownChannel_ReturnsBadRequest()
    {
        var response = await _fixture.Client.GetAsync("/api/multiplier?channel=nightly", TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Get_DoesNotRequireAuthentication()
    {
        // No Authorization header attached -- this is a public endpoint, unlike /api/moderation/*
        var response = await _fixture.Client.GetAsync("/api/multiplier", TestContext.Current.CancellationToken);

        response.StatusCode.ShouldNotBe(HttpStatusCode.Unauthorized);
    }
}
