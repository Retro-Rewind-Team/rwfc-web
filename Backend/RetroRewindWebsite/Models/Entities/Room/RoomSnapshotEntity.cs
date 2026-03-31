using RetroRewindWebsite.Models.DTOs.Room;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetroRewindWebsite.Models.Entities.Room;

[Table("RoomSnapshots")]
public class RoomSnapshotEntity
{
    [Key]
    public int Id { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public int TotalPlayers { get; set; }
    public int TotalRooms { get; set; }
    public int PublicRooms { get; set; }
    public int PrivateRooms { get; set; }

    public List<RoomDto> Rooms { get; set; } = [];
}
