namespace RetroRewindWebsite.Models.DTOs.Room;

public record RoomSnapshotDto(
    int Id,
    DateTime Timestamp,
    int TotalPlayers,
    int TotalRooms,
    int PublicRooms,
    int PrivateRooms,
    List<RoomSnapshotRoomDto> Rooms
);

public record RoomSnapshotRoomDto(
    string RoomId,
    string Type,
    string? Rk,
    int PlayerCount,
    int? CourseId,
    string? TrackName,
    int? TrackId
);
