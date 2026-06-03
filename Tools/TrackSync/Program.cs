namespace TrackSync;

class Program
{
    static async Task<int> Main(string[] args)
    {
        if (args.Length == 0) { PrintUsage(); return 1; }

        var connStr = GetConnectionString(args);
        if (connStr is null)
        {
            Console.Error.WriteLine("Error: connection string required. Pass --connection or set CONNECTION_STRING env var.");
            return 1;
        }

        if (args[0] == "--restore")
        {
            if (args.Length < 2) { Console.Error.WriteLine("Error: --restore requires a backup file path."); return 1; }
            return await RunRestoreAsync(args[1], connStr);
        }

        var csvPath = args[0];
        var updateTime = ParseUpdateTime(args);
        if (updateTime is null)
        {
            Console.Error.WriteLine("Error: --update-time is required. Format: \"2026-06-03 18:00:00\" (UTC).");
            return 1;
        }

        return await RunSyncAsync(csvPath, updateTime.Value, connStr);
    }

    static async Task<int> RunSyncAsync(string csvPath, DateTime updateTime, string connStr)
    {
        List<CsvTrackEntry> csvEntries;
        try { csvEntries = CsvParser.Parse(csvPath); }
        catch (Exception ex) { Console.Error.WriteLine($"Error: {ex.Message}"); return 1; }

        var db = new DbClient(connStr);
        List<DbTrack> dbTracks;
        try { dbTracks = await db.LoadTracksAsync(); }
        catch (Exception ex) { Console.Error.WriteLine($"Error connecting to DB: {ex.Message}"); return 1; }

        DiffResult diff;
        try { diff = DiffEngine.Compute(csvEntries, dbTracks); }
        catch (Exception ex) { Console.Error.WriteLine($"Diff error: {ex.Message}"); return 1; }

        // Prompt for new track details before showing the diff
        var newTrackDetails = new List<NewTrackDetails>();
        foreach (var t in diff.NewTracks)
        {
            Console.WriteLine();
            Console.WriteLine($"New track: {t.Name} ({t.CourseId})");
            var category       = PromptCategory(t.Name);
            var laps           = PromptShort("  Laps", (short)3);
            var supportsGlitch = PromptBool("  SupportsGlitch", false);
            newTrackDetails.Add(new NewTrackDetails(t.Name, t.CourseId, t.SortOrder, category, laps, supportsGlitch));
        }

        var mappings        = DiffEngine.GetDistinctCourseMappings(diff);
        var raceResultCount = await db.CountRaceResultsAffectedAsync(mappings, updateTime);

        PrintDiff(diff, raceResultCount, updateTime);

        foreach (var w in diff.Warnings)
            Console.WriteLine($"\n{w}");

        if (mappings.Count > 0 && raceResultCount == 0)
            Console.WriteLine(
                "\nWARNING: 0 RaceResults rows would be updated — verify that --update-time is correct and not set to a future date.");

        if (!Confirm("\nApply these changes?")) return 0;

        // Build backup from pre-change DB state
        var affectedIds = new HashSet<int>(
            diff.CourseIdChanges.Select(c => c.TrackId)
                .Concat(diff.SortOrderChanges.Select(c => c.TrackId))
                .Concat(diff.HiddenTracks.Select(t => t.TrackId))
                .Concat(diff.ReactivatedTracks.Select(t => t.TrackId)));

        var backup = new BackupData(
            Timestamp: DateTime.UtcNow,
            UpdateCutoff: updateTime,
            Tracks: dbTracks
                .Where(t => affectedIds.Contains(t.Id))
                .Select(t => new BackupTrack(t.Id, t.Name, t.CourseId, t.SortOrder, t.IsHidden))
                .ToList(),
            RaceResultCourseMappings: mappings
                .Select(m => new CourseIdMapping(m.OldCourseId, m.NewCourseId))
                .ToList());

        string backupPath;
        try
        {
            backupPath = BackupWriter.Write(backup, Path.GetDirectoryName(Path.GetFullPath(csvPath))!);
            Console.WriteLine($"\nBackup written: {backupPath}");
        }
        catch (Exception ex) { Console.Error.WriteLine($"Error writing backup: {ex.Message}"); return 1; }

        try
        {
            await db.ApplyDiffAsync(diff, newTrackDetails, updateTime);
            Console.WriteLine("Done. Changes applied successfully.");
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error applying changes (transaction rolled back): {ex.Message}");
            Console.Error.WriteLine($"Backup preserved at: {backupPath}");
            return 1;
        }
    }

    static async Task<int> RunRestoreAsync(string backupPath, string connStr)
    {
        BackupData backup;
        try { backup = BackupWriter.Read(backupPath); }
        catch (Exception ex) { Console.Error.WriteLine($"Error reading backup: {ex.Message}"); return 1; }

        Console.WriteLine($"\n=== Restore from backup ===");
        Console.WriteLine($"Original sync:           {backup.Timestamp:u}");
        Console.WriteLine($"Update cutoff:           {backup.UpdateCutoff:u}");
        Console.WriteLine($"Tracks to restore:       {backup.Tracks.Count}");
        Console.WriteLine($"RaceResult mappings:     {backup.RaceResultCourseMappings.Count}");
        Console.WriteLine();
        foreach (var t in backup.Tracks)
            Console.WriteLine($"  Restore: {t.Name,-40} CourseId={t.CourseId} SortOrder={t.SortOrder} IsHidden={t.IsHidden}");

        Console.WriteLine("\nWARNING: New tracks inserted during the original sync are NOT removed — review and delete them manually if needed.");

        if (!Confirm("\nApply restore?")) return 0;

        var db = new DbClient(connStr);
        try
        {
            await db.ApplyRestoreAsync(backup);
            Console.WriteLine("Restore applied successfully.");
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error during restore (transaction rolled back): {ex.Message}");
            return 1;
        }
    }

    static void PrintDiff(DiffResult diff, int raceResultCount, DateTime updateTime)
    {
        Console.WriteLine("\n=== Track Sync Diff ===\n");

        Console.WriteLine($"CourseId changes ({diff.CourseIdChanges.Count}):");
        foreach (var c in diff.CourseIdChanges)
            Console.WriteLine($"  {c.Name,-42} {c.OldCourseId,5} → {c.NewCourseId}");

        Console.WriteLine($"\nSortOrder changes ({diff.SortOrderChanges.Count}):");
        foreach (var c in diff.SortOrderChanges)
            Console.WriteLine($"  {c.Name,-42} {c.OldSortOrder,5} → {c.NewSortOrder}");

        Console.WriteLine($"\nNew tracks ({diff.NewTracks.Count}):");
        foreach (var t in diff.NewTracks)
            Console.WriteLine($"  {t.Name,-42} ({t.CourseId})");

        Console.WriteLine($"\nHidden ({diff.HiddenTracks.Count}):");
        foreach (var t in diff.HiddenTracks)
            Console.WriteLine($"  {t.Name}");

        Console.WriteLine($"\nRe-activated ({diff.ReactivatedTracks.Count}):");
        foreach (var t in diff.ReactivatedTracks)
            Console.WriteLine($"  {t.Name}");

        Console.WriteLine($"\nRaceResults rows affected: ~{raceResultCount:N0}  (RaceTimestamp < {updateTime:yyyy-MM-dd HH:mm:ss} UTC)");
    }

    static string PromptCategory(string trackName)
    {
        var suggestion = CategoryInferrer.Infer(trackName);
        var display    = char.ToUpper(suggestion[0]) + suggestion[1..];
        Console.Write($"  Category [{display}]: ");
        var input = Console.ReadLine()?.Trim();
        if (string.IsNullOrEmpty(input)) return suggestion;
        if (input.Equals("retro",  StringComparison.OrdinalIgnoreCase)) return "retro";
        if (input.Equals("custom", StringComparison.OrdinalIgnoreCase)) return "custom";
        Console.WriteLine($"  Invalid value, using {suggestion}.");
        return suggestion;
    }

    static short PromptShort(string label, short defaultVal)
    {
        Console.Write($"{label} [{defaultVal}]: ");
        var input = Console.ReadLine()?.Trim();
        return string.IsNullOrEmpty(input) ? defaultVal : short.TryParse(input, out var v) ? v : defaultVal;
    }

    static bool PromptBool(string label, bool defaultVal)
    {
        Console.Write($"{label} [{(defaultVal ? "true" : "false")}]: ");
        var input = Console.ReadLine()?.Trim().ToLower();
        return string.IsNullOrEmpty(input) ? defaultVal : input is "true" or "yes" or "y";
    }

    static bool Confirm(string question)
    {
        Console.Write($"{question} (yes/no): ");
        return Console.ReadLine()?.Trim().ToLower() == "yes";
    }

    static string? GetConnectionString(string[] args)
    {
        for (int i = 0; i < args.Length - 1; i++)
            if (args[i] == "--connection") return args[i + 1];
        return Environment.GetEnvironmentVariable("CONNECTION_STRING");
    }

    static DateTime? ParseUpdateTime(string[] args)
    {
        for (int i = 0; i < args.Length - 1; i++)
            if (args[i] == "--update-time")
                return DateTime.TryParse(args[i + 1], out var dt)
                    ? DateTime.SpecifyKind(dt, DateTimeKind.Utc)
                    : null;
        return null;
    }

    static void PrintUsage()
    {
        Console.WriteLine("Usage:");
        Console.WriteLine("  Sync:    dotnet run --project Tools/TrackSync -- <csv-path> --update-time \"YYYY-MM-DD HH:MM:SS\" [--connection <conn-str>]");
        Console.WriteLine("  Restore: dotnet run --project Tools/TrackSync -- --restore <backup-path> [--connection <conn-str>]");
        Console.WriteLine();
        Console.WriteLine("CONNECTION_STRING env var is used when --connection is not provided.");
    }
}
