namespace RetroRewindWebsite.Models.DTOs
{
    public class MiiResponseDto
    {
        public required string FriendCode { get; set; }
        public required string MiiImageBase64 { get; set; }
    }

    public class BatchMiiRequestDto
    {
        public required List<string> FriendCodes { get; set; }
    }

    public class BatchMiiResponseDto
    {
        public required Dictionary<string, string> Miis { get; set; }
    }
}
