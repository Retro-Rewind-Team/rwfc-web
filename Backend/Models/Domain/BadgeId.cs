namespace RetroRewindWebsite.Models.Domain;

/// <summary>
/// The badge ids the moderation endpoints accept. Mirrors wfc-bot's BadgeType
/// (src/commands/shared/badges.ts) and the frontend's BadgeId
/// (src/constants/badgeData.ts); all three must be updated together.
/// </summary>
/// <remarks>
/// The order must not be modified. New badges go on the end of their section, and expunged
/// badges keep their slot so stored ids never change meaning.
/// </remarks>
public enum BadgeId
{
    // Core devs for Retro Rewind or RWFC services.
    RetroRewindDeveloper = 0,
    // Core devs for Wheel Wizard.
    WheelWizardDeveloper,
    // Major PRs/features, extensive community management, major asset contributions.
    MajorContributor,

    // Moderators/admins for RWFC servers.
    RWFCModerator = 100,
    // Discord moderators/admins.
    DiscordStaff,

    // Minor contributor. Gecko codes, small assets or features, one-off changes.
    Contributor = 1000,
    Translator,
    Supporter,
    BetaTester,
    Heart,

    // Tourney badges.
    FireStarterGold = 2000,
    FireStarterSilver,
    FireStarterBronze,
    LeafStruckGold,
    LeafStruckSilver,
    LeafStruckBronze,
    SummitShowdownGold,
    SummitShowdownSilver,
    SummitShowdownBronze,
    HorizonGold,
    HorizonSilver,
    HorizonBronze,
    SunblossomGold,
    SunblossomSilver,
    SunblossomBronze,
    EarthboundGold,
    EarthboundSilver,
    EarthboundBronze,
    BotBGold,
    BotBSilver,
    BotBBronze
}
