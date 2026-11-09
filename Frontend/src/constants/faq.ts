import { SITE_LINKS } from "./siteLinks";

export interface FaqItem {
    question: string;
    answer: string;
    link?: { label: string; href: string; newTab?: boolean };
    verify?: boolean;
}

/*
 * Answers are drawn from existing site copy (home, downloads, footer, privacy notice). Keep them
 * short and factual; link out for detail rather than growing an answer.
 */
export const FAQ_ITEMS: FaqItem[] = [
    {
        question: "What is Retro Rewind?",
        answer: "A custom track distribution for Mario Kart Wii by ZPL, built on the Pulsar engine. It has every retro track from Super Mario Kart to Mario Kart 7, plus tracks from Mario Kart 8, Tour, Arcade GP and Mario Kart World.",
    },
    {
        question: "Where do I play online?",
        answer: "On the Retro WFC servers. Do not use a game patched for Wiimmfi; Retro Rewind connects to Retro WFC instead.",
    },
    {
        question: "Can I use cheat codes?",
        answer: "Turn them off to play online. Any active cheat code stops online play. In Dolphin, turn off Enable Cheats.",
    },
    {
        question: "How do I update to a new version?",
        answer: "If you have the previous version, download the update package. Otherwise, use the full download.",
        link: { label: "Go to downloads", href: "/downloads" },
        verify: true,
    },
    {
        question: "Do I delete my old files when I install on a Wii?",
        answer: "No. Extract the package to the root of your SD card and replace existing files when asked. Do not delete any files.",
    },
    {
        question: "Does playing online collect data?",
        answer: "Yes. Playing online on Retro WFC involves data collection. The privacy policy explains what is collected and how it is used.",
        link: { label: "Read the privacy policy", href: "/privacy" },
    },
    {
        question: "Are there other track packs on Retro WFC?",
        answer: "Yes. Wack Track Pack, OptPack, Luminous Redux and CTGP Classic also run on the Retro WFC servers.",
        link: { label: "See other distributions", href: "/downloads" },
    },
    {
        question: "Where can I get help?",
        answer: "Ask in the Retro Rewind Discord. The wiki covers features, troubleshooting and version history.",
        link: { label: "Open the wiki", href: SITE_LINKS.wiki, newTab: true },
    },
    {
        question: "Is Retro Rewind affiliated with Nintendo?",
        answer: "No. This project is not affiliated with Nintendo.",
    },
];
