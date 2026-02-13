using RetroRewindWebsite.Models.Entities;

namespace RetroRewindWebsite.Services.Domain
{
    public class PlayerValidationService : IPlayerValidationService
    {
        private readonly ILogger<PlayerValidationService> _logger;

        private const int SuspiciousNewPlayerVR = 20000;
        private const int HighVRThreshold = 20000;
        private const int LargeVRJumpThreshold = 5000;
        private const int MaxVRJumpPerRace = 529;
        private const int SuspiciousJumpCountThreshold = 5;

        public PlayerValidationService(ILogger<PlayerValidationService> logger)
        {
            _logger = logger;
        }

        public bool IsSuspiciousNewPlayer(int vr)
        {
            return vr >= SuspiciousNewPlayerVR;
        }

        public bool IsSuspiciousVRJump(int vrChange, int currentVR)
        {
            if (currentVR >= HighVRThreshold && vrChange >= LargeVRJumpThreshold)
            {
                return true;
            }

            if (vrChange > MaxVRJumpPerRace)
            {
                return true;
            }

            return false;
        }

        public bool ShouldFlagPlayer(PlayerEntity player, int previousVR)
        {
            if (player.IsSuspicious)
            {
                return true;
            }

            var vrJump = player.Ev - previousVR;
            return IsSuspiciousVRJump(vrJump, player.Ev);
        }

        public void UpdateSuspiciousStatus(PlayerEntity player, int previousVR)
        {
            var vrJump = player.Ev - previousVR;

            if (player.Ev >= HighVRThreshold && vrJump >= LargeVRJumpThreshold)
            {
                player.IsSuspicious = true;

                player.FlagReason = $"High VR jump: {previousVR} -> {player.Ev} (+{vrJump})";

                _logger.LogWarning(
                    "Player flagged for high VR jump: {Name} ({FriendCode}) - {OldVR} -> {NewVR} (+{Jump})",
                    player.Name, player.Fc, previousVR, player.Ev, vrJump);

                return;
            }

            if (vrJump > MaxVRJumpPerRace)
            {
                player.SuspiciousVRJumps++;

                if (player.SuspiciousVRJumps >= SuspiciousJumpCountThreshold)
                {
                    player.IsSuspicious = true;

                    player.FlagReason = $"Multiple suspicious VR jumps: {player.SuspiciousVRJumps} jumps over {MaxVRJumpPerRace} VR";

                    _logger.LogWarning(
                        "Player flagged for multiple suspicious VR jumps: {Name} ({FriendCode}) - {JumpCount} jumps",
                        player.Name, player.Fc, player.SuspiciousVRJumps);
                }
                else
                {
                    _logger.LogInformation(
                        "Suspicious VR jump detected: {Name} ({FriendCode}) - Jump: {VRJump} (Count: {JumpCount})",
                        player.Name, player.Fc, vrJump, player.SuspiciousVRJumps);
                }
            }
        }
    }
}