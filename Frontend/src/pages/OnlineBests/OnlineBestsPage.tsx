import { A } from "@solidjs/router";
import { createMemo, createSignal, For, Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { Clock, Trophy } from "lucide-solid";
import { queryKeys } from "../../constants/queryKeys";
import { raceStatsApi, timeTrialApi } from "../../services/api";
import { LoadingSpinner } from "../../components/common";

const CC_OPTIONS: { label: string; value: number }[] = [
    { label: "150cc", value: 2 },
    { label: "200cc", value: 1 },
];

const PAGE_SIZE = 25;

export default function OnlineBestsPage() {
    const [selectedCourseId, setSelectedCourseId] = createSignal<number | null>(null);
    const [engineClassId, setEngineClassId] = createSignal<number>(2); // default 150cc
    const [page, setPage] = createSignal(1);
    const [trackSearch, setTrackSearch] = createSignal("");

    const tracksQuery = useQuery(() => ({
        queryKey: queryKeys.ttTracks,
        queryFn: () => timeTrialApi.getAllTracks(),
        staleTime: Infinity,
    }));

    const bestsQuery = useQuery(() => ({
        queryKey: queryKeys.trackOnlineBests(selectedCourseId() ?? 0, engineClassId(), page()),
        queryFn: () =>
            raceStatsApi.getTrackOnlineBests(selectedCourseId()!, engineClassId(), page(), PAGE_SIZE),
        enabled: selectedCourseId() !== null,
        staleTime: 2 * 60 * 1000,
    }));

    const filteredTracks = createMemo(() => {
        const tracks = (tracksQuery.data ?? []).filter((t) => !t.isHidden);
        const search = trackSearch().toLowerCase();
        return search ? tracks.filter((t) => t.name.toLowerCase().includes(search)) : tracks;
    });

    const retroTracks = createMemo(() => filteredTracks().filter((t) => t.category === "retro"));
    const customTracks = createMemo(() => filteredTracks().filter((t) => t.category === "custom"));

    const handleTrackSelect = (courseId: number) => {
        setSelectedCourseId(courseId);
        setPage(1);
    };

    const handleCcChange = (value: number) => {
        setEngineClassId(value);
        setPage(1);
    };

    return (
        <div class="space-y-6">
            {/* Header */}
            <div class="pb-6 border-b border-gray-200 dark:border-gray-700">
                <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    Online Best Times
                </h1>
                <p class="text-lg text-gray-600 dark:text-gray-400">
                    Fastest times achieved in actual online races
                </p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Track selector */}
                <div class="lg:col-span-1">
                    <div class="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-4">
                        <input
                            type="text"
                            placeholder="Search tracks..."
                            value={trackSearch()}
                            onInput={(e) => setTrackSearch(e.currentTarget.value)}
                            class="w-full text-sm px-3 py-2 mb-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                        />
                        <Show when={tracksQuery.isLoading}>
                            <div class="flex justify-center py-4">
                                <LoadingSpinner />
                            </div>
                        </Show>
                        <Show when={tracksQuery.data}>
                            <div class="space-y-4 max-h-[60vh] overflow-y-auto overscroll-contain">
                                <Show when={retroTracks().length > 0}>
                                    <div>
                                        <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 px-2">
                                            Retro
                                        </p>
                                        <For each={retroTracks()}>
                                            {(track) => (
                                                <button
                                                    type="button"
                                                    onClick={() => handleTrackSelect(track.courseId)}
                                                    class={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                                                        selectedCourseId() === track.courseId
                                                            ? "bg-blue-600 text-white"
                                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    }`}
                                                >
                                                    {track.name}
                                                </button>
                                            )}
                                        </For>
                                    </div>
                                </Show>
                                <Show when={customTracks().length > 0}>
                                    <div>
                                        <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 px-2">
                                            Custom
                                        </p>
                                        <For each={customTracks()}>
                                            {(track) => (
                                                <button
                                                    type="button"
                                                    onClick={() => handleTrackSelect(track.courseId)}
                                                    class={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                                                        selectedCourseId() === track.courseId
                                                            ? "bg-blue-600 text-white"
                                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    }`}
                                                >
                                                    {track.name}
                                                </button>
                                            )}
                                        </For>
                                    </div>
                                </Show>
                            </div>
                        </Show>
                    </div>
                </div>

                {/* Results panel */}
                <div class="lg:col-span-3">
                    <div class="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                        <Show when={selectedCourseId() === null}>
                            <div class="flex flex-col items-center justify-center py-24 gap-3 text-gray-400 dark:text-gray-500">
                                <Clock size={48} />
                                <p class="text-lg font-medium">Select a track to see online best times</p>
                            </div>
                        </Show>

                        <Show when={selectedCourseId() !== null}>
                            {/* CC toggle + average */}
                            <div class="flex items-center justify-between flex-wrap gap-3 mb-6">
                                <div class="flex gap-1">
                                    <For each={CC_OPTIONS}>
                                        {(opt) => (
                                            <button
                                                type="button"
                                                onClick={() => handleCcChange(opt.value)}
                                                class={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                    engineClassId() === opt.value
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        )}
                                    </For>
                                </div>
                                <Show when={bestsQuery.data?.averageTimeDisplay}>
                                    <span class="text-sm text-gray-500 dark:text-gray-400">
                                        Avg personal best:{" "}
                                        <span class="font-mono font-semibold text-gray-700 dark:text-gray-200">
                                            {bestsQuery.data!.averageTimeDisplay}
                                        </span>
                                    </span>
                                </Show>
                            </div>

                            {/* Loading */}
                            <Show when={bestsQuery.isLoading}>
                                <div class="flex items-center justify-center py-16 gap-4">
                                    <LoadingSpinner />
                                    <p class="text-gray-600 dark:text-gray-300">Loading times...</p>
                                </div>
                            </Show>

                            {/* Empty */}
                            <Show
                                when={
                                    !bestsQuery.isLoading &&
                                    bestsQuery.data &&
                                    bestsQuery.data.items.length === 0
                                }
                            >
                                <div class="flex flex-col items-center justify-center py-16 gap-3 text-gray-400 dark:text-gray-500">
                                    <Trophy size={40} />
                                    <p>No online times recorded for this track yet</p>
                                </div>
                            </Show>

                            {/* Table */}
                            <Show
                                when={
                                    !bestsQuery.isLoading &&
                                    bestsQuery.data &&
                                    bestsQuery.data.items.length > 0
                                }
                            >
                                <div class="overflow-x-auto">
                                    <table class="w-full text-sm">
                                        <thead>
                                            <tr class="text-left text-xs text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">
                                                <th class="pb-2 font-medium w-10">#</th>
                                                <th class="pb-2 font-medium">Player</th>
                                                <th class="pb-2 font-medium">Time</th>
                                                <th class="pb-2 font-medium hidden sm:table-cell">Mode</th>
                                                <th class="pb-2 font-medium text-right">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                                            <For each={bestsQuery.data!.items}>
                                                {(entry) => (
                                                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td class="py-2 pr-3 font-mono text-xs text-gray-400 dark:text-gray-500">
                                                            {entry.rank}
                                                        </td>
                                                        <td class="py-2 pr-3">
                                                            <Show
                                                                when={entry.fc}
                                                                fallback={
                                                                    <span class="font-medium text-gray-800 dark:text-gray-200">
                                                                        {entry.playerName}
                                                                    </span>
                                                                }
                                                            >
                                                                <A
                                                                    href={`/player/${entry.fc}`}
                                                                    class="font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                                >
                                                                    {entry.playerName}
                                                                </A>
                                                            </Show>
                                                        </td>
                                                        <td class="py-2 pr-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                                                            {entry.finishTimeDisplay}
                                                        </td>
                                                        <td class="py-2 pr-3 hidden sm:table-cell">
                                                            <span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                                {entry.gameMode}
                                                            </span>
                                                        </td>
                                                        <td class="py-2 text-right text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                            {new Date(entry.achievedAt).toLocaleDateString(
                                                                "nl-NL",
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </For>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <Show when={bestsQuery.data!.totalPages > 1}>
                                    <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-wrap gap-3">
                                        <div class="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                disabled={page() === 1}
                                                class="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Previous
                                            </button>
                                            <span class="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                                Page
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={bestsQuery.data!.totalPages}
                                                    value={page()}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            const v = parseInt((e.target as HTMLInputElement).value);
                                                            if (!isNaN(v) && v >= 1 && v <= bestsQuery.data!.totalPages) setPage(v);
                                                            else (e.target as HTMLInputElement).value = String(page());
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        const v = parseInt(e.target.value);
                                                        if (!isNaN(v) && v >= 1 && v <= bestsQuery.data!.totalPages) setPage(v);
                                                        else e.target.value = String(page());
                                                    }}
                                                    class="w-14 px-2 py-1 text-center text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                of {bestsQuery.data!.totalPages}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setPage((p) => Math.min(bestsQuery.data!.totalPages, p + 1))}
                                                disabled={page() === bestsQuery.data!.totalPages}
                                                class="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Next
                                            </button>
                                        </div>
                                        <span class="text-sm text-gray-500 dark:text-gray-400">
                                            {bestsQuery.data!.totalCount.toLocaleString()} times
                                        </span>
                                    </div>
                                </Show>
                            </Show>
                        </Show>
                    </div>
                </div>
            </div>
        </div>
    );
}
