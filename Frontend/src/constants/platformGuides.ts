import type { PlatformLogoName } from "../components/common/PlatformLogo";
import { SITE_LINKS } from "./siteLinks";

/*
 * Setup content for each platform. Steps come from the existing downloads page and its video
 * guides. Anything not stated there is flagged `verify: true`, which renders a visible
 * "[verify with maintainers]" marker until someone confirms it and removes the flag.
 */

export type PlatformId =
    | "wii"
    | "dolphin"
    | "pc"
    | "steam-deck"
    | "linux"
    | "macos"
    | "android"
    | "ios";

export interface GuideLink {
    label: string;
    href: string;
}

export interface GuideStep {
    text: string;
    /** "wii-channel" is resolved at runtime because its URL comes from the GitHub API. */
    link?: GuideLink | "wii-channel";
    verify?: boolean;
}

export interface PlatformGuide {
    id: PlatformId;
    /** Short name for the platform picker. */
    name: string;
    /** Full name for the panel heading. */
    title: string;
    /** The platform's official logo, shown on its picker card. */
    logo: PlatformLogoName;
    summary: string;
    summaryVerify?: boolean;
    steps: GuideStep[];
    guide: GuideLink & { kind: "video" | "written" };
    extraGuides?: (GuideLink & { kind: "video" | "written" })[];
}

const youtube = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/** For platforms whose only source is a full guide: point at it rather than paraphrase it. */
const guideOnlySteps = (platform: string, kind: "video" | "written" = "video"): GuideStep[] => [
    {
        text: `Follow the ${platform} ${kind} guide. It covers the full install from start to finish.`,
    },
    {
        text: "Run through the checklist before you go online.",
    },
];

export const PLATFORM_GUIDES: PlatformGuide[] = [
    {
        id: "wii",
        name: "Wii",
        title: "Wii and vWii",
        logo: "wii",
        summary: "Play on a Wii, or on a Wii U in Wii mode (vWii), from an SD card.",
        steps: [
            {
                text: "Download the full Retro Rewind package.",
                link: { label: "Full download (.zip)", href: SITE_LINKS.fullDownload },
            },
            {
                text: "Extract it to the root of your SD card. Replace existing files when asked, and do not delete any files.",
            },
            {
                text: "Install the Wii channel to launch Retro Rewind from the Wii Menu.",
                link: "wii-channel",
                verify: true,
            },
            {
                text: "Put the SD card back in your console and start Retro Rewind.",
                verify: true,
            },
        ],
        guide: { kind: "video", label: "Wii and vWii video guide", href: youtube("8AHuddFN2wk") },
    },
    {
        id: "dolphin",
        name: "Dolphin",
        title: "Dolphin emulator",
        logo: "dolphin",
        summary: "Play in the Dolphin emulator. Wheel Wizard is the easiest way to set it up.",
        steps: [
            {
                text: "Download Wheel Wizard and follow its setup.",
                link: { label: "Wheel Wizard releases", href: SITE_LINKS.wheelWizard },
                verify: true,
            },
            {
                text: "In Dolphin, turn off Enable Cheats.",
            },
        ],
        guide: { kind: "video", label: "Dolphin video guide", href: youtube("BfuSe-_GpKk") },
        extraGuides: [
            {
                kind: "video",
                label: "Build a Retro Rewind ISO with ISO Builder",
                href: youtube("z5PW9iPkZfQ"),
            },
        ],
    },
    {
        id: "pc",
        name: "PC",
        title: "Windows PC",
        logo: "windows",
        summary:
            "Wheel Wizard is the PC launcher for Retro Rewind. It runs the game through Dolphin.",
        summaryVerify: true,
        steps: [
            {
                text: "Download the latest Wheel Wizard release from GitHub.",
                link: { label: "Wheel Wizard releases", href: SITE_LINKS.wheelWizard },
            },
            {
                text: "Open Wheel Wizard and follow its setup to install Retro Rewind.",
                verify: true,
            },
            {
                text: "In Dolphin, turn off Enable Cheats.",
            },
        ],
        guide: { kind: "video", label: "Dolphin video guide", href: youtube("BfuSe-_GpKk") },
    },
    {
        id: "steam-deck",
        name: "Steam Deck",
        title: "Steam Deck",
        logo: "steamdeck",
        summary: "Install and play Retro Rewind on Steam Deck.",
        steps: guideOnlySteps("Steam Deck"),
        guide: { kind: "video", label: "Steam Deck video guide", href: youtube("uws4aV8y1gk") },
    },
    {
        id: "linux",
        name: "Linux",
        title: "Linux",
        logo: "linux",
        summary: "Install and play Retro Rewind on Linux.",
        steps: guideOnlySteps("Linux"),
        guide: { kind: "video", label: "Linux video guide", href: youtube("pNneOrThK_c") },
    },
    {
        id: "macos",
        name: "macOS",
        title: "macOS",
        logo: "apple",
        summary: "Install and play Retro Rewind on a Mac.",
        steps: guideOnlySteps("macOS"),
        guide: { kind: "video", label: "macOS video guide", href: youtube("iuczt1o2kEo") },
    },
    {
        id: "android",
        name: "Android",
        title: "Android",
        logo: "android",
        summary: "Install and play Retro Rewind on an Android phone or tablet.",
        steps: guideOnlySteps("Android"),
        guide: { kind: "video", label: "Android video guide", href: youtube("21afHo3ji14") },
    },
    {
        id: "ios",
        name: "iOS",
        title: "iPhone and iPad",
        logo: "apple",
        summary: "Install and play Retro Rewind on iOS, using a guide written by the community.",
        steps: guideOnlySteps("iOS", "written"),
        guide: {
            kind: "written",
            label: "iOS written guide",
            href: "https://gist.github.com/weirdrock/92bcb0dbd4a2c3d56844bf0a5fe18677",
        },
    },
];

/** Things that stop online play on every platform. From the "Important notes" on the downloads page. */
export const ONLINE_CHECKLIST: string[] = [
    "Use a copy of Mario Kart Wii that is not patched for Wiimmfi. Retro Rewind uses the Retro WFC servers instead.",
    "Turn off all cheat codes. Any active cheat stops you playing online.",
];

/**
 * Picks a sensible first tab from the visitor's device. It only changes which guide is open;
 * every guide stays one click away, so a wrong guess costs nothing.
 */
export function detectPlatform(userAgent: string): PlatformId {
    const ua = userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return "ios";
    if (ua.includes("android")) return "android";
    if (ua.includes("steamdeck") || ua.includes("valve steam")) return "steam-deck";
    if (ua.includes("mac os x") || ua.includes("macintosh")) return "macos";
    if (ua.includes("linux")) return "linux";
    if (ua.includes("windows")) return "pc";
    return "wii";
}
