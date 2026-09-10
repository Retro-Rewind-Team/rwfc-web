namespace RetroRewindWebsite.Helpers;

/// <summary>
/// Builds ILIKE patterns from user-supplied search terms.
/// </summary>
public static class LikePattern
{
    /// <summary>
    /// The escape character these patterns are built against. Pass it as the third argument to
    /// <c>EF.Functions.ILike</c>, otherwise the escapes added here are matched literally.
    /// </summary>
    public const string EscapeCharacter = "\\";

    /// <summary>
    /// Wraps a search term in wildcards for a "contains" match, escaping any wildcard the user
    /// typed so it matches literally.
    /// </summary>
    /// <remarks>
    /// The pattern is still passed as a parameter, so this is not about injection. It is about
    /// giving the right answer: unescaped, a search for "a_c" also returns "abc", and a search for
    /// "%" asks the database to return every row, which on the players table is a full scan handed
    /// out to anyone who types one character.
    /// </remarks>
    public static string Contains(string? term) => $"%{Escape(term)}%";

    /// <summary>
    /// Escapes the three characters that carry meaning inside a LIKE pattern. The backslash goes
    /// first: escaping it after the wildcards would also escape the backslashes just added, turning
    /// every wildcard into a pattern that matches nothing.
    /// </summary>
    private static string Escape(string? term) =>
        string.IsNullOrEmpty(term)
            ? string.Empty
            : term.Replace("\\", "\\\\")
                  .Replace("%", "\\%")
                  .Replace("_", "\\_");
}
