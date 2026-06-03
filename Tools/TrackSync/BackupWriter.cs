namespace TrackSync;

using System.Text.Json;
using System.Text.Json.Serialization;

public record BackupTrack(int Id, string Name, short CourseId, int SortOrder, bool IsHidden);
public record CourseIdMapping(short OldCourseId, short NewCourseId);
public record BackupData(
	DateTime Timestamp,
	DateTime UpdateCutoff,
	List<BackupTrack> Tracks,
	List<CourseIdMapping> RaceResultCourseMappings);

public static class BackupWriter
{
	private static readonly JsonSerializerOptions Options = new()
	{
		WriteIndented = true,
		DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
	};

	public static string Write(BackupData data, string directory)
	{
		var ts = data.Timestamp.ToUniversalTime();
		var filename = $"track_sync_backup_{ts:yyyyMMdd_HHmmssfffZ}.json";
		var path = Path.Combine(directory, filename);
		File.WriteAllText(path, JsonSerializer.Serialize(data, Options));
		return path;
	}

	public static BackupData Read(string path)
	{
		if (!File.Exists(path))
			throw new FileNotFoundException($"Backup file not found: {path}");
		return JsonSerializer.Deserialize<BackupData>(File.ReadAllText(path), Options)
			?? throw new InvalidDataException("Failed to deserialize backup file.");
	}
}
