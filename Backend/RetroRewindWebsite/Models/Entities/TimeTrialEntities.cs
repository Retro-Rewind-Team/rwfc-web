using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetroRewindWebsite.Models.Entities
{
    [Table("Tracks")]
    public class TrackEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public required string Name { get; set; }

        [Required]
        [MaxLength(50)]
        public required string TrackSlot { get; set; }

        public short CourseId { get; set; }

        [Required]
        [MaxLength(10)]
        public required string Category { get; set; } // 'retro' or 'custom'

        public short Laps { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public virtual ICollection<GhostSubmissionEntity> GhostSubmissions { get; set; } = [];
    }

    [Table("TTProfiles")]
    public class TTProfileEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public required string DiscordUserId { get; set; }

        [Required]
        [MaxLength(50)]
        public required string DisplayName { get; set; }

        public int TotalSubmissions { get; set; } = 0;

        public int CurrentWorldRecords { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public virtual ICollection<GhostSubmissionEntity> GhostSubmissions { get; set; } = [];
    }

    [Table("GhostSubmissions")]
    public class GhostSubmissionEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int TrackId { get; set; }

        public int TTProfileId { get; set; }

        // Race details
        public short CC { get; set; } // 150 or 200

        public int FinishTimeMs { get; set; }

        [Required]
        [MaxLength(20)]
        public required string FinishTimeDisplay { get; set; }

        // Extracted from ghost file
        public short VehicleId { get; set; }

        public short CharacterId { get; set; }

        public short ControllerType { get; set; } // 0=Wheel, 1=Wiimote+Nunchuck, 2=Classic, 3=GC

        public short DriftType { get; set; } // 0=Manual, 1=Hybrid

        [Required]
        [MaxLength(10)]
        public required string MiiName { get; set; }

        // Lap data
        public short LapCount { get; set; }

        [Column(TypeName = "jsonb")]
        public required string LapSplitsMs { get; set; } // JSON array: [25340, 25890, 26120]

        // File metadata
        [Required]
        [MaxLength(255)]
        public required string GhostFilePath { get; set; }

        public DateOnly DateSet { get; set; }

        // Submission metadata
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(50)]
        public required string SubmittedByDiscordId { get; set; }

        // Navigation properties
        public virtual TrackEntity? Track { get; set; }

        public virtual TTProfileEntity? TTProfile { get; set; }
    }
}