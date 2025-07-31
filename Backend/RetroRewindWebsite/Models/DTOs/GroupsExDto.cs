using RetroRewindWebsite.Models.External;

namespace RetroRewindWebsite.Models.DTOs
{
    public class GroupsExResponseDto
    {
        public required GroupExDto[] Groups { get; set; }
    }

    public class GroupExDto
    {
        public required string ID { get; set; }
        public required string Game { get; set; }
        public required DateTime Created { get; set; }
        public required string Type { get; set; }
        public required bool Suspend { get; set; }
        public required string Host { get; set; }
        public required string? RK { get; set; }
        public required Dictionary<string, GroupPlayerDto> Players { get; set; }
    }

    public class GroupPlayerDto : ExternalPlayer
    {
        public int? Rank { get; set; }
        public int? ActiveRank { get; set; }
    }
}
