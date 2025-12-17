using RetroRewindWebsite.Models.DTOs;

namespace RetroRewindWebsite.Services.Application
{
    public interface ISplitRoomDetector
    {
        List<RoomDto> DetectAndSplitRooms(List<RoomDto> rooms);
    }
}