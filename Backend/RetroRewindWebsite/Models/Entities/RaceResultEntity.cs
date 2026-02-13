using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetroRewindWebsite.Models.Entities
{
    public class RaceResultEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        // Room/Race identification
        public required string RoomId { get; set; }
        public int RaceNumber { get; set; }
        public DateTime RaceTimestamp { get; set; }

        // Player information
        public long ProfileId { get; set; }
        public int PlayerId { get; set; }

        // Race results
        public int FinishTime { get; set; }
        public short CharacterId { get; set; }
        public short VehicleId { get; set; }
        public short PlayerCount { get; set; }
        public short FinishPos { get; set; }
        public int FramesIn1st { get; set; }

        public short CourseId { get; set; }
        public short EngineClassId { get; set; }

    }
}