using RetroRewindWebsite.Models.Domain;
using RetroRewindWebsite.Models.Entities.Player;

namespace RetroRewindWebsite.Services.Domain;

public class PlayerValidationService : IPlayerValidationService
{
    private readonly ILogger<PlayerValidationService> _logger;

    private const int SuspiciousNewPlayerVR = 20000; // A brand-new account at 20 000+ VR has no prior history
    private const int HighVRThreshold = 20000; // At this VR level a 5 000-point jump should not be tolerated
    private const int LargeVRJumpThreshold = 5000;
    private const int MaxVRJumpPerRace = 529; // 529 = maximum VR gain achievable in a single race (12-player room, first place, VR multiplier)
    private const int SuspiciousJumpCountThreshold = 5; // Flag after 5 over-max jumps; allows for one-off API glitches

    public PlayerValidationService(ILogger<PlayerValidationService> logger)
    {
        _logger = logger;
    }

    public bool IsSuspiciousNewPlayer(int vr) => vr >= SuspiciousNewPlayerVR;

    public bool IsSuspiciousVRJump(int vrChange, int currentVR) =>
        (currentVR >= HighVRThreshold && vrChange >= LargeVRJumpThreshold) ||
        vrChange > MaxVRJumpPerRace;

    public SuspiciousStatusUpdate? CheckSuspiciousStatus(PlayerEntity player, int previousVR)
    {
        var vrJump = player.Ev - previousVR;

        // Path 1: single large jump while already at high VR, flag immediately, no accumulation needed
        if (player.Ev >= HighVRThreshold && vrJump >= LargeVRJumpThreshold)
        {
            _logger.LogWarning(
                "Player flagged for high VR jump: {Name} ({FriendCode}) - {OldVR} -> {NewVR} (+{Jump})",
                player.Name, player.Fc, previousVR, player.Ev, vrJump);

            return new SuspiciousStatusUpdate(
                IsSuspicious: true,
                SuspiciousVRJumps: player.SuspiciousVRJumps,
                FlagReason: $"High VR jump: {previousVR} -> {player.Ev} (+{vrJump})"
            );
        }

        // Path 2: jump exceeds the single-race maximum, accumulate; flag once the threshold count is reached
        if (vrJump > MaxVRJumpPerRace)
        {
            var newJumpCount = player.SuspiciousVRJumps + 1;

            if (newJumpCount >= SuspiciousJumpCountThreshold)
            {
                _logger.LogWarning(
                    "Player flagged for multiple suspicious VR jumps: {Name} ({FriendCode}) - {JumpCount} jumps",
                    player.Name, player.Fc, newJumpCount);

                return new SuspiciousStatusUpdate(
                    IsSuspicious: true,
                    SuspiciousVRJumps: newJumpCount,
                    FlagReason: $"Multiple suspicious VR jumps: {newJumpCount} jumps over {MaxVRJumpPerRace} VR"
                );
            }

            _logger.LogInformation(
                "Suspicious VR jump detected: {Name} ({FriendCode}) - Jump: {VRJump} (Count: {JumpCount})",
                player.Name, player.Fc, vrJump, newJumpCount);

            return new SuspiciousStatusUpdate(
                IsSuspicious: player.IsSuspicious,
                SuspiciousVRJumps: newJumpCount,
                FlagReason: player.FlagReason
            );
        }

        return null;
    }
}
