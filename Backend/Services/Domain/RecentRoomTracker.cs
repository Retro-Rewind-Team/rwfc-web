using RetroRewindWebsite.Models.External;

namespace RetroRewindWebsite.Services.Domain;

/// <summary>A room to collect race results from this tick.</summary>
public sealed record TrackedRoom(string Id, string Type, string? Rk, bool IsOpen);

/// <summary>
/// Keeps rooms around for a few ticks after they leave the groups list, so the last race of a room
/// that closes between ticks still gets collected. WFC keeps a room's results for 3 hours after the
/// room is deleted. Type and Rk are stored because closed rooms are no longer in the groups list.
/// Singleton, in memory only.
/// </summary>
public sealed class RecentRoomTracker
{
    /// <summary>How many ticks a closed room is still polled.</summary>
    public const int ClosedRoomPolls = 3;

    /// <summary>WFC deletes a room's results after this.</summary>
    public static readonly TimeSpan MaxClosedAge = TimeSpan.FromHours(3);

    private readonly TimeProvider _timeProvider;
    private readonly Lock _lock = new();
    private readonly Dictionary<string, Entry> _rooms = new(StringComparer.Ordinal);

    public RecentRoomTracker(TimeProvider? timeProvider = null)
    {
        _timeProvider = timeProvider ?? TimeProvider.System;
    }

    /// <summary>
    /// Returns the open rooms plus recently closed ones. Each call uses up one poll of every closed room.
    /// </summary>
    public IReadOnlyList<TrackedRoom> GetRoomsToCollect(IReadOnlyCollection<Group> openGroups)
    {
        var now = _timeProvider.GetUtcNow();

        lock (_lock)
        {
            var openIds = new HashSet<string>(StringComparer.Ordinal);
            var rooms = new List<TrackedRoom>(openGroups.Count + _rooms.Count);

            foreach (var group in openGroups)
            {
                if (!openIds.Add(group.Id))
                    continue;

                _rooms[group.Id] = new Entry(group.Type, group.Rk, now, ClosedRoomPolls);
                rooms.Add(new TrackedRoom(group.Id, group.Type, group.Rk, IsOpen: true));
            }

            foreach (var (id, entry) in _rooms.ToList())
            {
                if (openIds.Contains(id))
                    continue;

                if (entry.PollsLeft <= 0 || now - entry.LastSeenOpen > MaxClosedAge)
                {
                    _rooms.Remove(id);
                    continue;
                }

                _rooms[id] = entry with { PollsLeft = entry.PollsLeft - 1 };
                rooms.Add(new TrackedRoom(id, entry.Type, entry.Rk, IsOpen: false));
            }

            return rooms;
        }
    }

    private sealed record Entry(string Type, string? Rk, DateTimeOffset LastSeenOpen, int PollsLeft);
}
