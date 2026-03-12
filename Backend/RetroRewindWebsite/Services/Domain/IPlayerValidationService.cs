using RetroRewindWebsite.Models.Domain;
using RetroRewindWebsite.Models.Entities.Player;

namespace RetroRewindWebsite.Services.Domain;

public interface IPlayerValidationService
{
    bool IsSuspiciousNewPlayer(int vr);
    bool IsSuspiciousVRJump(int vrChange, int currentVR);
    bool ShouldFlagPlayer(PlayerEntity player, int previousVR);
    SuspiciousStatusUpdate? CheckSuspiciousStatus(PlayerEntity player, int previousVR);
}
