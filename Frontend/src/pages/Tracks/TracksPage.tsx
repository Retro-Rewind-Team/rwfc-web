import { createSignal, For, Show } from "solid-js";
import { consoleDisplayNames, tracksData } from "../../utils/trackData";
import { TrackCard } from "../../components/ui";
import type { Track, TrackCategory } from "../../types/track";

export default function TracksPage() {
    const [activeTab, setActiveTab] = createSignal<TrackCategory>("retro");
    const [searchQuery, setSearchQuery] = createSignal("");

    const tabs: { id: TrackCategory; label: string; count: number }[] = [
        {
            id: "retro",
            label: "Retro Tracks",
            count: Object.values(tracksData.retro).flat().length,
        },
        { id: "custom", label: "Custom Tracks", count: tracksData.custom.length },
        { id: "battle", label: "Battle Arenas", count: tracksData.battle.length },
    ];

    const filterTracks = (tracks: Track[]) => {
        const query = searchQuery().toLowerCase();
        if (!query) return tracks;

        return tracks.filter(
            (track) =>
                track.name.toLowerCase().includes(query) ||
                track.authors.toLowerCase().includes(query)
        );
    };

    const filteredRetroConsoles = (): [string, Track[]][] => {
        const query = searchQuery().toLowerCase();
        if (!query) return Object.entries(tracksData.retro);

        return Object.entries(tracksData.retro)
            .map(([console, tracks]) => [console, filterTracks(tracks)] as [string, Track[]])
            .filter(([_, tracks]) => tracks.length > 0);
    };

    const totalFilteredCount = () => {
        if (activeTab() === "retro") {
            return filteredRetroConsoles().reduce(
                (sum, [_, tracks]) => sum + tracks.length,
                0
            );
        } else if (activeTab() === "custom") {
            return filterTracks(tracksData.custom).length;
        } else {
            return filterTracks(tracksData.battle).length;
        }
    };

    return (
        <div class="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div class="text-center">
                <div class="py-8">
                    <h1 class="text-5xl font-bold text-gray-900 dark:text-white mb-3">
                        Track List
                    </h1>
                    <p class="text-lg text-gray-600 dark:text-gray-400">
                        Browse all 326 tracks in Retro Rewind v6.5.5
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div class="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden sticky top-0 z-10 shadow-md">
                <div class="flex border-b border-gray-200 dark:border-gray-700">
                    <For each={tabs}>
                        {(tab) => (
                            <button
                                onClick={() => setActiveTab(tab.id)}
                                class={`flex-1 px-6 py-4 font-semibold transition-colors ${
                                    activeTab() === tab.id
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                }`}
                            >
                                {tab.label}
                                <span
                                    class={`ml-2 px-2 py-1 rounded-full text-sm ${
                                        activeTab() === tab.id
                                            ? "bg-blue-700"
                                            : "bg-gray-200 dark:bg-gray-700"
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        )}
                    </For>
                </div>

                {/* Search Bar */}
                <div class="p-4 bg-gray-50 dark:bg-gray-900">
                    <div class="relative">
                        <svg
                            class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by track name or author..."
                            value={searchQuery()}
                            onInput={(e) => setSearchQuery(e.currentTarget.value)}
                            class="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <Show when={activeTab() === "retro"}>
                <div class="space-y-12">
                    <For each={filteredRetroConsoles()}>
                        {([console, tracks]) => (
                            <section>
                                {/* Console Header */}
                                <div class="flex items-center gap-4 mb-6">
                                    <div class="flex-1 h-0.5 bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-700"></div>
                                    <h2 class="text-3xl font-bold text-gray-900 dark:text-white px-4">
                                        {consoleDisplayNames[console] || console}
                                    </h2>
                                    <div class="flex-1 h-0.5 bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-700"></div>
                                </div>

                                {/* Track Grid */}
                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <For each={tracks}>
                                        {(track) => <TrackCard track={track} />}
                                    </For>
                                </div>
                            </section>
                        )}
                    </For>
                </div>
            </Show>

            <Show when={activeTab() === "custom"}>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <For each={filterTracks(tracksData.custom)}>
                        {(track) => <TrackCard track={track} />}
                    </For>
                </div>
            </Show>

            <Show when={activeTab() === "battle"}>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <For each={filterTracks(tracksData.battle)}>
                        {(track) => <TrackCard track={track} />}
                    </For>
                </div>
            </Show>

            {/* No Results */}
            <Show when={totalFilteredCount() === 0}>
                <div class="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-12 text-center">
                    <div class="text-5xl mb-4">🔍</div>
                    <p class="text-gray-600 dark:text-gray-400 text-lg">
                        No tracks found matching "{searchQuery()}"
                    </p>
                </div>
            </Show>

            {/* Results Count */}
            <Show when={totalFilteredCount() > 0 && searchQuery()}>
                <div class="text-center text-gray-600 dark:text-gray-400">
                    Showing {totalFilteredCount()} results
                </div>
            </Show>
        </div>
    );
}