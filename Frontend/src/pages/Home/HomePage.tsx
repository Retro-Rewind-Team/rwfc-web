import { createMemo, Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import {
    ChevronRight,
    Download,
    Gamepad2,
    Globe,
    MonitorPlay,
    Timer,
    Trophy,
    Zap,
} from "lucide-solid";
import { leaderboardApi } from "../../services/api/leaderboard";
import { timeTrialApi } from "../../services/api/timeTrial";
import { StatCard } from "../../components/common";
import { A } from "@solidjs/router";

const featureCards = [
    {
        icon: () => <Trophy size={32} />,
        iconColor: "text-blue-500 dark:text-blue-400",
        title: "VR Leaderboard",
        description:
      "Track rankings and see who's dominating the Retro WFC servers with up to 1,000,000 VR.",
        href: "/vr",
        label: "View Rankings",
    },
    {
        icon: () => <Timer size={32} />,
        iconColor: "text-green-500 dark:text-green-400",
        title: "TT Leaderboard",
        description:
      "Compare the fastest times across all 208 retro tracks and 88 custom tracks.",
        href: "/tt",
        label: "View Times",
    },
    {
        icon: () => <MonitorPlay size={32} />,
        iconColor: "text-purple-500 dark:text-purple-400",
        title: "Room Browser",
        description:
      "Find and join active rooms with various game modes including 200cc, TTs Online, and Item Rain/Storm across all Retro WFC packs.",
        href: "/rooms",
        label: "Browse Rooms",
    },
    {
        icon: () => <Download size={32} />,
        iconColor: "text-orange-500 dark:text-orange-400",
        title: "Downloads",
        description:
      "Access the latest Retro Rewind releases, tools, and resources to get started on Retro WFC.",
        href: "/downloads",
        label: "View Downloads",
    },
];

const aboutCards = [
    {
        icon: () => <Gamepad2 size={32} />,
        iconColor: "text-blue-500 dark:text-blue-400",
        title: "What is Retro Rewind?",
        body: "A custom track distribution by ZPL featuring every retro track from Super Mario Kart to Mario Kart 7, plus tracks from Mario Kart 8, Tour, Arcade GP and Mario Kart World. Built on the Pulsar engine and connected to Retro WFC servers.",
    },
    {
        icon: () => <Zap size={32} />,
        iconColor: "text-yellow-500 dark:text-yellow-400",
        title: "Advanced Features",
        body: "Experience 200cc and 500cc modes, brake drifting, ultra mini-turbos, draggable blue shells, and custom modes like Knockout Mode and Item Rain.",
    },
];

export default function HomePage() {
    const statsQuery = useQuery(() => ({
        queryKey: ["stats"],
        queryFn: () => leaderboardApi.getStats(),
        refetchInterval: 300000,
    }));

    const discordQuery = useQuery(() => ({
        queryKey: ["discord-members"],
        queryFn: () => leaderboardApi.getDiscordMemberCount(),
        refetchInterval: 300000,
    }));

    const tracksQuery = useQuery(() => ({
        queryKey: ["tt-tracks"],
        queryFn: () => timeTrialApi.getAllTracks(),
        staleTime: 1000 * 60 * 60,
    }));

    const totalTrackCount = createMemo(() => tracksQuery.data?.length ?? null);

    return (
        <div class="space-y-12">
            {/* Hero Section */}
            <section class="py-12">
                <div class="max-w-4xl mx-auto text-center">
                    <div class="mb-8">
                        <h1 class="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to Retro Rewind
                        </h1>
                        <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Experience every retro track from Super Mario Kart to Mario Kart
              7, plus tracks from Mario Kart 8, Tour, Arcade GP and Mario Kart
              World. Track your progress, compete for the fastest times, and
              connect with the community on Retro WFC servers.
                        </p>
                    </div>

                    <Show when={statsQuery.data}>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <StatCard
                                value={statsQuery.data!.totalPlayers.toLocaleString()}
                                label="Registered Licenses"
                                colorScheme="emerald"
                            />
                            <StatCard
                                value={discordQuery.data?.toLocaleString() ?? "8000+"}
                                label="Discord Members"
                                colorScheme="blue"
                            />
                            <StatCard
                                value={totalTrackCount()?.toLocaleString() ?? "..."}
                                label="Tracks Available"
                                colorScheme="purple"
                            />
                        </div>
                    </Show>
                </div>
            </section>

            {/* Features Section */}
            <section class="py-8">
                <div class="text-center mb-8">
                    <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Explore Features & Tools
                    </h2>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {featureCards.map((card) => (
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 p-6 transition-colors flex flex-col">
                            <div class={`${card.iconColor} mb-4`}>{card.icon()}</div>
                            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                {card.title}
                            </h3>
                            <p class="text-gray-600 dark:text-gray-400 mb-4 flex-1 text-sm">
                                {card.description}
                            </p>
                            <A
                                href={card.href}
                                class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors text-sm"
                            >
                                {card.label}
                                <ChevronRight size={16} />
                            </A>
                        </div>
                    ))}
                </div>
            </section>

            {/* About Section */}
            <section class="py-8">
                <div class="max-w-5xl mx-auto">
                    <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            About Retro Rewind
                    </h2>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {aboutCards.map((card) => (
                            <div class="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6">
                                <div class="flex items-start space-x-4">
                                    <div class={`${card.iconColor} flex-shrink-0`}>
                                        {card.icon()}
                                    </div>
                                    <div>
                                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                            {card.title}
                                        </h3>
                                        <p class="text-gray-700 dark:text-gray-300">{card.body}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div class="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <div class="flex items-start space-x-4">
                            <div class="text-green-500 dark:text-green-400 flex-shrink-0">
                                <Globe size={32} />
                            </div>
                            <div class="flex-1">
                                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Powered by Retro WFC
                                </h3>
                                <p class="text-gray-700 dark:text-gray-300">
                  Connect to dedicated Retro WFC servers for stable online
                  racing with players worldwide. No patching required, just
                  install and race.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
