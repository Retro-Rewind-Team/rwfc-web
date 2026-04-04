namespace RetroRewindWebsite.Models.Entities.Room;

/// <summary>
/// Persisted representation of a room within a snapshot. Mirrors <c>RoomDto</c> structure
/// but lives in the entity layer, decoupled from presentation DTOs.
/// </summary>
public record RoomData(
    string Id,
    string Type,
    DateTime Created,
    string Host,
    string? Rk,
    List<RoomPlayerData> Players,
    int? AverageVR,
    RaceData? Race,
    bool Suspend
);

public record RoomPlayerData(
    string Pid,
    string Name,
    string FriendCode,
    int? VR,
    int? BR,
    bool IsOpenHost,
    bool IsSuspended,
    MiiData? Mii,
    List<string> ConnectionMap
);

public record RaceData(int Num, int Course, int Cc, string? TrackName);

public record MiiData(string Data, string Name);
