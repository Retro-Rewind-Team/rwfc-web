namespace TrackSync;

public record DbTrack(
    int Id, string Name, short CourseId, int SortOrder,
    bool IsHidden, string Category, short Laps, bool SupportsGlitch);

public record CourseIdChange(int TrackId, string Name, short OldCourseId, short NewCourseId);
public record SortOrderChange(int TrackId, string Name, int OldSortOrder, int NewSortOrder);
public record NewTrack(string Name, short CourseId, int SortOrder);
public record HiddenTrack(int TrackId, string Name);
public record ReactivatedTrack(int TrackId, string Name);

public record DiffResult(
    List<CourseIdChange> CourseIdChanges,
    List<SortOrderChange> SortOrderChanges,
    List<NewTrack> NewTracks,
    List<HiddenTrack> HiddenTracks,
    List<ReactivatedTrack> ReactivatedTracks,
    List<string> Warnings);

public static class DiffEngine
{
    public static DiffResult Compute(List<CsvTrackEntry> csvEntries, List<DbTrack> dbTracks)
    {
        var dbDuplicates = dbTracks.GroupBy(t => t.Name).Where(g => g.Count() > 1).Select(g => g.Key).ToList();
        if (dbDuplicates.Count > 0)
            throw new InvalidOperationException($"Duplicate track names in DB: {string.Join(", ", dbDuplicates)}");

        var csvByName = csvEntries.ToDictionary(e => e.Name);
        var dbByName  = dbTracks.ToDictionary(t => t.Name);

        var courseIdChanges   = new List<CourseIdChange>();
        var sortOrderChanges  = new List<SortOrderChange>();
        var newTracks         = new List<NewTrack>();
        var hiddenTracks      = new List<HiddenTrack>();
        var reactivatedTracks = new List<ReactivatedTrack>();
        var warnings          = new List<string>();

        foreach (var csv in csvEntries)
        {
            if (!dbByName.TryGetValue(csv.Name, out var db))
            {
                newTracks.Add(new NewTrack(csv.Name, csv.CourseId, csv.SortOrder));
                continue;
            }

            if (db.IsHidden)
                reactivatedTracks.Add(new ReactivatedTrack(db.Id, db.Name));

            if (db.CourseId != csv.CourseId)
                courseIdChanges.Add(new CourseIdChange(db.Id, db.Name, db.CourseId, csv.CourseId));

            if (db.SortOrder != csv.SortOrder)
                sortOrderChanges.Add(new SortOrderChange(db.Id, db.Name, db.SortOrder, csv.SortOrder));
        }

        foreach (var db in dbTracks.Where(t => !t.IsHidden && !csvByName.ContainsKey(t.Name)))
            hiddenTracks.Add(new HiddenTrack(db.Id, db.Name));

        // Warn if tracks sharing an old CourseId get different new CourseIds
        foreach (var group in courseIdChanges.GroupBy(c => c.OldCourseId))
        {
            var distinctNew = group.Select(c => c.NewCourseId).Distinct().ToList();
            if (distinctNew.Count > 1)
                warnings.Add(
                    $"WARNING: CourseId {group.Key} is shared by multiple tracks but they have inconsistent new CourseIds: " +
                    string.Join(", ", group.Select(c => $"{c.Name}→{c.NewCourseId}")));
        }

        return new DiffResult(courseIdChanges, sortOrderChanges, newTracks, hiddenTracks, reactivatedTracks, warnings);
    }

    public static List<(short OldCourseId, short NewCourseId)> GetDistinctCourseMappings(DiffResult diff) =>
        diff.CourseIdChanges
            .Select(c => (c.OldCourseId, c.NewCourseId))
            .DistinctBy(m => m.OldCourseId)
            .ToList();
}

public static class CategoryInferrer
{
    private static readonly string[] RetroPrefixes =
        ["Wii U ", "SW2 ", "3DS ", "SNES ", "N64 ", "GBA ", "GCN ", "DS ", "Wii ", "SW ", "Tour ", "RMX ", "GP ", "Beta "];

    public static string Infer(string trackName) =>
        RetroPrefixes.Any(p => trackName.StartsWith(p, StringComparison.Ordinal))
            ? "retro"
            : "custom";
}
