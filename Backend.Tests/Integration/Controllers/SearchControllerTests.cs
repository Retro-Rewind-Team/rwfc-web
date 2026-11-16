using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.DTOs.Search;
using RetroRewindWebsite.Models.Entities.Player;
using RetroRewindWebsite.Models.Entities.TimeTrial;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Controllers;

[Collection("Integration")]
[Trait("Category", "Integration")]
public class SearchControllerTests(DatabaseFixture fixture)
{
    [Fact]
    public async Task Search_FindsPlayersProfilesAndTracks_WithoutHiddenOrBannedEntries()
    {
        var ct = TestContext.Current.CancellationToken;
        var prefix = $"Search{Guid.NewGuid():N}";
        using var scope = fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        var visible = new TrackEntity { Name = prefix + "100% Circuit", Category = "retro", Laps = 3 };
        var hidden = new TrackEntity { Name = prefix + "Hidden", Category = "retro", Laps = 3, IsHidden = true };
        var decoy = new TrackEntity { Name = prefix + "100x Circuit", Category = "retro", Laps = 3 };
        var profile = new TTProfileEntity { DisplayName = prefix + "Racer" };
        var player = new PlayerEntity { Pid = prefix, Name = prefix + "Racer", Fc = "9123-4567-8901", MiiData = "" };
        var banned = new PlayerEntity { Pid = prefix + "ban", Name = prefix + "Banned", Fc = "9123-4567-8902", MiiData = "", IsBanned = true };
        db.Tracks.AddRange(visible, hidden, decoy);
        db.TTProfiles.Add(profile);
        db.Players.AddRange(player, banned);
        await db.SaveChangesAsync(ct);

        try
        {
            var results = (await fixture.Client.GetFromJsonAsync<List<SearchResultDto>>($"/api/search?q={prefix}", ct))!;
            results.Count.ShouldBe(4);
            results.ShouldContain(r => r.Href == $"/vr/player/{player.Fc}");
            results.ShouldContain(r => r.Href == $"/tt/player/{profile.Id}");
            results.ShouldContain(r => r.Href == $"/tt/150cc/{visible.Id}");
            results.ShouldNotContain(r => r.Title == hidden.Name || r.Title == banned.Name);

            var byCode = (await fixture.Client.GetFromJsonAsync<List<SearchResultDto>>("/api/search?q=912345678901", ct))!;
            byCode.ShouldContain(r => r.Title == player.Name);
            var literal = (await fixture.Client.GetFromJsonAsync<List<SearchResultDto>>($"/api/search?q={prefix}100%25", ct))!;
            literal.Count.ShouldBe(1);
            literal[0].Title.ShouldBe(visible.Name);
        }
        finally
        {
            await db.Tracks.Where(t => t.Name.StartsWith(prefix)).ExecuteDeleteAsync(ct);
            await db.TTProfiles.Where(p => p.DisplayName.StartsWith(prefix)).ExecuteDeleteAsync(ct);
            await db.Players.Where(p => p.Pid.StartsWith(prefix)).ExecuteDeleteAsync(ct);
        }
    }

    [Theory]
    [InlineData("", HttpStatusCode.OK)]
    [InlineData("x", HttpStatusCode.OK)]
    [InlineData("--", HttpStatusCode.OK)]
    public async Task Search_EmptyOrPunctuationDoesNotReturnAllPlayers(string query, HttpStatusCode status)
    {
        var response = await fixture.Client.GetAsync($"/api/search?q={query}", TestContext.Current.CancellationToken);
        response.StatusCode.ShouldBe(status);
        var results = await response.Content.ReadFromJsonAsync<List<SearchResultDto>>(TestContext.Current.CancellationToken);
        results.ShouldBeEmpty();
    }

    [Fact]
    public async Task Search_RejectsOverlongQueries()
    {
        var response = await fixture.Client.GetAsync($"/api/search?q={new string('a', 81)}", TestContext.Current.CancellationToken);
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }
}
