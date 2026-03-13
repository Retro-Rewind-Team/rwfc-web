namespace RetroRewindWebsite.Models.DTOs.Room;

public static class RoomDtoExtensions
{
    public static string GetRoomType(this RoomDto room) => room.Rk switch
    {
        null or "" => "Unknown Room Type",
        "vs_10" => "Retro Tracks",
        "vs_11" => "Online TT",
        "vs_12" => "200cc",
        "vs_13" => "Item Rain",
        "vs_14" => "Regular Battle",
        "bt_15" => "Elimination Battle",
        "vs_20" => "Custom Tracks",
        "vs_21" => "Vanilla Tracks",
        "vs_666" => "Luminous 150cc",
        "vs_667" => "Luminous Online TT",
        "vs_668" => "CTGP-C",
        "vs_669" => "CTGP-C Online TT",
        "vs_670" => "CTGP-C Placeholder",
        "vs_751" => "Versus",
        "vs_-1" => "Regular",
        "vs" => "Regular",
        "vs_875" => "OptPack 150cc",
        "vs_876" => "OptPack Online TT",
        "vs_877" or "vs_878" or "vs_879" or "vs_880" => "OptPack",
        "vs_1312" => "WTP 150cc",
        "vs_1313" => "WTP 200cc",
        "vs_1314" => "WTP Online TT",
        "vs_1315" => "WTP Item Rain",
        "vs_1316" => "WTP STYD",
        _ => ""
    };

    public static bool IsPublic(this RoomDto room) => room.Type == "anybody";

    public static bool IsJoinable(this RoomDto room) => room.Players.Count < 12 && !room.Suspend;
}
