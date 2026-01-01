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

        public required string Name { get; set; }
        public required string TrackSlot { get; set; }
        public short CourseId { get; set; }
        public required string Category { get; set; }
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

        public required string DisplayName { get; set; }
        public int TotalSubmissions { get; set; } = 0;
        public int CurrentWorldRecords { get; set; } = 0;
        public int CountryCode { get; set; } = 0;
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
        public short CC { get; set; }
        public int FinishTimeMs { get; set; }
        public required string FinishTimeDisplay { get; set; }

        // Extracted from ghost file
        public short VehicleId { get; set; }
        public short CharacterId { get; set; }
        public short ControllerType { get; set; }
        public short DriftType { get; set; }
        public required string MiiName { get; set; }

        // Lap data
        public short LapCount { get; set; }
        public required string LapSplitsMs { get; set; }

        // Category flags
        public bool Shroomless { get; set; } = false;
        public bool Glitch { get; set; } = false;

        // File metadata
        public required string GhostFilePath { get; set; }
        public DateOnly DateSet { get; set; }

        // Submission metadata
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual TrackEntity? Track { get; set; }
        public virtual TTProfileEntity? TTProfile { get; set; }
    }
}