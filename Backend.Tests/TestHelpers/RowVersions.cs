using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Data;

namespace RetroRewindWebsite.Tests.TestHelpers;

/// <summary>
/// Reads the Postgres <c>xmin</c> system column, which changes on any UPDATE to a row even when
/// every value written is identical. That is the only way to tell "the row was not written" apart
/// from "the row was written with the same values" -- the distinction that matters for the write
/// amplification guards on the per-minute ranking updates.
/// </summary>
internal static class RowVersions
{
    /// <summary>
    /// Returns a map of primary key to row version for the given table, restricted to rows whose
    /// <paramref name="keyColumn"/> value is in <paramref name="keys"/>.
    /// </summary>
    public static async Task<Dictionary<long, string>> ReadAsync(
        LeaderboardDbContext db,
        string table,
        string keyColumn,
        IEnumerable<long> keys,
        CancellationToken cancellationToken = default)
    {
        var keyList = keys.ToArray();

        // Table and column names come from test code, never from request data. Doubled braces
        // are the interpolation holes; {0} stays literal as SqlQueryRaw's parameter placeholder.
        var sql = $$"""
            SELECT "{{keyColumn}}" AS "Key", xmin::text AS "Version"
            FROM "{{table}}"
            WHERE "{{keyColumn}}" = ANY({0})
            """;

        var rows = await db.Database
            .SqlQueryRaw<RowVersionRow>(sql, keyList)
            .ToListAsync(cancellationToken);

        return rows.ToDictionary(r => r.Key, r => r.Version);
    }

    private sealed record RowVersionRow(long Key, string Version);
}
