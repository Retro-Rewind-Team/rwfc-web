using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using System.Net;
using System.Net.Http.Headers;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Controllers;

[Collection("Integration")]
[Trait("Category", "Integration")]
public class RoomStatusControllerTests
{
    private readonly HttpClient _client;

    public RoomStatusControllerTests(DatabaseFixture fixture)
    {
        _client = fixture.Client;
    }

    [Fact]
    public async Task GetLatestStatus_WhenCacheEmpty_ReturnsSuccessNotServerError()
    {
        // The in-memory live cache starts empty on test startup.
        // The endpoint should return gracefully (200/204/404), never 500.
        var response = await _client.GetAsync("/api/roomstatus");
        ((int)response.StatusCode).ShouldBeInRange(200, 499);
    }

    [Fact]
    public async Task ModerationEndpoint_WithoutToken_Returns401()
    {
        var response = await _client.GetAsync("/api/moderation/suspicious-jumps/any-pid");
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ModerationEndpoint_WithWrongToken_Returns401()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/moderation/suspicious-jumps/any-pid");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "wrong-secret");
        var response = await _client.SendAsync(request);
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ModerationEndpoint_WithCorrectToken_PassesAuthGate()
    {
        // Auth passes — response code depends on whether pid exists, but must not be 401/500
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/moderation/suspicious-jumps/any-pid");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "test-secret-do-not-use-in-prod");
        var response = await _client.SendAsync(request);
        response.StatusCode.ShouldNotBe(HttpStatusCode.Unauthorized);
        response.StatusCode.ShouldNotBe(HttpStatusCode.InternalServerError);
    }
}
