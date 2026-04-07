using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetroRewindWebsite.Models.Entities.Room;

[Table("RoomSnapshots")]
public class RoomSnapshotEntity
{
    [Key]
    public int Id { get; set; }

    public DateTime Timestamp { get; set; }

    public int TotalPlayers { get; set; }
    public int TotalRooms { get; set; }
    public int PublicRooms { get; set; }
    public int PrivateRooms { get; set; }

    public List<RoomData> Rooms { get; set; } = [];
}
