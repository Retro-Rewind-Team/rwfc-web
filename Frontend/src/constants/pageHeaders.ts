import type { PixelIconName } from "../components/common/PixelIcon";

/*
 * Header artwork for every internal page, in one place.
 *
 * Every header band shows a gameplay backdrop: the project's one screenshot (Luigi Circuit, also
 * used by the home hero), blurred under a solid 85% overlay. Each page frames a different part of
 * it via HEADER_FOCUS, so pages share one look without being identical. On top, a page may add its
 * own visual (the title art, rank glyphs, the team's Miis, live stats).
 *
 * `needed` describes a page-specific screenshot that would suit that page better. To add one: put
 * it in /public/headers/, then set `art` for that page (layout "backdrop" replaces the shared
 * backdrop; "media" shows it framed beside the title). AI-generated or unlicensed images are not
 * accepted (CONTRIBUTING.md).
 */

export interface Backdrop {
    src: string;
    width: number;
    height: number;
}

/** The backdrop every header uses unless its page has its own "backdrop" art. Null: plain navy. */
export const DEFAULT_BACKDROP: Backdrop | null = {
    src: "/hero/luigi-circuit.jpg",
    width: 596,
    height: 335,
};

export interface HeaderArt {
    src: string;
    width: number;
    height: number;
    alt: string;
    /**
     * "media": shown in a frame beside the title. "backdrop": fills the band behind the text
     * under a solid dark overlay, for wide scenic shots.
     */
    layout: "media" | "backdrop";
}

export interface PageHeaderAsset {
    art: HeaderArt | null;
    /** Shown on the placeholder until real art exists. */
    icon: PixelIconName;
    /** What to capture, for whoever supplies the screenshot. */
    needed: string;
}

export type PageKey =
    | "downloads"
    | "rooms"
    | "vr"
    | "vrPlayer"
    | "tt"
    | "ttRankings"
    | "ttTrack"
    | "ttPlayer"
    | "races"
    | "stats"
    | "tools"
    | "team"
    | "rules"
    | "privacy";

/**
 * Which part of the backdrop each page frames (CSS object-position). The shot runs from sky and
 * floodlights at the top, through the stands, to the kart and the start line at the bottom.
 */
export const HEADER_FOCUS: Record<PageKey, string> = {
    downloads: "50% 50%",
    rooms: "50% 38%", // the stands: a crowd for the multiplayer page
    vr: "60% 25%", // stadium and the checkered flag
    vrPlayer: "60% 25%",
    tt: "50% 92%", // road and start line: the clock is about the track
    ttRankings: "50% 92%",
    ttTrack: "50% 92%",
    ttPlayer: "50% 92%",
    races: "50% 75%", // the kart on the grid
    stats: "50% 8%", // sky and floodlights: quiet, behind data
    tools: "15% 45%",
    team: "85% 40%",
    rules: "50% 50%",
    privacy: "50% 50%",
};

const SCREENSHOT = "16:9, at least 1600 x 900, PNG or WebP, captured in-game (Dolphin is fine)";

export const PAGE_HEADERS: Record<PageKey, PageHeaderAsset> = {
    downloads: {
        art: {
            src: "/RetroRewindLogo.png",
            width: 480,
            height: 270,
            alt: "Retro Rewind title art: the Mario Kart logo above the words Retro Rewind.",
            layout: "media",
        },
        icon: "disc",
        needed: "None. Uses the project's title art.",
    },
    rooms: {
        art: null,
        icon: "monitor",
        needed: `A Retro WFC lobby or the start of an online race with a full grid. ${SCREENSHOT}.`,
    },
    vr: {
        art: null,
        icon: "flag",
        needed: `An online race finish or results screen showing VR changes. ${SCREENSHOT}.`,
    },
    vrPlayer: {
        art: null,
        icon: "flag",
        needed: "None. Player pages show the player's own Mii.",
    },
    tt: {
        art: null,
        icon: "flag",
        needed: `A time trial in progress on a recognisable retro track. ${SCREENSHOT}.`,
    },
    ttRankings: {
        art: null,
        icon: "flag",
        needed: `A time trial results screen with a record time. ${SCREENSHOT}.`,
    },
    ttTrack: {
        art: null,
        icon: "flag",
        needed: `One screenshot per track, for track thumbnails. ${SCREENSHOT}, named by track id.`,
    },
    ttPlayer: {
        art: null,
        icon: "flag",
        needed: "None. Profile pages are about the player's records.",
    },
    races: {
        art: null,
        icon: "flag",
        needed: `A pack of karts mid-race in an online room. ${SCREENSHOT}.`,
    },
    stats: {
        art: null,
        icon: "monitor",
        needed: `A wide track overview, used as a subtle backdrop. ${SCREENSHOT}.`,
    },
    tools: {
        art: null,
        icon: "terminal",
        needed: "None. Uses Retro Rewind's rank glyphs.",
    },
    team: {
        art: null,
        icon: "console",
        needed: "None. Uses the team's Miis.",
    },
    rules: {
        art: null,
        icon: "flag",
        needed: `Optional: a clean online lobby shot. ${SCREENSHOT}.`,
    },
    privacy: {
        art: null,
        icon: "monitor",
        needed: "Optional. A text page; the placeholder is fine.",
    },
};
