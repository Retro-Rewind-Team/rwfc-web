namespace RetroRewindWebsite.Models.External
{
    public class Group
    {
        // These are the Retro WFC Rooms
        public required string Id { get; set; }
        public required string Game { get; set; }
        public DateTime Created { get; set; }
        public required string Type { get; set; }
        public bool Suspend { get; set; }
        public required string Host { get; set; }
        public string? Rk { get; set; } // Optional - not all groups have this
        public required Dictionary<string, ExternalPlayer> Players { get; set; }
        public Race? Race { get; set; } // Optional race information
    }

    public class Race
    {
        public int Num { get; set; }
        public int Course { get; set; }
        public int Cc { get; set; }
    }
}
