namespace RetroRewindWebsite.Models.DTOs.Multiplier;

public class UpdateMultiplierRequest
{
    public double Value { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}
