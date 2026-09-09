namespace RetroRewindWebsite.Models.Domain;

/// <summary>
/// How long computed race statistics are held in memory. These endpoints run whole-table
/// aggregates over RaceResults, so without a server-side cache every request pays the full cost.
/// Bound from the "RaceStatsCache" configuration section; zero disables caching for that group,
/// which is what the integration tests use so they always observe freshly seeded data.
/// </summary>
public sealed class RaceStatsCacheOptions
{
    public const string SectionName = "RaceStatsCache";

    /// <summary>Lifetime of the global stats response, per <c>days</c> filter.</summary>
    public int GlobalSeconds { get; set; } = 300;

    /// <summary>Lifetime of per-player stats and analytics, per filter combination.</summary>
    public int PlayerSeconds { get; set; } = 120;
}
