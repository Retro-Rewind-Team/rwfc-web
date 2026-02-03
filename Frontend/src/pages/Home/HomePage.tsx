import { Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { leaderboardApi } from "../../services/api/leaderboard";
import { StatCard } from "../../components/common";
import { A } from "@solidjs/router";

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
                            Experience every retro track from Super Mario Kart to Mario Kart 7,
                            plus tracks from Mario Kart 8, Tour, Arcade GP and Mario Kart World. Track your
                            progress, compete for the fastest times, and connect with the
                            community on Retro WFC servers.
                        </p>
                    </div>

                    {/* Quick Stats */}
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
                                value="208"
                                label="Retro Tracks Available"
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
                    {/* VR Leaderboard */}
                    <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 p-6 transition-all">
                        <div class="text-4xl mb-4">🏆</div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                            VR Leaderboard
                        </h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-4">
                            Track rankings and see who's dominating the Retro WFC servers with
                            up to 1,000,000 VR.
                        </p>
                        <A
                            href="/vr"
                            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-flex items-center transition-colors"
                        >
                            View Rankings
                            <svg
                                class="w-4 h-4 ml-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </A>
                    </div>

                    {/* Time Trial Leaderboard */}
                    <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 p-6 transition-all">
                        <div class="text-4xl mb-4">⏱️</div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                            TT Leaderboard
                        </h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-4">
                            Compare the fastest times across all 208 retro tracks and 88
                            custom tracks.
                        </p>
                        <A
                            href="/tt"
                            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-flex items-center transition-colors"
                        >
                            View Times
                            <svg
                                class="w-4 h-4 ml-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </A>
                    </div>

                    {/* Room Browser */}
                    <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6 relative">
                        <div class="text-4xl mb-4">🎮</div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                            Room Browser
                        </h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-4">
                            Find and join active rooms with various game modes including
                            200cc, TTs Online, and Item Rain/Storm across all Retro
                            WFC packs.
                        </p>
                        <A
                            href="/rooms"
                            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-flex items-center transition-colors"
                        >
                            Browse Rooms
                            <svg
                                class="w-4 h-4 ml-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </A>
                    </div>

                    {/* Downloads */}
                    <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 p-6 transition-all">
                        <div class="text-4xl mb-4">📥</div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                            Downloads
                        </h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-4">
                            Access the latest Retro Rewind releases, tools, and resources to
                            get started on Retro WFC.
                        </p>
                        <A
                            href="/downloads"
                            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-flex items-center transition-colors"
                        >
                            View Downloads
                            <svg
                                class="w-4 h-4 ml-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </A>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section class="py-8">
                <div class="max-w-5xl mx-auto">
                    <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                        About Retro Rewind
                    </h2>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div class="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6">
                            <div class="flex items-start space-x-4">
                                <div class="text-4xl flex-shrink-0">🎮</div>
                                <div>
                                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                        What is Retro Rewind?
                                    </h3>
                                    <p class="text-gray-700 dark:text-gray-300">
                                        A custom track distribution by ZPL featuring every retro
                                        track from Super Mario Kart to Mario Kart 7, plus tracks
                                        from Mario Kart 8, Tour, Arcade GP and Mario Kart World. Built on the Pulsar
                                        engine and connected to Retro WFC servers.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6">
                            <div class="flex items-start space-x-4">
                                <div class="text-4xl flex-shrink-0">⚡</div>
                                <div>
                                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                        Advanced Features
                                    </h3>
                                    <p class="text-gray-700 dark:text-gray-300">
                                        Experience 200cc and 500cc modes, brake drifting, ultra
                                        mini-turbos, draggable blue shells, and custom modes like
                                        Knockout Mode and Item Rain.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <div class="flex items-start space-x-4">
                            <div class="text-4xl flex-shrink-0">🌐</div>
                            <div class="flex-1">
                                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    Powered by Retro WFC
                                </h3>
                                <p class="text-gray-700 dark:text-gray-300">
                                    Connect to dedicated Retro WFC servers for stable online
                                    racing with players worldwide. No patching required,
                                    just install and race.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}