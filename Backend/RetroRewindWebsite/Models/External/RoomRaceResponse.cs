namespace RetroRewindWebsite.Models.External
{
    public class RoomRaceResponse
    {
        public required Dictionary<string, List<RaceResult>> Results { get; set; }
    }

    public class RaceResult
    {
        public long ProfileID { get; set; }
        public int PlayerID { get; set; }
        public int FinishTime { get; set; }
        public short CharacterID { get; set; }
        public short VehicleID { get; set; }
        public short PlayerCount { get; set; }
        public short FinishPos { get; set; }
        public int FramesIn1st { get; set; }
        public short CourseID { get; set; }
        public short EngineClassID { get; set; }
    }
}