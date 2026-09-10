using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using System.Net;
using System.Net.Http.Headers;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Middleware;

/// <summary>
/// The moderation gate. These previously lived in <c>RoomStatusControllerTests</c>, which had
/// nothing to do with authentication.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class ApiKeyAuthenticationTests
{
    private const string ModerationEndpoint = "/api/moderation/suspicious-jumps/any-pid";
    private const string ValidSecret = "test-secret-do-not-use-in-prod";

    private readonly HttpClient _client;

    public ApiKeyAuthenticationTests(DatabaseFixture fixture)
    {
        _client = fixture.Client;
    }

    [Fact]
    public async Task ModerationEndpoint_WithoutToken_Returns401()
    {
        var response = await _client.GetAsync(ModerationEndpoint, TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData("wrong-secret")]
    [InlineData("")]
    // A prefix of the real secret: the compare is constant-time, but it must still reject.
    [InlineData("test-secret")]
    // The real secret with one character appended.
    [InlineData(ValidSecret + "x")]
    public async Task ModerationEndpoint_WithWrongToken_Returns401(string token)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, ModerationEndpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request, TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ModerationEndpoint_WithCorrectToken_PassesAuthGate()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, ModerationEndpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", ValidSecret);

        var response = await _client.SendAsync(request, TestContext.Current.CancellationToken);

        // Whatever the endpoint decides about the pid, it is past the gate.
        response.StatusCode.ShouldNotBe(HttpStatusCode.Unauthorized);
        response.StatusCode.ShouldNotBe(HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task ModerationEndpoint_WithNonBearerScheme_Returns401()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, ModerationEndpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", ValidSecret);

        var response = await _client.SendAsync(request, TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData("/api/leaderboard?page=1&pageSize=1")]
    [InlineData("/api/health/live")]
    public async Task NonModerationEndpoints_AreReachableWithoutAToken(string endpoint)
    {
        // The gate keys off the path prefix, so it must not creep onto public routes.
        var response = await _client.GetAsync(endpoint, TestContext.Current.CancellationToken);

        response.StatusCode.ShouldNotBe(HttpStatusCode.Unauthorized);
    }
}
