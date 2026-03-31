using RetroRewindWebsite.Models.Domain;
using RetroRewindWebsite.Models.Entities.Player;

namespace RetroRewindWebsite.Services.Domain;

public interface IPlayerValidationService
{
    /// <summary>
    /// Determines whether a new player with the specified VR value is considered suspicious based on predefined
    /// criteria.
    /// </summary>
    /// <param name="vr">The VR value associated with the new player. Must be a non-negative integer representing the player's VR rating.</param>
    /// <returns>true if the new player is considered suspicious; otherwise, false.</returns>
    bool IsSuspiciousNewPlayer(int vr);
    /// <summary>
    /// Determines whether a change in VR rating is considered suspicious based on the provided values.
    /// </summary>
    /// <remarks>Use this method to flag unusual VR rating changes that may require further investigation. The
    /// criteria for suspicion depend on the values provided.</remarks>
    /// <param name="vrChange">The amount of change in VR rating to evaluate. Positive or negative values indicate the direction and magnitude
    /// of the change.</param>
    /// <param name="currentVR">The current VR rating before the change is applied. Used to assess the context of the change.</param>
    /// <returns>true if the VR change is considered suspicious; otherwise, false.</returns>
    bool IsSuspiciousVRJump(int vrChange, int currentVR);
    /// <summary>
    /// Determines whether the specified player should be flagged based on their current state and previous VR value.
    /// </summary>
    /// <param name="player">The player entity to evaluate for flagging. Cannot be null.</param>
    /// <param name="previousVR">The previous VR value associated with the player. Used to assess changes in player behavior.</param>
    /// <returns>A value indicating whether the player should be flagged. Returns <see langword="true"/> if the player meets the
    /// flagging criteria; otherwise, <see langword="false"/>.</returns>
    bool ShouldFlagPlayer(PlayerEntity player, int previousVR);
    /// <summary>
    /// Evaluates the player's status to determine if a suspicious activity update is required based on the provided
    /// previous VR value.
    /// </summary>
    /// <param name="player">The player entity whose status is being checked for suspicious activity. Cannot be null.</param>
    /// <param name="previousVR">The previous VR value associated with the player. Used to compare against the current state to detect changes.</param>
    /// <returns>A SuspiciousStatusUpdate object if a suspicious status change is detected; otherwise, null.</returns>
    SuspiciousStatusUpdate? CheckSuspiciousStatus(PlayerEntity player, int previousVR);
}
