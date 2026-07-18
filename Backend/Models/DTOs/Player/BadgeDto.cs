namespace RetroRewindWebsite.Models.DTOs.Player;

public record BadgeDto(
    ICollection<int> Badges
);

public record BatchBadgeDto(
    Dictionary<string, ICollection<int>> Badges
);
