namespace RetroRewindWebsite.Models.External
{
    public class ExternalPlayer
    {
        public required string Count { get; set; }
        public required string Pid { get; set; }
        public required string Name { get; set; }
        public string? Conn_map { get; set; }
        public string? Conn_fail { get; set; }
        public string? Suspend { get; set; }
        public required string Fc { get; set; }
        public string? Ev { get; set; } // VR 
        public string? Eb { get; set; }
        public List<Mii>? Mii { get; set; }
        public string? Openhost { get; set; }

        // Helper properties to convert string values to proper types
        public int VR => int.TryParse(Ev, out var vr) ? vr : 0;
        public int BR => int.TryParse(Eb, out var br) ? br : 5000;
        public bool IsOpenHost => Openhost == "true";
        public bool IsSuspended => Suspend == "1";
    }
}
