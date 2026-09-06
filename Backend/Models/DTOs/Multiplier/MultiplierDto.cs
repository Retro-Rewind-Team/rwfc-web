namespace RetroRewindWebsite.Models.DTOs.Multiplier;

public record MultiplierDto(int Id, string Channel, double Value, DateTime StartTime, DateTime EndTime);

public record MultiplierResultDto(bool Success, string Message, MultiplierDto? Multiplier = null);
public record MultiplierListResultDto(bool Success, int Count, List<MultiplierDto> Multipliers);
public record MultiplierDeletionResultDto(bool Success, string Message);
