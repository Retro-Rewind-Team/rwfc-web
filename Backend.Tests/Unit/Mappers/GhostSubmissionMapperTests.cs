using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.DTOs.TimeTrial;
using RetroRewindWebsite.Models.Entities.TimeTrial;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Unit.Mappers;

/// <summary>
/// Leaderboard ranks are Olympic: tied runs share a rank and the next distinct time skips the
/// slots the tie used. A page cannot see the rows before it, so the rank its first row starts on
/// has to be supplied; getting that wrong shows up as a tie that changes rank halfway down a page
/// boundary.
/// </summary>
[Trait("Category", "Unit")]
public class GhostSubmissionMapperTests
{
    [Fact]
    public void TiedTimesShareARankAndTheNextDistinctTimeSkipsIt()
    {
        var page = Submissions(90_000, 95_000, 95_000, 99_000);

        var ranks = Ranks(GhostSubmissionMapper.ToLeaderboardDtos(page, pageOffset: 0, NoGhostFiles()));

        ranks.ShouldBe([1, 2, 2, 4]);
    }

    [Fact]
    public void RanksContinueFromThePageOffset()
    {
        var page = Submissions(90_000, 95_000);

        var ranks = Ranks(GhostSubmissionMapper.ToLeaderboardDtos(page, pageOffset: 25, NoGhostFiles()));

        ranks.ShouldBe([26, 27]);
    }

    [Fact]
    public void ATieCarriedOverFromThePreviousPageKeepsThatPagesRank()
    {
        // Page 1 ended on 95_000, part of a tie group that started at rank 24. This page opens on
        // the same time, so it is still rank 24 rather than the 26 that pageOffset + 1 would give.
        // The group therefore occupies positions 24 through 26, and the next distinct time is 27.
        var page = Submissions(95_000, 99_000);

        var ranks = Ranks(GhostSubmissionMapper.ToLeaderboardDtos(
            page, pageOffset: 25, NoGhostFiles(), firstRank: 24));

        ranks.ShouldBe([24, 27]);
    }

    [Fact]
    public void FlapRanksUseTheFastestLapNotTheFinishTime()
    {
        // Ordered by fastest lap, so the finish times are deliberately not in order.
        var page = new List<GhostSubmissionEntity>
        {
            Submission(finishTimeMs: 99_000, lapSplitsMs: [30_000, 31_000, 38_000]),
            Submission(finishTimeMs: 90_000, lapSplitsMs: [30_000, 30_000, 30_000]),
            Submission(finishTimeMs: 95_000, lapSplitsMs: [31_000, 32_000, 32_000])
        };

        var ranks = Ranks(GhostSubmissionMapper.ToFlapLeaderboardDtos(page, pageOffset: 0, NoGhostFiles()));

        // The first two share a 30_000 fastest lap despite finishing 9 seconds apart.
        ranks.ShouldBe([1, 1, 3]);
    }

    [Fact]
    public void AFlapTieCarriedOverFromThePreviousPageKeepsThatPagesRank()
    {
        var page = new List<GhostSubmissionEntity>
        {
            Submission(finishTimeMs: 99_000, lapSplitsMs: [30_000, 31_000, 38_000]),
            Submission(finishTimeMs: 95_000, lapSplitsMs: [31_000, 32_000, 32_000])
        };

        // The 30_000 group started at rank 9 and runs through position 11, so the slower lap that
        // follows it is rank 12.
        var ranks = Ranks(GhostSubmissionMapper.ToFlapLeaderboardDtos(
            page, pageOffset: 10, NoGhostFiles(), firstRank: 9));

        ranks.ShouldBe([9, 12]);
    }

    [Fact]
    public void AnEmptyPageMapsToNothing()
    {
        GhostSubmissionMapper
            .ToLeaderboardDtos([], pageOffset: 0, NoGhostFiles())
            .ShouldBeEmpty();
    }

    private static List<int?> Ranks(IEnumerable<GhostSubmissionDetailDto> dtos) =>
        [.. dtos.Select(d => d.Rank)];

    private static HashSet<int> NoGhostFiles() => [];

    private static List<GhostSubmissionEntity> Submissions(params int[] finishTimesMs) =>
        [.. finishTimesMs.Select(t => Submission(t, [t / 3, t / 3, t - (2 * (t / 3))]))];

    private static GhostSubmissionEntity Submission(int finishTimeMs, List<int> lapSplitsMs) =>
        new()
        {
            TrackId = 1,
            TTProfileId = 1,
            CC = 150,
            FinishTimeMs = finishTimeMs,
            FinishTimeDisplay = GhostSubmissionMapper.FormatLapTime(finishTimeMs),
            MiiName = "tester",
            LapCount = (byte)lapSplitsMs.Count,
            LapSplitsMs = lapSplitsMs,
            VehicleId = 0,
            DateSet = new DateOnly(2026, 6, 1),
            SubmittedAt = new DateTime(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc)
        };
}
