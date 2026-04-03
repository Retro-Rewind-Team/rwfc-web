import { createMemo, Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { leaderboardApi } from "../../services/api/leaderboard";
import { timeTrialApi } from "../../services/api/timeTrial";
import { queryKeys } from "../../constants/queryKeys";
import { AlertBox } from "../../components/common";
import { TutorialCard } from "../../components/ui/";
import {
    BookOpen,
    ChevronRight,
    ExternalLink,
    List,
    Wrench,
} from "lucide-solid/icons/index";

const resourceCards = [
    {
        icon: () => <List size={28} />,
        iconColor: "text-blue-500 dark:text-blue-400",
        title: "Track List",
        description: (retro: number | null, custom: number | null) =>
            `View all ${retro ?? "..."} retro tracks, 40 Battle Arenas and ${custom ?? "..."} custom tracks included in v6.6.1`,
        href: "/home",
        label: "Browse Tracks",
        external: false,
    },
    {
        icon: () => <Wrench size={28} />,
        iconColor: "text-orange-500 dark:text-orange-400",
        title: "Community Tools",
        description: () =>
            "Rank calculator, save file editor, font patcher, and more community-made tools",
        href: "/tools",
        label: "Browse Tools",
        external: false,
    },
    {
        icon: () => <BookOpen size={28} />,
        iconColor: "text-purple-500 dark:text-purple-400",
        title: "Full Documentation",
        description: () =>
            "Complete wiki with features, troubleshooting, and version history",
        href: "https://wiki.tockdom.com/wiki/Retro_Rewind",
        label: "View Wiki",
        external: true,
    },
];

export default function DownloadsPage() {
    const tracksQuery = useQuery(() => ({
        queryKey: queryKeys.ttTracks,
        queryFn: () => timeTrialApi.getAllTracks(),
        staleTime: 1000 * 60 * 60,
    }));

    const versionQuery = useQuery(() => ({
        queryKey: queryKeys.rrVersion,
        queryFn: leaderboardApi.getRRVersion,
        staleTime: 1000 * 60 * 60,
    }));

    const retroTrackCount = createMemo(
        () =>
            tracksQuery.data?.filter((t) => t.category === "retro").length ?? null,
    );
    const customTrackCount = createMemo(
        () =>
            tracksQuery.data?.filter((t) => t.category === "custom").length ?? null,
    );

    const v = () => versionQuery.data ?? null;

    const tutorials = [
        {
            title: "(v)Wii Setup Guide",
            description: "Complete setup walkthrough for Wii and vWii consoles",
            thumbnailUrl: "https://img.youtube.com/vi/qH4ou21r8ic/maxresdefault.jpg",
            videoUrl: "https://youtu.be/qH4ou21r8ic?si=m7OMOFRn95-ZtVzo",
        },
        {
            title: "Dolphin Emulator Guide",
            description:
        "Step-by-step video guide for installing Retro Rewind on Dolphin",
            thumbnailUrl: "https://img.youtube.com/vi/BfuSe-_GpKk/maxresdefault.jpg",
            videoUrl: "https://www.youtube.com/watch?v=BfuSe-_GpKk",
        },
        {
            title: "Linux Setup Guide",
            description: "Learn how to install and play Retro Rewind on Linux",
            thumbnailUrl: "https://img.youtube.com/vi/pNneOrThK_c/maxresdefault.jpg",
            videoUrl: "https://www.youtube.com/watch?v=pNneOrThK_c",
        },
        {
            title: "macOS Setup Guide",
            description: "Step-by-step guide for installing Retro Rewind on macOS",
            thumbnailUrl: "https://img.youtube.com/vi/iuczt1o2kEo/maxresdefault.jpg",
            videoUrl: "https://youtu.be/iuczt1o2kEo?si=pEEvZNiYbxF8tWp0",
        },
        {
            title: "Android Setup Guide",
            description:
        "Learn how to install and play Retro Rewind on Android devices",
            thumbnailUrl: "https://img.youtube.com/vi/21afHo3ji14/maxresdefault.jpg",
            videoUrl: "https://www.youtube.com/watch?v=21afHo3ji14",
        },
        {
            title: "ISO Builder Tutorial",
            description:
        "Guide for creating custom Retro Rewind ISOs using ISO Builder",
            thumbnailUrl: "https://img.youtube.com/vi/z5PW9iPkZfQ/maxresdefault.jpg",
            videoUrl: "https://www.youtube.com/watch?v=z5PW9iPkZfQ",
        },
        {
            title: "Steam Deck Setup Guide",
            description: "Complete guide for installing Retro Rewind on Steam Deck",
            thumbnailUrl: "https://img.youtube.com/vi/uws4aV8y1gk/maxresdefault.jpg",
            videoUrl: "https://www.youtube.com/watch?v=uws4aV8y1gk",
        },
        {
            title: "iOS Setup Guide",
            description:
        "Step-by-step written guide for installing Retro Rewind on iOS devices",
            thumbnailUrl: "https://img.youtube.com/vi/iuczt1o2kEo/maxresdefault.jpg",
            videoUrl:
        "https://gist.github.com/weirdrock/92bcb0dbd4a2c3d56844bf0a5fe18677",
        },
    ];

    return (
        <div class="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div class="text-center py-4">
                <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Downloads & Tutorials
                </h1>
                <p class="text-lg text-gray-600 dark:text-gray-400">
          Get everything you need to start racing on Retro Rewind
                </p>
            </div>

            {/* Main Download */}
            <AlertBox type="info" title={`Retro Rewind v${v()?.version ?? "..."}`}>
                <p class="text-lg mb-4">
          Complete distribution with {retroTrackCount() ?? "..."} retro tracks
          and {customTrackCount() ?? "..."} custom tracks
                </p>
                <div class="flex flex-col sm:flex-row gap-3">
                    <a
                        href="https://rwfc.net/updates/RetroRewind/zip/RetroRewind.zip"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
                    >
            Full Download (First Install)
                    </a>
                    <Show
                        when={v()}
                        fallback={
                            <span class="bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-center opacity-50">
                Update Only (loading...)
                            </span>
                        }
                    >
                        <a
                            href={v()!.updateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
                        >
              Update Only
                            {v()!.previousVersion
                                ? ` (v${v()!.previousVersion} → v${v()!.version})`
                                : ""}
                        </a>
                    </Show>
                    <a
                        href="https://github.com/TeamWheelWizard/WheelWizard/releases"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
                    >
            WheelWizard (PC Launcher)
                    </a>
                </div>
            </AlertBox>

            {/* Important Notes */}
            <AlertBox type="warning" title="Important Notes">
                <div class="space-y-2 text-sm">
                    <p>
                        <strong>Do NOT use Wiimmfi-patched games</strong> - Retro Rewind
            uses Retro WFC servers
                    </p>
                    <p>
                        <strong>Disable all cheat codes</strong> - Any active cheats will
            prevent online play
                    </p>
                    <p>
                        <strong>Console users:</strong> Extract to SD card root and replace
            existing files, don't delete any files!
                    </p>
                    <p>
                        <strong>Dolphin users:</strong> Use Wheel Wizard for easiest setup,
            disable "Enable Cheats"
                    </p>
                </div>
            </AlertBox>

            {/* Video Tutorials */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Video Tutorials
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tutorials.map((tutorial) => (
                        <TutorialCard
                            title={tutorial.title}
                            description={tutorial.description}
                            thumbnailUrl={tutorial.thumbnailUrl}
                            videoUrl={tutorial.videoUrl}
                        />
                    ))}
                </div>
            </div>

            {/* Additional Resources */}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                {resourceCards.map((card) => (
                    <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 p-6 transition-colors">
                        <div class={`${card.iconColor} mb-3`}>{card.icon()}</div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                            {card.title}
                        </h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                            {card.description(retroTrackCount(), customTrackCount())}
                        </p>
                        <a
                            href={card.href}
                            target={card.external ? "_blank" : undefined}
                            rel={card.external ? "noopener noreferrer" : undefined}
                            class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm transition-colors"
                        >
                            {card.label}
                            {card.external ? (
                                <ExternalLink size={14} />
                            ) : (
                                <ChevronRight size={14} />
                            )}
                        </a>
                    </div>
                ))}
            </div>

            {/* Help Section */}
            <AlertBox type="info" title="Need Help?">
                <p class="mb-3 text-sm">
          Having trouble with installation or experiencing issues? The Retro
          Rewind community is very active and helpful! Join our Discord server
          for real-time support, or check the comprehensive wiki for detailed
          documentation.
                </p>
                <div class="flex flex-col sm:flex-row gap-3">
                    <a
                        href="https://discord.gg/retrorewind"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors inline-flex items-center gap-2"
                    >
                        {/* Discord SVG - brand icon, intentionally kept */}
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                        </svg>
            Join Discord
                    </a>
                    <a
                        href="https://wiki.tockdom.com/wiki/Retro_Rewind"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 font-medium py-2 px-4 rounded-md border border-blue-300 dark:border-blue-600 transition-colors"
                    >
            View Wiki
                    </a>
                </div>
            </AlertBox>

            {/* Other RWFC Distributions */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Other RWFC Distributions
                </h2>
                <p class="text-gray-600 dark:text-gray-400 mb-6 text-sm">
          These custom track distributions also use Retro WFC servers, make sure
          to check them out!
                </p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            name: "Wack Track Pack",
                            videoId: "SaqpXDXpydE",
                            discord: "https://discord.com/invite/XB6YmGhyNA",
                            thumb: "maxresdefault",
                        },
                        {
                            name: "OptPack",
                            videoId: "FYk-CdbDrok",
                            discord: "https://discord.gg/37p93TtZHZ",
                            thumb: "hqdefault",
                            thumbDomain: "i.ytimg.com",
                        },
                        {
                            name: "Luminous",
                            videoId: "lJXAeXQb0Bc",
                            discord: "https://discord.gg/ZCuny29DQk",
                            thumb: "maxresdefault",
                        },
                    ].map((pack) => (
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                            <a
                                href={`https://www.youtube.com/watch?v=${pack.videoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img
                                    src={
                                        pack.thumbDomain
                                            ? `https://${pack.thumbDomain}/vi/${pack.videoId}/${pack.thumb}.jpg`
                                            : `https://img.youtube.com/vi/${pack.videoId}/${pack.thumb}.jpg`
                                    }
                                    alt={pack.name}
                                    class="w-full aspect-video object-cover"
                                />
                            </a>
                            <div class="p-4">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {pack.name}
                                </h3>
                                <a
                                    href={pack.discord}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm transition-colors"
                                >
                  Join Discord
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
