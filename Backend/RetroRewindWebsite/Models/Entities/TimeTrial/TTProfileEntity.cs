using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetroRewindWebsite.Models.Entities.TimeTrial;

[Table("TTProfiles")]
public class TTProfileEntity
{
    [Key]
    public int Id { get; set; }

    public required string DisplayName { get; set; }

    // TODO: Replace with computed queries instead of stored counters
    public int TotalSubmissions { get; set; } = 0;
    public int CurrentWorldRecords { get; set; } = 0;

    public int CountryCode { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<GhostSubmissionEntity> GhostSubmissions { get; set; } = [];
}
