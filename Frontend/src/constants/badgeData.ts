// NOTE: The order of these should not be modified. Badges should only be added
// onto the end of each section. Keep in sync with wfc-bot's BadgeType.
export enum BadgeId {
    // Core Devs for Retro Rewind or RWFC Services (projects under the Retro
    // Rewind Team Org)
    RetroRewindDeveloper = 0,
    // Core Devs for Wheel Wizard
    WheelWizardDeveloper,
    // Significant Contributor to any relevant projects. Major PRs/Features,
    // extensive community management, major asset contributions, etc.
    MajorContributor,

    // Moderators/Admins for RWFC servers
    RWFCModerator = 100,
    // Discord Moderators/Admins
    DiscordStaff,

    // Minor contributor. Gecko codes, small assets or features, one-off changes.
    Contributor = 1000,
    Translator,
    Supporter,
    BetaTester,
    Heart,

    // Tourney Badges
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
    BotBBronze,
}

export interface BadgeInfo {
    label: string;
    tooltip: string;
    tier?: "gold" | "silver" | "bronze";
}

export const badgeInfo: Record<number, BadgeInfo> = {
    [BadgeId.RetroRewindDeveloper]: { label: "RR Dev", tooltip: "Retro Rewind Developer" },
    [BadgeId.WheelWizardDeveloper]: { label: "WW Dev", tooltip: "WheelWizard Developer" },
    [BadgeId.MajorContributor]: { label: "Major Contributor", tooltip: "Major Contributor" },
    [BadgeId.RWFCModerator]: { label: "RWFC Mod", tooltip: "RWFC Server Moderator" },
    [BadgeId.DiscordStaff]: { label: "Discord Staff", tooltip: "Discord Staff Member" },
    [BadgeId.Contributor]: { label: "Contributor", tooltip: "Project Contributor" },
    [BadgeId.Translator]: { label: "Translator", tooltip: "Community Translator" },
    [BadgeId.Supporter]: { label: "Supporter", tooltip: "Community Supporter" },
    [BadgeId.BetaTester]: { label: "Beta Tester", tooltip: "Beta Tester" },
    [BadgeId.Heart]: { label: "Heart", tooltip: "Given a Heart by the Team" },
    [BadgeId.FireStarterGold]: {
        label: "Firestarter",
        tooltip: "Firestarter Tournament - Gold Winner",
        tier: "gold",
    },
    [BadgeId.FireStarterSilver]: {
        label: "Firestarter",
        tooltip: "Firestarter Tournament - Silver Winner",
        tier: "silver",
    },
    [BadgeId.FireStarterBronze]: {
        label: "Firestarter",
        tooltip: "Firestarter Tournament - Bronze Winner",
        tier: "bronze",
    },
    [BadgeId.LeafStruckGold]: {
        label: "Leafstruck",
        tooltip: "Leafstruck Tournament - Gold Winner",
        tier: "gold",
    },
    [BadgeId.LeafStruckSilver]: {
        label: "Leafstruck",
        tooltip: "Leafstruck Tournament - Silver Winner",
        tier: "silver",
    },
    [BadgeId.LeafStruckBronze]: {
        label: "Leafstruck",
        tooltip: "Leafstruck Tournament - Bronze Winner",
        tier: "bronze",
    },
    [BadgeId.SummitShowdownGold]: {
        label: "Summit",
        tooltip: "Summit Showdown Tournament - Gold Winner",
        tier: "gold",
    },
    [BadgeId.SummitShowdownSilver]: {
        label: "Summit",
        tooltip: "Summit Showdown Tournament - Silver Winner",
        tier: "silver",
    },
    [BadgeId.SummitShowdownBronze]: {
        label: "Summit",
        tooltip: "Summit Showdown Tournament - Bronze Winner",
        tier: "bronze",
    },
    [BadgeId.HorizonGold]: {
        label: "Horizon",
        tooltip: "Horizon Tournament - Gold Winner",
        tier: "gold",
    },
    [BadgeId.HorizonSilver]: {
        label: "Horizon",
        tooltip: "Horizon Tournament - Silver Winner",
        tier: "silver",
    },
    [BadgeId.HorizonBronze]: {
        label: "Horizon",
        tooltip: "Horizon Tournament - Bronze Winner",
        tier: "bronze",
    },
    [BadgeId.SunblossomGold]: {
        label: "Sunblossom",
        tooltip: "Sunblossom Tournament - Gold Winner",
        tier: "gold",
    },
    [BadgeId.SunblossomSilver]: {
        label: "Sunblossom",
        tooltip: "Sunblossom Tournament - Silver Winner",
        tier: "silver",
    },
    [BadgeId.SunblossomBronze]: {
        label: "Sunblossom",
        tooltip: "Sunblossom Tournament - Bronze Winner",
        tier: "bronze",
    },
    [BadgeId.EarthboundGold]: {
        label: "Earthbound",
        tooltip: "Earthbound Tournament - Gold Winner",
        tier: "gold",
    },
    [BadgeId.EarthboundSilver]: {
        label: "Earthbound",
        tooltip: "Earthbound Tournament - Silver Winner",
        tier: "silver",
    },
    [BadgeId.EarthboundBronze]: {
        label: "Earthbound",
        tooltip: "Earthbound Tournament - Bronze Winner",
        tier: "bronze",
    },
    [BadgeId.BotBGold]: {
        label: "Bottom of the Barrel",
        tooltip: "Bottom of the Barrel Tournament - Gold Winner",
        tier: "gold",
    },
    [BadgeId.BotBSilver]: {
        label: "Bottom of the Barrel",
        tooltip: "Bottom of the Barrel Tournament - Silver Winner",
        tier: "silver",
    },
    [BadgeId.BotBBronze]: {
        label: "Bottom of the Barrel",
        tooltip: "Bottom of the Barrel Tournament - Bronze Winner",
        tier: "bronze",
    },
};
