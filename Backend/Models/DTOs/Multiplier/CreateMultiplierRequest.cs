namespace RetroRewindWebsite.Models.DTOs.Multiplier;

public class CreateMultiplierRequest
{
    public string Channel { get; set; } = string.Empty;
    public double Value { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}
