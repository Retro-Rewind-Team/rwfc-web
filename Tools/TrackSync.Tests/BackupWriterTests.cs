using Shouldly;
using TrackSync;
using Xunit;

namespace TrackSync.Tests;

public class BackupWriterTests
{
	[Fact]
	public void Write_ThenRead_RoundtripsAllFields()
	{
		var dir = Path.GetTempPath();
		var data = new BackupData(
			Timestamp: new DateTime(2026, 6, 3, 14, 30, 22, 500, DateTimeKind.Utc),
			UpdateCutoff: new DateTime(2026, 6, 3, 18, 0, 0, DateTimeKind.Utc),
			Tracks:
			[
				new BackupTrack(42, "GCN Waluigi Stadium", 319, 63, false)
			],
			RaceResultCourseMappings:
			[
				new CourseIdMapping(319, 321)
			]);

		var path = BackupWriter.Write(data, dir);

		try
		{
			var loaded = BackupWriter.Read(path);
			loaded.Timestamp.ShouldBe(data.Timestamp);
			loaded.UpdateCutoff.ShouldBe(data.UpdateCutoff);
			loaded.Tracks.Count.ShouldBe(1);
			loaded.Tracks[0].Id.ShouldBe(42);
			loaded.Tracks[0].Name.ShouldBe("GCN Waluigi Stadium");
			loaded.Tracks[0].CourseId.ShouldBe((short)319);
			loaded.Tracks[0].SortOrder.ShouldBe(63);
			loaded.Tracks[0].IsHidden.ShouldBe(false);
			loaded.RaceResultCourseMappings.Count.ShouldBe(1);
			loaded.RaceResultCourseMappings[0].OldCourseId.ShouldBe((short)319);
			loaded.RaceResultCourseMappings[0].NewCourseId.ShouldBe((short)321);
		}
		finally
		{
			File.Delete(path);
		}
	}

	[Fact]
	public void Write_FilenameContainsTimestampWithMilliseconds()
	{
		var dir = Path.GetTempPath();
		var data = new BackupData(
			Timestamp: new DateTime(2026, 6, 3, 14, 30, 22, 123, DateTimeKind.Utc),
			UpdateCutoff: new DateTime(2026, 6, 3, 18, 0, 0, DateTimeKind.Utc),
			Tracks: [],
			RaceResultCourseMappings: []);

		var path = BackupWriter.Write(data, dir);
		try
		{
			Path.GetFileName(path).ShouldStartWith("track_sync_backup_20260603_143022123");
		}
		finally
		{
			File.Delete(path);
		}
	}

	[Fact]
	public void Read_FileNotFound_ThrowsFileNotFoundException()
	{
		Should.Throw<FileNotFoundException>(() => BackupWriter.Read("nonexistent.json"));
	}
}
