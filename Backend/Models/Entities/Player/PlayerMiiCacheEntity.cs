using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetroRewindWebsite.Models.Entities.Player;

[Table("PlayerMiiCaches")]
public class PlayerMiiCacheEntity
{
    [Key]
    public int PlayerId { get; set; } // Primary key and foreign key to PlayerEntity.Id

    public string MiiImageBase64 { get; set; } = string.Empty;
    public DateTime MiiImageFetchedAt { get; set; }

    public virtual PlayerEntity Player { get; set; } = null!;
}
