using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetroRewindWebsite.Models.Entities
{
    public class PlayerEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public required string Pid { get; set; }
        public required string Name { get; set; }
        public required string Fc { get; set; }
        public int Ev { get; set; }
        public required string MiiData { get; set; }
        public DateTime LastSeen { get; set; }
        public int Rank { get; set; }
        public int VRGainLast24Hours { get; set; }
        public int VRGainLastWeek { get; set; }
        public int VRGainLastMonth { get; set; }
        public DateTime LastUpdated { get; set; }
        public bool IsSuspicious { get; set; }
        public int SuspiciousVRJumps { get; set; }

        // Navigation properties
        public virtual ICollection<VRHistoryEntity> VRHistory { get; set; } = [];
    }

    [Table("LegacyPlayers")]
    public class LegacyPlayerEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public required string Pid { get; set; }
        public required string Name { get; set; }
        public required string Fc { get; set; }
        public int Ev { get; set; }
        public int Rank { get; set; }
        public bool IsSuspicious { get; set; }
        public required string MiiData { get; set; }

        // Metadata
        public DateTime SnapshotDate { get; set; }
    }


    public class VRHistoryEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public required string PlayerId { get; set; }
        public required string Fc { get; set; }
        public DateTime Date { get; set; }
        public int VRChange { get; set; }
        public int TotalVR { get; set; }

        // Navigation property
        public virtual PlayerEntity? Player { get; set; }
    }
}
