
import { createEffect, createSignal, For, Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { timeTrialApi } from "../../services/api/timeTrial";
import { GhostSubmission, Track } from "../../types/timeTrial";
import { getCharacterName, getControllerName, getDriftTypeName, getVehicleName } from "../../utils/marioKartMappings";
import { AlertBox, LoadingSpinner } from "../../components/common";

export default function TTLeaderboardPage() {
    const [selectedCategory, setSelectedCategory] = createSignal<"retro" | "custom">("retro");
    const [selectedCC, setSelectedCC] = createSignal<150 | 200>(150);
    const [selectedTrack, setSelectedTrack] = createSignal<Track | null>(null);
    const [searchQuery, setSearchQuery] = createSignal("");

    // Fetch all tracks
    const tracksQuery = useQuery(() => ({
        queryKey: ["tt-tracks"],
        queryFn: () => timeTrialApi.getAllTracks(),
        staleTime: 1000 * 60 * 60, // 1 hour
    }));

    // Filter tracks by category and search
    const filteredTracks = () => {
        const tracks = tracksQuery.data || [];
        const category = selectedCategory();
        const search = searchQuery().toLowerCase();

        return tracks
            .filter((track) => track.category === category)
            .filter((track) => 
                search === "" || track.name.toLowerCase().includes(search)
            )
            .sort((a, b) => a.name.localeCompare(b.name));
    };

    // Fetch leaderboard for selected track
    const leaderboardQuery = useQuery(() => ({
        queryKey: ["tt-leaderboard", selectedTrack()?.id, selectedCC()],
        queryFn: () => {
            const track = selectedTrack();
            if (!track) return null;
            return timeTrialApi.getTopTimes(track.id, selectedCC(), 10);
        },
        enabled: !!selectedTrack(),
    }));

    // Auto-select first track when category changes
    createEffect(() => {
        const tracks = filteredTracks();
        if (tracks.length > 0 && !selectedTrack()) {
            setSelectedTrack(tracks[0]);
        }
    });

    const handleTrackSelect = (track: Track) => {
        setSelectedTrack(track);
    };

    const handleDownloadGhost = async (submission: GhostSubmission) => {
        try {
            const blob = await timeTrialApi.downloadGhost(submission.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${submission.finishTimeDisplay.replace(":", "m").replace(".", "s")}.rkg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Failed to download ghost:", error);
        }
    };

    return (
        <div class="space-y-8">
            {/* Header */}
            <section class="py-12">
                <div class="max-w-4xl mx-auto text-center">
                    <h1 class="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Time Trial Leaderboards
                    </h1>
                    <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Top times for Retro Rewind's custom and retro tracks
                    </p>
                </div>
            </section>

            {/* Category & CC Selection */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <div class="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    {/* Category Toggle */}
                    <div class="flex-1">
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Track Category
                        </label>
                        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                            <button
                                onClick={() => {
                                    setSelectedCategory("retro");
                                    setSelectedTrack(null);
                                }}
                                class={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${
                                    selectedCategory() === "retro"
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                🏁 Retro Tracks
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedCategory("custom");
                                    setSelectedTrack(null);
                                }}
                                class={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${
                                    selectedCategory() === "custom"
                                        ? "bg-purple-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                ⭐ Custom Tracks
                            </button>
                        </div>
                    </div>

                    {/* CC Selection */}
                    <div class="flex-1">
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Engine Class
                        </label>
                        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                            <button
                                onClick={() => setSelectedCC(150)}
                                class={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${
                                    selectedCC() === 150
                                        ? "bg-green-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                150cc
                            </button>
                            <button
                                onClick={() => setSelectedCC(200)}
                                class={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${
                                    selectedCC() === 200
                                        ? "bg-red-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                200cc
                            </button>
                        </div>
                    </div>
                </div>

                {/* Track Search */}
                <div class="mt-4">
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Search Tracks
                    </label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by track name..."
                            value={searchQuery()}
                            onInput={(e) => setSearchQuery(e.target.value)}
                            class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Track List */}
                <div class="lg:col-span-1">
                    <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
                            <h2 class="text-lg font-bold text-white">
                                {selectedCategory() === "retro" ? "Retro Tracks" : "Custom Tracks"}
                            </h2>
                            <p class="text-sm text-blue-100">
                                {filteredTracks().length} track{filteredTracks().length !== 1 ? "s" : ""}
                            </p>
                        </div>

                        <Show when={tracksQuery.isLoading}>
                            <div class="p-8 text-center">
                                <LoadingSpinner />
                            </div>
                        </Show>

                        <Show when={tracksQuery.isError}>
                            <div class="p-4">
                                <AlertBox type="error" icon="⚠️">
                  Failed to load tracks
                                </AlertBox>
                            </div>
                        </Show>

                        <Show when={tracksQuery.data}>
                            <div class="max-h-[600px] overflow-y-auto">
                                <For each={filteredTracks()}>
                                    {(track) => (
                                        <button
                                            onClick={() => handleTrackSelect(track)}
                                            class={`w-full px-4 py-3 text-left transition-colors border-b border-gray-200 dark:border-gray-700 ${
                                                selectedTrack()?.id === track.id
                                                    ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600"
                                                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                            }`}
                                        >
                                            <div class="font-medium text-gray-900 dark:text-white">
                                                {track.name}
                                            </div>
                                            <div class="text-sm text-gray-500 dark:text-gray-400">
                                                {track.laps} lap{track.laps !== 1 ? "s" : ""}
                                            </div>
                                        </button>
                                    )}
                                </For>

                                <Show when={filteredTracks().length === 0}>
                                    <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                    No tracks found
                                    </div>
                                </Show>
                            </div>
                        </Show>
                    </div>
                </div>

                {/* Leaderboard */}
                <div class="lg:col-span-2">
                    <Show when={!selectedTrack()}>
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-12 text-center">
                            <div class="text-6xl mb-4">🏁</div>
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Select a Track
                            </h3>
                            <p class="text-gray-600 dark:text-gray-400">
                Choose a track from the list to view its leaderboard
                            </p>
                        </div>
                    </Show>

                    <Show when={selectedTrack()}>
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Header */}
                            <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                                <h2 class="text-2xl font-bold text-white mb-1">
                                    {selectedTrack()!.name}
                                </h2>
                                <div class="flex items-center gap-4 text-sm text-blue-100">
                                    <span>{selectedCC()}cc</span>
                                    <span>•</span>
                                    <span>{selectedTrack()!.laps} lap{selectedTrack()!.laps !== 1 ? "s" : ""}</span>
                                    <span>•</span>
                                    <span class="capitalize">{selectedCategory()} Track</span>
                                </div>
                            </div>

                            {/* Loading State */}
                            <Show when={leaderboardQuery.isLoading}>
                                <div class="p-12 text-center">
                                    <LoadingSpinner />
                                    <p class="mt-4 text-gray-600 dark:text-gray-400">
                    Loading times...
                                    </p>
                                </div>
                            </Show>

                            {/* Error State */}
                            <Show when={leaderboardQuery.isError}>
                                <div class="p-6">
                                    <AlertBox type="error" icon="⚠️">
                    Failed to load leaderboard
                                    </AlertBox>
                                </div>
                            </Show>

                            {/* Leaderboard Table */}
                            <Show when={leaderboardQuery.data && !leaderboardQuery.isLoading}>
                                <Show
                                    when={leaderboardQuery.data!.length > 0}
                                    fallback={
                                        <div class="p-12 text-center">
                                            <div class="text-6xl mb-4">🏆</div>
                                            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        No Times Yet
                                            </h3>
                                            <p class="text-gray-600 dark:text-gray-400">
                        Be the first to submit a time for this track!
                                            </p>
                                        </div>
                                    }
                                >
                                    <div class="overflow-x-auto">
                                        <table class="w-full">
                                            <thead class="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Rank
                                                    </th>
                                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Player
                                                    </th>
                                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Time
                                                    </th>
                                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Setup
                                                    </th>
                                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Date
                                                    </th>
                                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Ghost
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                                <For each={leaderboardQuery.data!}>
                                                    {(submission, index) => (
                                                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                            {/* Rank */}
                                                            <td class="px-6 py-4 whitespace-nowrap">
                                                                <div class="flex items-center">
                                                                    <Show when={index() === 0}>
                                                                        <span class="text-2xl mr-2">🥇</span>
                                                                    </Show>
                                                                    <Show when={index() === 1}>
                                                                        <span class="text-2xl mr-2">🥈</span>
                                                                    </Show>
                                                                    <Show when={index() === 2}>
                                                                        <span class="text-2xl mr-2">🥉</span>
                                                                    </Show>
                                                                    <span class="text-lg font-bold text-gray-900 dark:text-white">
                                                                        {index() + 1}
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            {/* Player */}
                                                            <td class="px-6 py-4">
                                                                <div class="font-medium text-gray-900 dark:text-white">
                                                                    {submission.playerName}
                                                                </div>
                                                                <div class="text-sm text-gray-500 dark:text-gray-400">
                                                                    {submission.miiName}
                                                                </div>
                                                            </td>

                                                            {/* Time */}
                                                            <td class="px-6 py-4 whitespace-nowrap">
                                                                <div class="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                                    {submission.finishTimeDisplay}
                                                                </div>
                                                                <Show when={submission.shroomless}>
                                                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                    Shroomless
                                                                    </span>
                                                                </Show>
                                                                <Show when={submission.glitch}>
                                                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 ml-1">
                                    Glitch
                                                                    </span>
                                                                </Show>
                                                            </td>

                                                            {/* Setup */}
                                                            <td class="px-6 py-4">
                                                                <div class="text-sm text-gray-900 dark:text-white">
                                                                    {getCharacterName(submission.characterId)}
                                                                </div>
                                                                <div class="text-sm text-gray-500 dark:text-gray-400">
                                                                    {getVehicleName(submission.vehicleId)}
                                                                </div>
                                                                <div class="text-xs text-gray-500 dark:text-gray-400">
                                                                    {getControllerName(submission.controllerType)} • {getDriftTypeName(submission.driftType)}
                                                                </div>
                                                            </td>

                                                            {/* Date */}
                                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                {new Date(submission.dateSet).toLocaleDateString()}
                                                            </td>

                                                            {/* Download */}
                                                            <td class="px-6 py-4 whitespace-nowrap text-right">
                                                                <button
                                                                    onClick={() => handleDownloadGhost(submission)}
                                                                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                                                >
                                                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                    </svg>
                                  Download
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </For>
                                            </tbody>
                                        </table>
                                    </div>
                                </Show>
                            </Show>
                        </div>
                    </Show>
                </div>
            </div>
        </div>
    );
}