using RetroRewindWebsite.Models.DTOs.Player;

namespace RetroRewindWebsite.Models.DTOs.Room;

public record RoomStatusResponseDto(
    List<RoomDto> Rooms,
    DateTime Timestamp,
    int Id,
    int MinimumId,
    int MaximumId
);

public record RoomDto(
    string Id,
    string Type,
    DateTime Created,
    string Host,
    string? Rk,
    List<RoomPlayerDto> Players,
    int? AverageVR,
    RaceDto? Race,
    bool Suspend
);

public record RoomPlayerDto(
    string Pid,
    string Name,
    string FriendCode,
    int? VR,
    int? BR,
    bool IsOpenHost,
    bool IsSuspended,
    MiiDto? Mii,
    List<string> ConnectionMap
);

public record RaceDto(int Num, int Course, int Cc);

public record RoomStatusStatsDto(
    int TotalPlayers,
    int TotalRooms,
    int PublicRooms,
    int PrivateRooms,
    DateTime LastUpdated
);
