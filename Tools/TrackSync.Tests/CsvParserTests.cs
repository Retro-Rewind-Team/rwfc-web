using Shouldly;
using TrackSync;
using Xunit;

namespace TrackSync.Tests;

public class CsvParserTests
{
    private static string WriteTempCsv(string content)
    {
        var path = Path.GetTempFileName();
        File.WriteAllText(path, content);
        return path;
    }

    [Fact]
    public void Parse_SimpleRow_ReturnsSingleEntry()
    {
        var path = WriteTempCsv("track_name,pulsar_id\nSNES Mario Circuit 1,0x100\n");
        try
        {
            var entries = CsvParser.Parse(path);
            entries.Count.ShouldBe(1);
            entries[0].Name.ShouldBe("SNES Mario Circuit 1");
            entries[0].CourseId.ShouldBe((short)256);
            entries[0].SortOrder.ShouldBe(1);
        }
        finally { File.Delete(path); }
    }

    [Fact]
    public void Parse_VariantRow_ReturnsTwoEntriesWithSameCourseIdAndSortOrder()
    {
        var path = WriteTempCsv("track_name,pulsar_id\nDS DK Pass/SW2 DK Pass,0x150\n");
        try
        {
            var entries = CsvParser.Parse(path);
            entries.Count.ShouldBe(2);
            entries[0].Name.ShouldBe("DS DK Pass");
            entries[1].Name.ShouldBe("SW2 DK Pass");
            entries[0].CourseId.ShouldBe((short)336);
            entries[1].CourseId.ShouldBe((short)336);
            entries[0].SortOrder.ShouldBe(1);
            entries[1].SortOrder.ShouldBe(1);
        }
        finally { File.Delete(path); }
    }

    [Fact]
    public void Parse_QuotedNameWithComma_ParsesCorrectly()
    {
        var path = WriteTempCsv("track_name,pulsar_id\n\"Fiery Factory, Fading Frost\",0x1DA\n");
        try
        {
            var entries = CsvParser.Parse(path);
            entries.Count.ShouldBe(1);
            entries[0].Name.ShouldBe("Fiery Factory, Fading Frost");
            entries[0].CourseId.ShouldBe((short)474);
        }
        finally { File.Delete(path); }
    }

    [Fact]
    public void Parse_SortOrderIsOneBased()
    {
        var path = WriteTempCsv("track_name,pulsar_id\nTrack A,0x100\nTrack B,0x101\nTrack C,0x102\n");
        try
        {
            var entries = CsvParser.Parse(path);
            entries.Select(e => e.SortOrder).ShouldBe([1, 2, 3]);
        }
        finally { File.Delete(path); }
    }

    [Fact]
    public void Parse_VariantRowSortOrderMatchesDataRowIndex()
    {
        var path = WriteTempCsv("track_name,pulsar_id\nTrack A,0x100\nTrack B1/Track B2,0x101\nTrack C,0x102\n");
        try
        {
            var entries = CsvParser.Parse(path);
            entries.Where(e => e.Name.StartsWith("Track B")).Select(e => e.SortOrder).ShouldAllBe(s => s == 2);
            entries.First(e => e.Name == "Track C").SortOrder.ShouldBe(3);
        }
        finally { File.Delete(path); }
    }

    [Fact]
    public void Parse_FileNotFound_ThrowsFileNotFoundException()
    {
        Should.Throw<FileNotFoundException>(() => CsvParser.Parse("nonexistent.csv"));
    }

    [Fact]
    public void Parse_WrongHeader_ThrowsInvalidDataException()
    {
        var path = WriteTempCsv("name,id\nTrack A,0x100\n");
        try
        {
            Should.Throw<InvalidDataException>(() => CsvParser.Parse(path));
        }
        finally { File.Delete(path); }
    }
}
