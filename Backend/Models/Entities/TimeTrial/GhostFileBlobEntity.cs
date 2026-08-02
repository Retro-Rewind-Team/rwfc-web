using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetroRewindWebsite.Models.Entities.TimeTrial;

[Table("GhostFileBlobs")]
public class GhostFileBlobEntity
{
    [Key]
    public int Id { get; set; }

    public required byte[] Data { get; set; }

    public virtual GhostSubmissionEntity? GhostSubmission { get; set; }
}
