using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using System.Net;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Controllers;

[Collection("Integration")]
[Trait("Category", "Integration")]
public class HealthControllerTests
{
    private readonly HttpClient _client;

    public HealthControllerTests(DatabaseFixture fixture)
    {
        _client = fixture.Client;
    }

    [Fact]
    public async Task GetHealthLive_ReturnsOk()
    {
        // /api/health/live uses Predicate = _ => false, so no checks run — always 200
        var response = await _client.GetAsync("/api/health/live");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetHealth_ReturnsJsonWithStatusAndChecksFields()
    {
        var response = await _client.GetAsync("/api/health");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var json = await response.Content.ReadAsStringAsync();
        json.ShouldContain("\"status\"");
        json.ShouldContain("\"checks\"");
    }
}
