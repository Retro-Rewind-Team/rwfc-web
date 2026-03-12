namespace RetroRewindWebsite.Models.DTOs.TimeTrial;

public record CountryDto(int NumericCode, string Alpha2, string Name);
public record CountryListResultDto(bool Success, int Count, List<CountryDto> Countries);
