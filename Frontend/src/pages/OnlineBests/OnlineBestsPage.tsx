import SearchInput from "../../components/common/SearchInput";
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

/**
 * Deliberately not routed. This page shipped, then was taken back off because many of the times it
 * showed were nonsense, which is a problem with the race data the external reporting API sends
 * rather than with anything here. It is kept rather than deleted so it can go back up once that
 * data can be trusted; add a route in App.tsx with a Title and Meta the way every other page has.
 *
 * Note that the same data still reaches players through PlayerOnlineBestsCard, which is live on
 * player profiles, so unparking this page is not the only place bad times can surface.
 *
 * The defence against implausible times is the floor and cap in
 * RaceStatsRepository.GetTrackOnlineBestsAsync: a floor of the best known time minus two seconds
 * and a cap of 330s, the default online race length. Tightening or verifying those rules is the
 * route back to publishing this.
 */
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
            raceStatsApi.getTrackOnlineBests(
                selectedCourseId()!,
                engineClassId(),
                page(),
                PAGE_SIZE,
            ),
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
            <div class="pb-6 border-b border-line">
                <h1 class="type-display mb-3 text-fg">Online Best Times</h1>
                <p class="text-lg text-fg-muted">Fastest times achieved in actual online races</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Track selector */}
                <div class="lg:col-span-1">
                    <div class="bg-canvas rounded-lg border border-line p-4">
                        <SearchInput
                            id="online-bests-track-search"
                            class="mb-3"
                            label="Search tracks"
                            hideLabel
                            placeholder="Search tracks…"
                            value={trackSearch()}
                            onValueChange={(v) => setTrackSearch(v)}
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
                                        <p class="text-xs font-semibold text-fg-subtle mb-1 px-2">
                                            Retro
                                        </p>
                                        <For each={retroTracks()}>
                                            {(track) => (
                                                <button
                                                    type="button"
                                                    aria-pressed={
                                                        selectedCourseId() === track.courseId
                                                    }
                                                    onClick={() =>
                                                        handleTrackSelect(track.courseId)
                                                    }
                                                    class={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                                                        selectedCourseId() === track.courseId
                                                            ? "bg-accent text-accent-fg"
                                                            : "text-fg-muted hover:bg-surface"
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
                                        <p class="text-xs font-semibold text-fg-subtle mb-1 px-2">
                                            Custom
                                        </p>
                                        <For each={customTracks()}>
                                            {(track) => (
                                                <button
                                                    type="button"
                                                    aria-pressed={
                                                        selectedCourseId() === track.courseId
                                                    }
                                                    onClick={() =>
                                                        handleTrackSelect(track.courseId)
                                                    }
                                                    class={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                                                        selectedCourseId() === track.courseId
                                                            ? "bg-accent text-accent-fg"
                                                            : "text-fg-muted hover:bg-surface"
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
                    <div class="bg-canvas rounded-lg border border-line p-6">
                        <Show when={selectedCourseId() === null}>
                            <div class="flex flex-col items-center justify-center py-24 gap-3 text-fg-subtle">
                                <Clock size={48} />
                                <p class="text-lg font-medium">
                                    Select a track to see online best times
                                </p>
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
                                                aria-pressed={engineClassId() === opt.value}
                                                onClick={() => handleCcChange(opt.value)}
                                                class={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                    engineClassId() === opt.value
                                                        ? "bg-accent text-accent-fg"
                                                        : "bg-surface text-fg-muted hover:bg-gray-200 dark:hover:bg-gray-600"
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        )}
                                    </For>
                                </div>
                                <Show when={bestsQuery.data?.averageTimeDisplay}>
                                    <span class="text-sm text-fg-subtle">
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
                                    <p class="text-fg-muted">Loading times…</p>
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
                                <div class="flex flex-col items-center justify-center py-16 gap-3 text-fg-subtle">
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
                                            <tr class="text-left text-xs text-fg-subtle border-b border-line">
                                                <th class="pb-2 font-medium w-10">#</th>
                                                <th class="pb-2 font-medium">Player</th>
                                                <th class="pb-2 font-medium">Time</th>
                                                <th class="pb-2 font-medium hidden sm:table-cell">
                                                    Mode
                                                </th>
                                                <th class="pb-2 font-medium text-right">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                                            <For each={bestsQuery.data!.items}>
                                                {(entry) => (
                                                    <tr class="hover:bg-surface transition-colors">
                                                        <td class="py-2 pr-3 font-mono text-xs text-fg-subtle">
                                                            {entry.rank}
                                                        </td>
                                                        <td class="py-2 pr-3">
                                                            <Show
                                                                when={entry.fc}
                                                                fallback={
                                                                    <span class="font-medium text-fg">
                                                                        {entry.playerName}
                                                                    </span>
                                                                }
                                                            >
                                                                <A
                                                                    href={`/player/${entry.fc}`}
                                                                    class="font-medium text-fg hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                                >
                                                                    {entry.playerName}
                                                                </A>
                                                            </Show>
                                                        </td>
                                                        <td class="py-2 pr-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                                                            {entry.finishTimeDisplay}
                                                        </td>
                                                        <td class="py-2 pr-3 hidden sm:table-cell">
                                                            <span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-surface text-fg-muted">
                                                                {entry.gameMode}
                                                            </span>
                                                        </td>
                                                        <td class="py-2 text-right text-xs text-fg-subtle whitespace-nowrap">
                                                            {new Date(
                                                                entry.achievedAt,
                                                            ).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                )}
                                            </For>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <Show when={bestsQuery.data!.totalPages > 1}>
                                    <div class="flex items-center justify-between mt-4 pt-4 border-t border-line flex-wrap gap-3">
                                        <div class="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                disabled={page() === 1}
                                                class="px-3 py-1.5 rounded-lg text-sm font-medium bg-surface text-fg-muted hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Previous
                                            </button>
                                            <span class="flex items-center gap-1.5 text-sm text-fg-subtle">
                                                Page
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={bestsQuery.data!.totalPages}
                                                    value={page()}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            const v = parseInt(
                                                                (e.target as HTMLInputElement)
                                                                    .value,
                                                            );
                                                            if (
                                                                !isNaN(v) &&
                                                                v >= 1 &&
                                                                v <= bestsQuery.data!.totalPages
                                                            )
                                                                setPage(v);
                                                            else
                                                                (
                                                                    e.target as HTMLInputElement
                                                                ).value = String(page());
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        const v = parseInt(e.target.value);
                                                        if (
                                                            !isNaN(v) &&
                                                            v >= 1 &&
                                                            v <= bestsQuery.data!.totalPages
                                                        )
                                                            setPage(v);
                                                        else e.target.value = String(page());
                                                    }}
                                                    class="w-14 px-2 py-1 text-center text-sm border border-line-strong rounded-lg bg-canvas text-fg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                of {bestsQuery.data!.totalPages}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPage((p) =>
                                                        Math.min(
                                                            bestsQuery.data!.totalPages,
                                                            p + 1,
                                                        ),
                                                    )
                                                }
                                                disabled={page() === bestsQuery.data!.totalPages}
                                                class="px-3 py-1.5 rounded-lg text-sm font-medium bg-surface text-fg-muted hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Next
                                            </button>
                                        </div>
                                        <span class="text-sm text-fg-subtle">
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
