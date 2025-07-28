import { A } from "@solidjs/router";
import { Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { api } from "../../services/api";

export default function HomePage() {
    // Get basic stats for the hero section
    const statsQuery = useQuery(() => ({
        queryKey: ["stats"],
        queryFn: () => api.getStats(),
        refetchInterval: 300000, // 5 minutes
    }));

    return (
        <div class="space-y-16">
            {/* Hero Section */}
            <section class="text-center py-16">
                <div class="max-w-4xl mx-auto">
                    <h1 class="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 transition-colors">
            Welcome to{" "}
                        <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Retro Rewind
                        </span>
                    </h1>
                    <p class="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto transition-colors">
            Experience every retro track from Super Mario Kart to Mario Kart 7,
            plus tracks from Mario Kart 8, Tour, and Arcade GP. Track your
            progress, compete for the fastest times, and connect with the
            community on Retro WFC servers.
                    </p>

                    {/* Quick Stats */}
                    <Show when={statsQuery.data}>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                                <div class="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                                    {statsQuery.data!.totalPlayers.toLocaleString()}
                                </div>
                                <div class="text-gray-600 dark:text-gray-300">
                  Registered Licenses
                                </div>
                            </div>
                            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                                <div class="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  8000+
                                </div>
                                <div class="text-gray-600 dark:text-gray-300">
                  Discord Members
                                </div>
                            </div>
                            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                                <div class="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  184
                                </div>
                                <div class="text-gray-600 dark:text-gray-300">
                  Retro Tracks Available
                                </div>
                            </div>
                        </div>
                    </Show>

                    <div class="flex flex-col sm:flex-row gap-4 justify-center">
                        <A
                            href="/vr"
                            class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                        >
              View VR Leaderboard
                        </A>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section class="py-16">
                <div class="text-center mb-12">
                    <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">
            Everything You Need for Mario Kart Wii
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors">
            Comprehensive tools and data to enhance your Mario Kart Wii
            experience with Retro Rewind
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* VR Leaderboard */}
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl dark:shadow-gray-900/20 p-6 transition-all">
                        <div class="text-4xl mb-4">🏆</div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              VR Leaderboard
                        </h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-4 transition-colors">
              Track worldwide rankings and see who's dominating the Retro WFC
              servers with up to 30,000 VR.
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
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl dark:shadow-gray-900/20 p-6 transition-all relative">
                        <div class="text-4xl mb-4">⏱️</div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              TT Leaderboard
                        </h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-4 transition-colors">
              Compare the fastest times across all 184 retro tracks and 80
              custom tracks.
                        </p>
                        <div class="text-gray-400 dark:text-gray-500 font-medium inline-flex items-center">
              Coming Soon
                            <div class="ml-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs px-2 py-1 rounded">
                In Development
                            </div>
                        </div>
                    </div>

                    {/* Room Browser */}
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl dark:shadow-gray-900/20 p-6 transition-all relative">
                        <div class="text-4xl mb-4">🎮</div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Room Browser
                        </h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-4 transition-colors">
              Find and join active rooms with various game modes including
              Knockout Mode, TTs Online, and Item Rain/Storm across all Retro
              WFC packs.
                        </p>
                        <div class="text-gray-400 dark:text-gray-500 font-medium inline-flex items-center">
              Coming Soon
                            <div class="ml-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs px-2 py-1 rounded">
                Planned
                            </div>
                        </div>
                    </div>

                    {/* Analytics */}
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl dark:shadow-gray-900/20 p-6 transition-all">
                        <div class="text-4xl mb-4">📥</div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Downloads
                        </h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-4 transition-colors">
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
            <section class="py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl transition-colors">
                <div class="max-w-4xl mx-auto text-center px-6">
                    <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6 transition-colors">
            About Retro Rewind
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                        <div>
                            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                What is Retro Rewind?
                            </h3>
                            <p class="text-gray-600 dark:text-gray-300 transition-colors">
                Retro Rewind is a custom track distribution created by ZPL that
                features every retro track from Super Mario Kart to Mario Kart
                7, plus tracks from Mario Kart 8, Tour, and Arcade GP. It uses
                the Pulsar engine and connects to Retro WFC servers for online
                play.
                            </p>
                        </div>
                        <div>
                            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Advanced Features
                            </h3>
                            <p class="text-gray-600 dark:text-gray-300 transition-colors">
                Experience 200cc and 500cc modes, brake drifting, ultra
                mini-turbos, draggable blue shells, and advanced features like
                Discord Rich Presence, input viewer, and customizable game modes
                including Knockout Mode and Item Rain.
                            </p>
                        </div>
                    </div>
                    <div class="mt-8">
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Powered by Retro WFC
                        </h3>
                        <p class="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors">
              Connect to dedicated Retro WFC servers provided by the WiiLink
              Team for stable online racing. No Wiimmfi patching required - just
              install and race with players worldwide.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section class="py-16 text-center">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                    <h2 class="text-3xl font-bold mb-4">Ready to Race?</h2>
                    <p class="text-xl mb-6 text-blue-100">
            Join thousands of players competing on Retro WFC servers with 184
            retro tracks
                    </p>
                    <A
                        href="/downloads"
                        class="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors mr-4"
                    >
            Download Now
                    </A>
                    <A
                        href="/vr"
                        class="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold py-3 px-8 rounded-lg transition-colors"
                    >
            View Leaderboard
                    </A>
                </div>
            </section>
        </div>
    );
}
