using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Helpers;
using RetroRewindWebsite.Models.DTOs.Search;

namespace RetroRewindWebsite.Controllers;

[ApiController]
[Route("api/search")]
public class SearchController(LeaderboardDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<SearchResultDto>>> Search([FromQuery] string? q, CancellationToken cancellationToken)
    {
        var term = q?.Trim() ?? string.Empty;
        if (term.Length > 80) return BadRequest("Search must be 80 characters or fewer.");
        if (term.Length < 2) return Ok(new List<SearchResultDto>());

        var pattern = LikePattern.Contains(term);
        var compactTerm = term.Replace("-", "").Replace(" ", "");
        var canMatchFriendCode = compactTerm.Length >= 2 && compactTerm.All(char.IsDigit);
        var compactPattern = LikePattern.Contains(compactTerm);
        var players = await db.Players.AsNoTracking()
            .Where(p => !p.IsBanned && (
                EF.Functions.ILike(p.Name, pattern, LikePattern.EscapeCharacter) ||
                (canMatchFriendCode && EF.Functions.ILike(p.Fc.Replace("-", ""), compactPattern, LikePattern.EscapeCharacter)) ||
                p.Pid == term))
            .OrderByDescending(p => p.Name.ToLower() == term.ToLower())
            .ThenBy(p => p.Rank).ThenBy(p => p.Id)
            .Select(p => new { p.Name, p.Fc, p.Ev })
            .Take(6).ToListAsync(cancellationToken);

        // Query sequentially: all three reads share a scoped EF DbContext.
        var profiles = await db.TTProfiles.AsNoTracking()
            .Where(p => EF.Functions.ILike(p.DisplayName, pattern, LikePattern.EscapeCharacter))
            .OrderByDescending(p => p.DisplayName.ToLower() == term.ToLower())
            .ThenByDescending(p => p.CurrentWorldRecords).ThenBy(p => p.Id)
            .Select(p => new { p.Id, p.DisplayName })
            .Take(6).ToListAsync(cancellationToken);

        var tracks = await db.Tracks.AsNoTracking()
            .Where(t => !t.IsHidden && EF.Functions.ILike(t.Name, pattern, LikePattern.EscapeCharacter))
            .OrderByDescending(t => t.Name.ToLower() == term.ToLower())
            .ThenBy(t => t.SortOrder).ThenBy(t => t.Id)
            .Select(t => new { t.Id, t.Name, t.Category, t.Laps })
            .Take(6).ToListAsync(cancellationToken);

        var results = players.Select(p => new SearchResultDto(
            p.Name, $"VR player · {p.Fc} · {p.Ev:N0} VR", $"/vr/player/{Uri.EscapeDataString(p.Fc)}", "Players"))
            .Concat(profiles.Select(p => new SearchResultDto(
                p.DisplayName, "Time-trial player", $"/tt/player/{p.Id}", "Players")))
            .Concat(tracks.Select(t => new SearchResultDto(
                t.Name, $"{t.Category} track · {t.Laps} lap{(t.Laps == 1 ? "" : "s")}", $"/tt/150cc/{t.Id}", "Tracks")))
            .ToList();

        return Ok(results);
    }
}
