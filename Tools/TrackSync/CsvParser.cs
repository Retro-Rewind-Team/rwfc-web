namespace TrackSync;

public record CsvTrackEntry(string Name, short CourseId, int SortOrder);

public static class CsvParser
{
    public static List<CsvTrackEntry> Parse(string path)
    {
        if (!File.Exists(path))
            throw new FileNotFoundException($"CSV file not found: {path}");

        var lines = File.ReadAllLines(path);
        if (lines.Length < 1)
            throw new InvalidDataException("CSV is empty.");

        var header = ParseLine(lines[0]);
        if (header.Length < 2 || header[0] != "track_name" || header[1] != "pulsar_id")
            throw new InvalidDataException($"Unexpected CSV header: {lines[0]}");

        var entries = new List<CsvTrackEntry>();
        for (int i = 1; i < lines.Length; i++)
        {
            var line = lines[i].Trim();
            if (string.IsNullOrEmpty(line)) continue;

            var fields = ParseLine(line);
            if (fields.Length < 2)
                throw new InvalidDataException($"Line {i + 1}: expected 2 fields, got {fields.Length}.");

            var combinedName = fields[0].Trim();
            var courseId = ParseHexCourseId(fields[1].Trim(), i + 1);
            var sortOrder = i; // 1-based: first data row = SortOrder 1

            foreach (var variant in combinedName.Split('/'))
            {
                var name = variant.Trim();
                if (!string.IsNullOrEmpty(name))
                    entries.Add(new CsvTrackEntry(name, courseId, sortOrder));
            }
        }
        return entries;
    }

    private static string[] ParseLine(string line)
    {
        var fields = new List<string>();
        var field = new System.Text.StringBuilder();
        bool inQuotes = false;
        foreach (char c in line)
        {
            if (c == '"') { inQuotes = !inQuotes; continue; }
            if (c == ',' && !inQuotes) { fields.Add(field.ToString()); field.Clear(); continue; }
            field.Append(c);
        }
        fields.Add(field.ToString());
        return [.. fields];
    }

    private static short ParseHexCourseId(string hex, int lineNumber)
    {
        try
        {
            var value = hex.StartsWith("0x", StringComparison.OrdinalIgnoreCase)
                ? Convert.ToInt32(hex[2..], 16)
                : int.Parse(hex);
            return (short)value;
        }
        catch (Exception ex) when (ex is FormatException or OverflowException)
        {
            throw new InvalidDataException($"Line {lineNumber}: invalid pulsar_id '{hex}'.");
        }
    }
}
