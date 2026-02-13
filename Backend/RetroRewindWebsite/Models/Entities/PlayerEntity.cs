using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetroRewindWebsite.Models.Entities
{
    [Table("Players")]
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
        public string? MiiImageBase64 { get; set; }
        public DateTime? MiiImageFetchedAt { get; set; }
        public DateTime LastSeen { get; set; }
        public int Rank { get; set; }
        public int VRGainLast24Hours { get; set; }
        public int VRGainLastWeek { get; set; }
        public int VRGainLastMonth { get; set; }
        public DateTime LastUpdated { get; set; }
        public bool IsSuspicious { get; set; }
        public int SuspiciousVRJumps { get; set; }
        public string FlagReason { get; set; } = string.Empty;
        public string UnflagReason { get; set; } = string.Empty;

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
        public string? MiiImageBase64 { get; set; }
        public DateTime SnapshotDate { get; set; }
    }

    [Table("VRHistories")]
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
