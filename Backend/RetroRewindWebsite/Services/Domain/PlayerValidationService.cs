using RetroRewindWebsite.Models.Entities;

namespace RetroRewindWebsite.Services.Domain
{
    public class PlayerValidationService : IPlayerValidationService
    {
        private readonly ILogger<PlayerValidationService> _logger;

        public PlayerValidationService(ILogger<PlayerValidationService> logger)
        {
            _logger = logger;
        }

        public bool IsSuspiciousNewPlayer(int vr)
        {
            // Flag new players who join with VR >= 20,000
            return vr >= 20000;
        }

        public bool IsSuspiciousVRJump(int vrChange, int currentVR)
        {
            // Flag large VR jumps
            if (currentVR >= 20000 && vrChange >= 5000)
                return true;

            // Flag any jump >= 200 VR (impossible in single race)
            return vrChange >= 200;
        }

        public bool ShouldFlagPlayer(PlayerEntity player, int previousVR)
        {
            var vrJump = player.Ev - previousVR;

            // Check for suspicious VR jump
            if (IsSuspiciousVRJump(vrJump, player.Ev))
                return true;

            // Already flagged
            if (player.IsSuspicious)
                return true;

            return false;
        }

        public void UpdateSuspiciousStatus(PlayerEntity player, int previousVR)
        {
            var vrJump = player.Ev - previousVR;

            // Check for high VR + large jump
            if (player.Ev >= 20000 && vrJump >= 5000)
            {
                player.IsSuspicious = true;
                _logger.LogWarning("Player flagged for high VR jump: {Name} ({Fc}) - {OldVR} -> {NewVR}",
                    player.Name, player.Fc, previousVR, player.Ev);
                return;
            }

            // Check for impossible VR jump
            if (vrJump > 475)
            {
                player.SuspiciousVRJumps++;

                if (player.SuspiciousVRJumps >= 5)
                {
                    player.IsSuspicious = true;
                    _logger.LogWarning("Player flagged for multiple suspicious VR jumps: {Name} ({Fc}) - {JumpCount} jumps",
                        player.Name, player.Fc, player.SuspiciousVRJumps);
                }
                else
                {
                    _logger.LogInformation("Suspicious VR jump detected: {Name} ({Fc}) - Jump: {VRJump} (Count: {JumpCount})",
                        player.Name, player.Fc, vrJump, player.SuspiciousVRJumps);
                }
            }
        }
    }
}
