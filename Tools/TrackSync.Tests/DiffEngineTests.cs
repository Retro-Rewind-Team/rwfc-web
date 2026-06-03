using Shouldly;
using TrackSync;
using Xunit;

namespace TrackSync.Tests;

public class DiffEngineTests
{
    private static DbTrack Track(int id, string name, short courseId, int sortOrder, bool isHidden = false) =>
        new(id, name, courseId, sortOrder, isHidden, "retro", 3, false);

    private static CsvTrackEntry Csv(string name, short courseId, int sortOrder) =>
        new(name, courseId, sortOrder);

    [Fact]
    public void Compute_NoChanges_ReturnsEmptyDiff()
    {
        var csv = new List<CsvTrackEntry> { Csv("Track A", 256, 1) };
        var db  = new List<DbTrack>       { Track(1, "Track A", 256, 1) };
        var diff = DiffEngine.Compute(csv, db);
        diff.CourseIdChanges.ShouldBeEmpty();
        diff.SortOrderChanges.ShouldBeEmpty();
        diff.NewTracks.ShouldBeEmpty();
        diff.HiddenTracks.ShouldBeEmpty();
        diff.ReactivatedTracks.ShouldBeEmpty();
    }

    [Fact]
    public void Compute_CourseIdChanged_AddsToChanges()
    {
        var csv = new List<CsvTrackEntry> { Csv("Track A", 260, 1) };
        var db  = new List<DbTrack>       { Track(1, "Track A", 256, 1) };
        var diff = DiffEngine.Compute(csv, db);
        diff.CourseIdChanges.Count.ShouldBe(1);
        diff.CourseIdChanges[0].OldCourseId.ShouldBe((short)256);
        diff.CourseIdChanges[0].NewCourseId.ShouldBe((short)260);
        diff.CourseIdChanges[0].TrackId.ShouldBe(1);
    }

    [Fact]
    public void Compute_SortOrderChanged_AddsToChanges()
    {
        var csv = new List<CsvTrackEntry> { Csv("Track A", 256, 5) };
        var db  = new List<DbTrack>       { Track(1, "Track A", 256, 1) };
        var diff = DiffEngine.Compute(csv, db);
        diff.SortOrderChanges.Count.ShouldBe(1);
        diff.SortOrderChanges[0].OldSortOrder.ShouldBe(1);
        diff.SortOrderChanges[0].NewSortOrder.ShouldBe(5);
    }

    [Fact]
    public void Compute_TrackInCsvButNotDb_AddsToNewTracks()
    {
        var csv = new List<CsvTrackEntry> { Csv("New Track", 300, 1) };
        var db  = new List<DbTrack>();
        var diff = DiffEngine.Compute(csv, db);
        diff.NewTracks.Count.ShouldBe(1);
        diff.NewTracks[0].Name.ShouldBe("New Track");
        diff.NewTracks[0].CourseId.ShouldBe((short)300);
    }

    [Fact]
    public void Compute_VisibleTrackNotInCsv_AddsToHidden()
    {
        var csv = new List<CsvTrackEntry>();
        var db  = new List<DbTrack> { Track(1, "Track A", 256, 1, isHidden: false) };
        var diff = DiffEngine.Compute(csv, db);
        diff.HiddenTracks.Count.ShouldBe(1);
        diff.HiddenTracks[0].TrackId.ShouldBe(1);
    }

    [Fact]
    public void Compute_AlreadyHiddenTrackNotInCsv_NotAddedToHidden()
    {
        var csv = new List<CsvTrackEntry>();
        var db  = new List<DbTrack> { Track(1, "Track A", 256, 1, isHidden: true) };
        var diff = DiffEngine.Compute(csv, db);
        diff.HiddenTracks.ShouldBeEmpty();
    }

    [Fact]
    public void Compute_HiddenTrackReappearsInCsv_AddsToReactivated()
    {
        var csv = new List<CsvTrackEntry> { Csv("Track A", 256, 1) };
        var db  = new List<DbTrack>       { Track(1, "Track A", 256, 1, isHidden: true) };
        var diff = DiffEngine.Compute(csv, db);
        diff.ReactivatedTracks.Count.ShouldBe(1);
        diff.ReactivatedTracks[0].TrackId.ShouldBe(1);
        diff.NewTracks.ShouldBeEmpty();
    }

    [Fact]
    public void Compute_HiddenTrackReactivatedWithCourseIdChange_AppearsInBothBuckets()
    {
        var csv = new List<CsvTrackEntry> { Csv("Track A", 260, 1) };
        var db  = new List<DbTrack>       { Track(1, "Track A", 256, 1, isHidden: true) };
        var diff = DiffEngine.Compute(csv, db);
        diff.ReactivatedTracks.Count.ShouldBe(1);
        diff.CourseIdChanges.Count.ShouldBe(1);
    }

    [Fact]
    public void Compute_SharedCourseIdConsistentChange_NoWarning()
    {
        var csv = new List<CsvTrackEntry>
        {
            Csv("DS Tick-Tock Clock", 340, 1),
            Csv("Wii U Tick-Tock Clock", 340, 1)
        };
        var db = new List<DbTrack>
        {
            Track(1, "DS Tick-Tock Clock", 337, 1),
            Track(2, "Wii U Tick-Tock Clock", 337, 1)
        };
        var diff = DiffEngine.Compute(csv, db);
        diff.Warnings.ShouldBeEmpty();
        diff.CourseIdChanges.Count.ShouldBe(2);
    }

    [Fact]
    public void Compute_SharedCourseIdInconsistentChange_AddsWarning()
    {
        var csv = new List<CsvTrackEntry>
        {
            Csv("DS Tick-Tock Clock", 340, 1),
            Csv("Wii U Tick-Tock Clock", 341, 1)
        };
        var db = new List<DbTrack>
        {
            Track(1, "DS Tick-Tock Clock", 337, 1),
            Track(2, "Wii U Tick-Tock Clock", 337, 1)
        };
        var diff = DiffEngine.Compute(csv, db);
        diff.Warnings.Count.ShouldBe(1);
        diff.Warnings[0].ShouldContain("337");
    }

    [Fact]
    public void Compute_DuplicateNamesInDb_Throws()
    {
        var csv = new List<CsvTrackEntry>();
        var db = new List<DbTrack>
        {
            Track(1, "Track A", 256, 1),
            Track(2, "Track A", 257, 2)
        };
        Should.Throw<InvalidOperationException>(() => DiffEngine.Compute(csv, db));
    }

    [Fact]
    public void GetDistinctCourseMappings_DeduplicatesSharedCourseId()
    {
        var diff = new DiffResult(
            CourseIdChanges:
            [
                new(1, "DS Tick-Tock Clock", 337, 340),
                new(2, "Wii U Tick-Tock Clock", 337, 340)
            ],
            SortOrderChanges: [], NewTracks: [], HiddenTracks: [], ReactivatedTracks: [], Warnings: []);
        var mappings = DiffEngine.GetDistinctCourseMappings(diff);
        mappings.Count.ShouldBe(1);
        mappings[0].OldCourseId.ShouldBe((short)337);
        mappings[0].NewCourseId.ShouldBe((short)340);
    }

    [Theory]
    [InlineData("SNES Mario Circuit 1", "retro")]
    [InlineData("N64 Luigi Raceway", "retro")]
    [InlineData("GBA Peach Circuit", "retro")]
    [InlineData("GCN Waluigi Stadium", "retro")]
    [InlineData("DS Tick-Tock Clock", "retro")]
    [InlineData("Wii U Rainbow Road", "retro")]
    [InlineData("Wii Rainbow Road", "retro")]
    [InlineData("3DS Toad Circuit", "retro")]
    [InlineData("SW Sky-High Sundae", "retro")]
    [InlineData("SW2 Crown City", "retro")]
    [InlineData("Tour Vancouver Velocity", "retro")]
    [InlineData("RMX Mario Circuit 1", "retro")]
    [InlineData("GP Bananan Ruins", "retro")]
    [InlineData("Beta Donut Plains 1", "retro")]
    [InlineData("Moonlit Grounds", "custom")]
    [InlineData("Thunder Canyon", "custom")]
    [InlineData("Phendrana Frostbite", "custom")]
    [InlineData("Wario Circuit", "custom")]
    public void InferCategory_ReturnsExpectedCategory(string name, string expected)
    {
        CategoryInferrer.Infer(name).ShouldBe(expected);
    }
}
