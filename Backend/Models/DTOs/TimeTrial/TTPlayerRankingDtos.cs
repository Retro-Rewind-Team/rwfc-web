namespace RetroRewindWebsite.Models.DTOs.TimeTrial;

public record TTPlayerRankingDto(
    int Rank,
    int TTProfileId,
    string DisplayName,
    string? CountryAlpha2,
    string? CountryName,
    int WorldRecordCount
);

public record TTPlayerRankingsDto(
    List<TTPlayerRankingDto> Players,
    int TotalPlayers,
    int CurrentPage,
    int PageSize,
    int TotalPages
);
