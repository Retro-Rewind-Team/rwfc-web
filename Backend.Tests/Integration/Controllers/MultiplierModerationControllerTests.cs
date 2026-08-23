using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Controllers;

[Collection("Integration")]
[Trait("Category", "Integration")]
public class MultiplierModerationControllerTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;
    private const string ValidToken = "test-secret-do-not-use-in-prod";

    public MultiplierModerationControllerTests(DatabaseFixture fixture)
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

    private HttpRequestMessage AuthedRequest(HttpMethod method, string url, object? body = null)
    {
        var request = new HttpRequestMessage(method, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", ValidToken);
        if (body != null)
            request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
        return request;
    }

    [Fact]
    public async Task Create_WithoutToken_Returns401()
    {
        var response = await _fixture.Client.PostAsJsonAsync(
            "/api/moderation/multiplier",
            new { Channel = "stable", Value = 2.0, StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddDays(1) },
            TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Create_ValidRange_ReturnsSuccessAndPersists()
    {
        var start = new DateTime(2027, 2, 1, 0, 0, 0, DateTimeKind.Utc);
        using var request = AuthedRequest(HttpMethod.Post, "/api/moderation/multiplier",
            new { Channel = "stable", Value = 2.0, StartTime = start, EndTime = start.AddDays(1) });

        var response = await _fixture.Client.SendAsync(request, TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        body.ShouldContain("\"success\":true");
    }

    [Fact]
    public async Task Create_OverlappingRange_ReturnsBadRequest()
    {
        var start = new DateTime(2027, 3, 1, 0, 0, 0, DateTimeKind.Utc);
        using (var firstRequest = AuthedRequest(HttpMethod.Post, "/api/moderation/multiplier",
            new { Channel = "stable", Value = 2.0, StartTime = start, EndTime = start.AddDays(5) }))
        {
            await _fixture.Client.SendAsync(firstRequest, TestContext.Current.CancellationToken);
        }

        using var secondRequest = AuthedRequest(HttpMethod.Post, "/api/moderation/multiplier",
            new { Channel = "stable", Value = 3.0, StartTime = start.AddDays(2), EndTime = start.AddDays(10) });
        var response = await _fixture.Client.SendAsync(secondRequest, TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetAll_WithoutToken_Returns401()
    {
        var response = await _fixture.Client.GetAsync("/api/moderation/multiplier", TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetAll_WithToken_ReturnsList()
    {
        using var request = AuthedRequest(HttpMethod.Get, "/api/moderation/multiplier");

        var response = await _fixture.Client.SendAsync(request, TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetById_UnknownId_ReturnsNotFound()
    {
        using var request = AuthedRequest(HttpMethod.Get, "/api/moderation/multiplier/-999");

        var response = await _fixture.Client.SendAsync(request, TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Update_UnknownId_ReturnsBadRequest()
    {
        var start = new DateTime(2027, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        using var request = AuthedRequest(HttpMethod.Put, "/api/moderation/multiplier/-999",
            new { Value = 2.0, StartTime = start, EndTime = start.AddDays(1) });

        var response = await _fixture.Client.SendAsync(request, TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Delete_UnknownId_ReturnsBadRequest()
    {
        using var request = AuthedRequest(HttpMethod.Delete, "/api/moderation/multiplier/-999");

        var response = await _fixture.Client.SendAsync(request, TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Delete_WithoutToken_Returns401()
    {
        var response = await _fixture.Client.DeleteAsync("/api/moderation/multiplier/1", TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task FullLifecycle_CreateThenUpdateThenDelete_Succeeds()
    {
        var start = new DateTime(2027, 5, 1, 0, 0, 0, DateTimeKind.Utc);
        using var createRequest = AuthedRequest(HttpMethod.Post, "/api/moderation/multiplier",
            new { Channel = "beta", Value = 2.0, StartTime = start, EndTime = start.AddDays(1) });
        var createResponse = await _fixture.Client.SendAsync(createRequest, TestContext.Current.CancellationToken);
        createResponse.StatusCode.ShouldBe(HttpStatusCode.OK);

        var createdJson = await createResponse.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        var id = createdJson.GetProperty("multiplier").GetProperty("id").GetInt32();

        using var updateRequest = AuthedRequest(HttpMethod.Put, $"/api/moderation/multiplier/{id}",
            new { Value = 5.0, StartTime = start, EndTime = start.AddDays(1) });
        var updateResponse = await _fixture.Client.SendAsync(updateRequest, TestContext.Current.CancellationToken);
        updateResponse.StatusCode.ShouldBe(HttpStatusCode.OK);

        using var deleteRequest = AuthedRequest(HttpMethod.Delete, $"/api/moderation/multiplier/{id}");
        var deleteResponse = await _fixture.Client.SendAsync(deleteRequest, TestContext.Current.CancellationToken);
        deleteResponse.StatusCode.ShouldBe(HttpStatusCode.OK);

        using var getRequest = AuthedRequest(HttpMethod.Get, $"/api/moderation/multiplier/{id}");
        var getResponse = await _fixture.Client.SendAsync(getRequest, TestContext.Current.CancellationToken);
        getResponse.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }
}
