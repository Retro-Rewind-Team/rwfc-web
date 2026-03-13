namespace RetroRewindWebsite.Models.Domain;

public record SuspiciousStatusUpdate(
    bool IsSuspicious,
    int SuspiciousVRJumps,
    string FlagReason
);
