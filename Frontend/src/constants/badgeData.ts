export const BadgeId = {
    RetroRewindDeveloper: 0,
    WheelWizardDeveloper: 1,
    Contributor: 2,
    RWFCModerator: 3,
    DiscordStaff: 4,
    TranslatorLead: 5,
    Translator: 6,
    Supporter: 7,
    BetaTester: 8,
    Heart: 9,
    FireStarterGold: 10,
    FireStarterSilver: 11,
    FireStarterBronze: 12,
    LeafStruckGold: 13,
    LeafStruckSilver: 14,
    LeafStruckBronze: 15,
    SummitShowdownGold: 16,
    SummitShowdownSilver: 17,
    SummitShowdownBronze: 18,
} as const;

export interface BadgeInfo {
    label: string;
    tooltip: string;
    tier?: "gold" | "silver" | "bronze";
}

export const badgeInfo: Record<number, BadgeInfo> = {
    [BadgeId.RetroRewindDeveloper]: { label: "RR Dev", tooltip: "Retro Rewind Developer" },
    [BadgeId.WheelWizardDeveloper]: { label: "WW Dev", tooltip: "WheelWizard Developer" },
    [BadgeId.Contributor]: { label: "Contributor", tooltip: "Project Contributor" },
    [BadgeId.RWFCModerator]: { label: "RWFC Mod", tooltip: "RWFC Server Moderator" },
    [BadgeId.DiscordStaff]: { label: "Discord Staff", tooltip: "Discord Staff Member" },
    [BadgeId.TranslatorLead]: { label: "Lead Trans", tooltip: "Translation Team Leader" },
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
};
