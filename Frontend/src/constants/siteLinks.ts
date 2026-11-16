/**
 * Every outbound URL the site links to more than once lives here, so a moved Discord invite or
 * download host is a one-line change.
 */
export const SITE_LINKS = {
    discord: "https://discord.gg/retrorewind",
    github: "https://github.com/Retro-Rewind-Team/rwfc-web",
    wiki: "https://wiki.tockdom.com/wiki/Retro_Rewind",
    fullDownload: "https://update.rwfc.net/RetroRewind/zip/RetroRewind.zip",
    wheelWizard: "https://github.com/TeamWheelWizard/WheelWizard/releases",
    /** Used until the GitHub API tells us the latest channel release asset. */
    wiiChannelFallback: "https://github.com/Jacherr/RR-Launcher/releases/latest",
    trackList:
        "https://docs.google.com/spreadsheets/d/1FelOidNHL1bqSaKeycZux1eQcDyrosONFC_qWVTYoog/edit?usp=sharing",
} as const;

/** Other distributions that also run on Retro WFC, shown on the downloads page. */
export const OTHER_DISTRIBUTIONS = [
    { name: "Wack Track Pack", discordUrl: "https://discord.com/invite/XB6YmGhyNA" },
    { name: "OptPack", discordUrl: "https://discord.gg/37p93TtZHZ" },
    { name: "Luminous Redux", discordUrl: "https://discord.gg/ZCuny29DQk" },
    { name: "CTGP Classic", discordUrl: "https://discord.gg/ztuhWaWnkh" },
] as const;
