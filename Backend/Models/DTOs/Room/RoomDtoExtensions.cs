namespace RetroRewindWebsite.Models.DTOs.Room;

/// <summary>Convenience extensions on <see cref="RoomDto"/> for classifying room metadata.</summary>
public static class RoomDtoExtensions
{
    /// <summary>
    /// Returns the human-readable room type for display, derived from the <c>rk</c> (room key)
    /// field sent by the RWFC API. Each mod pack uses its own <c>vs_NNN</c> namespace.
    /// Returns an empty string for unrecognised keys.
    /// </summary>
    public static string GetRoomType(this RoomDto room) => room.Rk switch
    {
        null or "" => "Unknown Room Type",

        // ===== RETRO REWIND =====
        "vs_10" => "Retro Tracks",
        "vs_11" => "Online TT",
        "vs_12" => "200cc",
        "vs_13" => "Item Rain",
        "vs_14" => "Regular Battle",
        "vs_15" => "Elimination Battle",
        "vs_20" => "Custom Tracks",
        "vs_21" => "Vanilla Tracks",
        "vs_22" => "CT 200cc",

        // ===== LUMINOUS =====
        "vs_666" => "Luminous 150cc",
        "vs_667" => "Luminous Online TT",

        // ===== CTGP-C =====
        "vs_668" => "CTGP-C",
        "vs_669" => "CTGP-C Online TT",
        "vs_670" => "CTGP-C Placeholder",

        // ===== IKW =====
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

        // ===== OPTPACK =====
        "vs_875" => "OptPack 150cc",
        "vs_876" => "OptPack Online TT",
        "vs_877" or "vs_878" or "vs_879" or "vs_880" => "OptPack",

        // ===== WTP =====
        "vs_1312" => "WTP 150cc",
        "vs_1313" => "WTP 200cc",
        "vs_1314" => "WTP Online TT",
        "vs_1315" => "WTP Item Rain",
        "vs_1316" => "WTP STYD",

        // ===== GENERIC =====
        "vs_751" => "Versus",
        "vs_-1" or "vs" => "Regular",

        _ => ""
    };

    /// <summary>
    /// Returns <c>true</c> if the room is open to anybody (as opposed to friends-only or private).
    /// </summary>
    public static bool IsPublic(this RoomDto room) => room.Type == "anybody";

    /// <summary>
    /// Returns <c>true</c> if the room has fewer than 12 players and is not suspended.
    /// </summary>
    public static bool IsJoinable(this RoomDto room) => room.Players.Count < 12 && !room.Suspend;
}
