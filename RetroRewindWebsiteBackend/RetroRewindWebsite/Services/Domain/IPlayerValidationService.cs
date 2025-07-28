using RetroRewindWebsite.Models.Entities;

namespace RetroRewindWebsite.Services.Domain
{
    public interface IPlayerValidationService
    {
        bool IsSuspiciousNewPlayer(int vr);
        bool IsSuspiciousVRJump(int vrChange, int currentVR);
        bool ShouldFlagPlayer(PlayerEntity player, int previousVR);
        void UpdateSuspiciousStatus(PlayerEntity player, int previousVR);
    }
}
