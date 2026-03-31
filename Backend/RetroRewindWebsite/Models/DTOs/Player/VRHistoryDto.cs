namespace RetroRewindWebsite.Models.DTOs.Player;

public record VRHistoryDto(DateTime Date, int VRChange, int TotalVR);

public record VRHistoryRangeResponseDto(
    string PlayerId,
    DateTime FromDate,
    DateTime ToDate,
    List<VRHistoryDto> History,
    int TotalVRChange,
    int StartingVR,
    int EndingVR
);

public record RecentChangeDto(
    string PlayerId,
    string FriendCode,
    DateTime Date,
    int VRChange,
    int TotalVR
);
