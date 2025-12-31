namespace RetroRewindWebsite.Models.DTOs
{
    public class RoomStatusResponseDto
    {
        public required List<RoomDto> Rooms { get; set; }
        public DateTime Timestamp { get; set; }
        public int Id { get; set; }
        public int MinimumId { get; set; }
        public int MaximumId { get; set; }
    }

    public class RoomDto
    {
        public required string Id { get; set; }
        public required string Type { get; set; }
        public DateTime Created { get; set; }
        public required string Host { get; set; }
        public string? Rk { get; set; }
        public required List<RoomPlayerDto> Players { get; set; }
        public int? AverageVR { get; set; }
        public RaceDto? Race { get; set; }
        public bool Suspend { get; set; }

        public string RoomType => GetRoomType(Rk);
        public bool IsPublic => Type == "anybody";
        public bool IsJoinable => Players.Count < 12 && !Suspend;
        public bool IsSuspended => Suspend;

        private static string GetRoomType(string? rk)
        {
            if (string.IsNullOrEmpty(rk))
            {
                return "Unknown Room Type";
            }

            return rk switch
            {
                "vs_10" => "Retro Tracks",
                "vs_11" => "Online TT",
                "vs_12" => "200cc",
                "vs_13" => "Item Rain",
                "vs_14" => "Regular Battle",
                "vs_15" => "Elimination Battle",
                "vs_20" => "Custom Tracks",
                "vs_21" => "Vanilla Tracks",
                "vs_22" => "CT 200cc",
                "vs_666" => "Luminous 150cc",
                "vs_667" => "Luminous Online TT",
                "vs_668" => "CTGP-C",
                "vs_751" => "Versus",
                "vs_-1" => "Regular",
                "vs" => "Regular",
                "vs_69" => "IKW Default",
                "vs_70" => "IKW Ultras VS",
                "vs_71" => "IKW Countdown",
                "vs_72" => "IKW Bob-omb Blast",
                "vs_73" => "IKW Infinite Accel",
                "vs_74" => "IKW Banana Slip",
                "vs_75" => "IKW Random Items",
                "vs_76" => "IKW Unfair Items",
                "vs_77" => "IKW Blue Shell Madness",
                "vs_78" => "IKW Mushroom Dash",
                "vs_79" => "IKW Bumper Karts",
                "vs_80" => "IKW Item Rampage",
                "vs_81" => "IKW Item Rain",
                "vs_82" => "IKW Shell Break",
                "vs_83" => "IKW Riibalanced",
                "vs_875" => "OptPack 150cc",
                "vs_876" => "OptPack Online TT",
                "vs_877" => "OptPack",
                "vs_878" => "OptPack",
                "vs_879" => "OptPack",
                "vs_880" => "OptPack",
                "vs_1312" => "WTP 150cc",
                "vs_1313" => "WTP 200cc",
                "vs_1314" => "WTP Online TT",
                "vs_1315" => "WTP Item Rain",
                "vs_1316" => "WTP STYD",
                _ => ""
            };
        }
    }

    public class RoomPlayerDto
    {
        public required string Pid { get; set; }
        public required string Name { get; set; }
        public required string FriendCode { get; set; }
        public int? VR { get; set; }
        public int? BR { get; set; }
        public bool IsOpenHost { get; set; }
        public bool IsSuspended { get; set; }
        public MiiDto? Mii { get; set; }
        public List<string> ConnectionMap { get; set; } = [];
    }

    public class MiiDto
    {
        public required string Data { get; set; }
        public required string Name { get; set; }
    }

    public class RaceDto
    {
        public int Num { get; set; }
        public int Course { get; set; }
        public int Cc { get; set; }
    }

    public class RoomStatusStatsDto
    {
        public int TotalPlayers { get; set; }
        public int TotalRooms { get; set; }
        public int PublicRooms { get; set; }
        public int PrivateRooms { get; set; }
        public DateTime LastUpdated { get; set; }
    }
}