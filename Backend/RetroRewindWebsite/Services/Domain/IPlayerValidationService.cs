using RetroRewindWebsite.Models.Entities;

namespace RetroRewindWebsite.Services.Domain
{
    public interface IPlayerValidationService
    {
        /// <summary>
        /// Check if a new player's VR is suspicious
        /// </summary>
        bool IsSuspiciousNewPlayer(int vr);

        /// <summary>
        /// Check if a VR change is suspiciously large
        /// </summary>
        bool IsSuspiciousVRJump(int vrChange, int currentVR);

        /// <summary>
        /// Determine if player should be flagged as suspicious
        /// </summary>
        bool ShouldFlagPlayer(PlayerEntity player, int previousVR);

        /// <summary>
        /// Update player's suspicious status based on VR change
        /// </summary>
        void UpdateSuspiciousStatus(PlayerEntity player, int previousVR);
    }
}