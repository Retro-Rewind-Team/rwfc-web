using RetroRewindWebsite.Helpers;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Unit.Helpers;

/// <summary>
/// Search terms are interpolated into an ILIKE pattern. Without escaping, a user typing '%' asks
/// the database to match every row, and '_' silently matches any single character, so a search for
/// "a_c" also returns "abc". Neither is an injection (the pattern is still a parameter), but both
/// are wrong answers, and a term of "%%%%" is a free full table scan.
/// </summary>
public class LikePatternTests
{
    [Fact]
    public void WrapsAnOrdinaryTermInWildcards()
    {
        LikePattern.Contains("mario").ShouldBe("%mario%");
    }

    [Fact]
    public void EscapesPercentSoItMatchesALiteralPercent()
    {
        LikePattern.Contains("100%").ShouldBe(@"%100\%%");
    }

    [Fact]
    public void EscapesUnderscoreSoItDoesNotMatchAnySingleCharacter()
    {
        LikePattern.Contains("a_c").ShouldBe(@"%a\_c%");
    }

    [Fact]
    public void EscapesTheEscapeCharacterItself()
    {
        LikePattern.Contains(@"back\slash").ShouldBe(@"%back\\slash%");
    }

    [Fact]
    public void EscapesTheBackslashBeforeTheWildcardsSoNeitherIsDoubleEscaped()
    {
        // Escaping in the wrong order turns \ into \\ and then the % into \%, producing \\\% and
        // an ILIKE that matches nothing.
        LikePattern.Contains(@"\%").ShouldBe(@"%\\\%%");
    }

    [Fact]
    public void APureWildcardTermBecomesALiteralSearchRatherThanMatchEverything()
    {
        LikePattern.Contains("%").ShouldBe(@"%\%%");
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void AnEmptyTermStillProducesAMatchAllPattern(string? term)
    {
        // Callers guard against empty search before calling, but the helper should not throw.
        LikePattern.Contains(term).ShouldBe("%%");
    }
}
