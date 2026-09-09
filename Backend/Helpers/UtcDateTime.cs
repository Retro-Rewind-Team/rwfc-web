namespace RetroRewindWebsite.Helpers;

/// <summary>
/// Normalises caller-supplied <see cref="DateTime"/> values to UTC before they reach a
/// <c>timestamptz</c> column.
/// </summary>
/// <remarks>
/// Query-string values bind with <see cref="DateTimeKind.Unspecified"/> when the caller sends no
/// offset, and Npgsql rejects those against <c>timestamptz</c>. Every timestamp this API stores is
/// UTC, so an offset-less value is taken at face value rather than reinterpreted.
/// <para>
/// This is why <c>ToUniversalTime()</c> is the wrong tool: on an <c>Unspecified</c> value it
/// assumes the server's local zone and shifts the value by that offset, so the same request
/// returned different data depending on where the process was running.
/// </para>
/// </remarks>
public static class UtcDateTime
{
    /// <summary>Returns <paramref name="value"/> as UTC, interpreting an offset-less value as UTC.</summary>
    public static DateTime From(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };

    /// <summary>Nullable overload; null passes through untouched.</summary>
    public static DateTime? From(DateTime? value) => value.HasValue ? From(value.Value) : null;
}
