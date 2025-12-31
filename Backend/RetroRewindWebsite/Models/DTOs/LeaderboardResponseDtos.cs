using System.ComponentModel.DataAnnotations;

namespace RetroRewindWebsite.Models.DTOs
{
    public class LeaderboardResponseDto
    {
        public List<PlayerDto> Players { get; set; } = [];
        public int CurrentPage { get; set; }
        public int TotalPages { get; set; }
        public int TotalCount { get; set; }
        public int PageSize { get; set; }
        public LeaderboardStatsDto Stats { get; set; } = new();
    }

    public class LeaderboardStatsDto
    {
        public int TotalPlayers { get; set; }
        public int SuspiciousPlayers { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    public class LeaderboardRequest
    {
        private const int MinPage = 1;
        private const int MinPageSize = 1;
        private const int MaxPageSize = 50;
        private const int MaxSearchLength = 100;

        [Range(MinPage, int.MaxValue, ErrorMessage = "Page must be greater than 0")]
        public int Page { get; set; } = 1;

        [Range(MinPageSize, MaxPageSize, ErrorMessage = "Page size must be between 1 and 50")]
        public int PageSize { get; set; } = 50;

        [StringLength(MaxSearchLength, ErrorMessage = "Search term cannot exceed 100 characters")]
        public string? Search { get; set; }

        [RegularExpression("^(rank|vr|name|lastSeen|vrgain24|vrgain7|vrgain30)$",
            ErrorMessage = "Invalid sort field")]
        public string SortBy { get; set; } = "rank";

        public bool Ascending { get; set; } = true;

        [RegularExpression("^(24|week|month)$", ErrorMessage = "Invalid time period")]
        public string TimePeriod { get; set; } = "24";
    }
}