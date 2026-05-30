import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import { X } from "lucide-solid";
import { RACES_PAGE_SIZE, useRaces } from "../../hooks/useRaces";
import { RaceEntry, RaceResult } from "../../types/raceStats";
import { InlinePagination, LoadingSpinner } from "../../components/common";
import { queryKeys } from "../../constants/queryKeys";
import { useQuery } from "@tanstack/solid-query";
import { timeTrialApi } from "../../services/api";

function positionBadgeClass(pos: number) {
    if (pos === 1) return "bg-yellow-400 text-yellow-900 font-bold";
    if (pos === 2) return "bg-gray-300 text-gray-800 font-bold";
    if (pos === 3) return "bg-amber-600 text-white font-bold";
    return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
}

function PositionBadge(props: { pos: number | null }) {
    return (
        <Show
            when={props.pos !== null}
            fallback={
                <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 font-medium">
                    DNF
                </span>
            }
        >
            <span
                class={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${positionBadgeClass(props.pos!)}`}
            >
                {props.pos}
            </span>
        </Show>
    );
}

function parseFinishTimeMs(display: string): number {
    const colonIdx = display.indexOf(":");
    if (colonIdx === -1) return Infinity;
    const minutes = parseInt(display.slice(0, colonIdx), 10);
    const rest = display.slice(colonIdx + 1);
    const dotIdx = rest.indexOf(".");
    const seconds = dotIdx === -1 ? parseInt(rest, 10) : parseInt(rest.slice(0, dotIdx), 10);
    const ms = dotIdx === -1 ? 0 : parseInt(rest.slice(dotIdx + 1).padEnd(3, "0"), 10);
    return minutes * 60000 + seconds * 1000 + ms;
}

function RaceCard(props: { race: RaceResult }) {
    const date = () =>
        new Date(props.race.timestamp).toLocaleString("nl-NL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    const sortedParticipants = () =>
        [...props.race.participants].sort((a, b) => {
            const ta = parseFinishTimeMs(a.finishTimeDisplay);
            const tb = parseFinishTimeMs(b.finishTimeDisplay);
            const dnfA = ta === 0;
            const dnfB = tb === 0;
            if (dnfA && dnfB) return 0;
            if (dnfA) return 1;
            if (dnfB) return -1;
            return ta - tb;
        });

    return (
        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <div class="flex items-center gap-3 min-w-0">
                    <span class="font-semibold text-gray-900 dark:text-white truncate">
                        {props.race.trackName}
                    </span>
                    <span class="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        {props.race.engineClassId === 1 ? "200cc" : "150cc"}
                    </span>
                    <span class="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                        {props.race.participants.length} players
                    </span>
                </div>
                <span class="shrink-0 text-xs text-gray-400 dark:text-gray-500">{date()}</span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="text-left text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
                            <th class="pb-1.5 font-medium w-8">Pos</th>
                            <th class="pb-1.5 font-medium">Player</th>
                            <th class="pb-1.5 font-medium hidden sm:table-cell">Character</th>
                            <th class="pb-1.5 font-medium hidden md:table-cell">Vehicle</th>
                            <th class="pb-1.5 font-medium text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50 dark:divide-gray-700/50">
                        <For each={sortedParticipants()}>
                            {(entry: RaceEntry, index) => {
                                const isDnf = () => parseFinishTimeMs(entry.finishTimeDisplay) === 0;
                                return (
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td class="py-1.5 pr-2">
                                        <PositionBadge pos={isDnf() ? null : index() + 1} />
                                    </td>
                                    <td class="py-1.5 pr-3 font-medium">
                                        <Show
                                            when={entry.friendCode}
                                            fallback={
                                                <span class="text-gray-400 dark:text-gray-500 italic">
                                                    {entry.name ?? "Unknown Player"}
                                                </span>
                                            }
                                        >
                                            <A
                                                href={`/player/${entry.friendCode}`}
                                                class="text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                            >
                                                {entry.name}
                                            </A>
                                        </Show>
                                    </td>
                                    <td class="py-1.5 pr-3 text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                                        {entry.characterName}
                                    </td>
                                    <td class="py-1.5 pr-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">
                                        {entry.vehicleName}
                                    </td>
                                    <td class="py-1.5 text-right font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                        {entry.finishTimeDisplay}
                                    </td>
                                </tr>
                                );
                            }}
                        </For>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function RacesPage() {
    const {
        racesQuery,
        courseId,
        setCourseId,
        engineClassId,
        setEngineClassId,
        from,
        setFrom,
        to,
        setTo,
        fcQuery,
        handleFcInput,
        currentPage,
        setCurrentPage,
        hasFilters,
        clearFilters,
        isDeepLinked,
    } = useRaces();

    const tracksQuery = useQuery(() => ({
        queryKey: queryKeys.ttTracks,
        queryFn: () => timeTrialApi.getAllTracks(),
        staleTime: Infinity,
    }));

    return (
        <div class="space-y-6">
            <div class="pb-6 border-b border-gray-200 dark:border-gray-700">
                <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">Race Browser</h1>
                <p class="text-xl text-gray-600 dark:text-gray-400">
                    Browse all recorded races across Retro Rewind
                </p>
            </div>

            {/* Filters -- hidden when deep-linked to a specific race */}
            <Show when={!isDeepLinked()}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4">
                    <div class="flex flex-wrap items-end gap-3">
                        {/* Friend code search */}
                        <div class="flex flex-col gap-1 min-w-0 flex-1">
                            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Player (friend code)
                            </label>
                            <input
                                type="text"
                                placeholder="0000-0000-0000"
                                value={fcQuery()}
                                onInput={(e) => handleFcInput(e.currentTarget.value)}
                                class="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                                aria-label="Filter by player friend code"
                            />
                        </div>

                        {/* Track dropdown */}
                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Track
                            </label>
                            <select
                                value={courseId()?.toString() ?? ""}
                                onChange={(e) =>
                                    setCourseId(
                                        e.currentTarget.value
                                            ? parseInt(e.currentTarget.value)
                                            : undefined,
                                    )
                                }
                                class="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Filter by track"
                            >
                                <option value="">All tracks</option>
                                <For each={tracksQuery.data ?? []}>
                                    {(track) => (
                                        <option value={track.courseId.toString()}>
                                            {track.name}
                                        </option>
                                    )}
                                </For>
                            </select>
                        </div>

                        {/* CC filter */}
                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">
                                CC
                            </label>
                            <div class="flex rounded overflow-hidden border border-gray-200 dark:border-gray-600 text-xs">
                                {(
                                    [
                                        { label: "All", value: undefined as number | undefined },
                                        { label: "150cc", value: 2 },
                                        { label: "200cc", value: 1 },
                                    ] as const
                                ).map((opt) => (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEngineClassId(opt.value);
                                            setCurrentPage(1);
                                        }}
                                        class={`px-3 py-1.5 font-medium transition-colors ${
                                            engineClassId() === opt.value
                                                ? "bg-blue-600 text-white"
                                                : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date range */}
                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">
                                From
                            </label>
                            <input
                                type="date"
                                value={from() ?? ""}
                                onInput={(e) => {
                                    setFrom(e.currentTarget.value || undefined);
                                    setCurrentPage(1);
                                }}
                                class="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">
                                To
                            </label>
                            <input
                                type="date"
                                value={to() ?? ""}
                                onInput={(e) => {
                                    setTo(e.currentTarget.value || undefined);
                                    setCurrentPage(1);
                                }}
                                class="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Clear */}
                        <Show when={hasFilters()}>
                            <button
                                type="button"
                                onClick={clearFilters}
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors self-end"
                            >
                                <X size={14} />
                                Clear
                            </button>
                        </Show>
                    </div>
                </div>
            </Show>

            {/* Loading */}
            <Show when={racesQuery.isLoading}>
                <div class="flex items-center justify-center py-24 gap-4">
                    <LoadingSpinner />
                    <p class="text-gray-600 dark:text-gray-300">Loading races...</p>
                </div>
            </Show>

            {/* Error */}
            <Show when={racesQuery.isError}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-red-200 dark:border-red-800 p-8 text-center space-y-4">
                    <p class="text-red-600 dark:text-red-400 font-medium">Failed to load races.</p>
                    <button
                        type="button"
                        onClick={() => racesQuery.refetch()}
                        class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </Show>

            {/* Results */}
            <Show when={racesQuery.data}>
                {(data) => (
                    <div class="space-y-4">
                        <Show when={data().items.length === 0}>
                            <p class="text-center text-gray-400 dark:text-gray-500 py-16">
                                No races found matching these filters.
                            </p>
                        </Show>

                        <For each={data().items}>
                            {(race) => <RaceCard race={race} />}
                        </For>

                        <Show when={data().totalPages > 1}>
                            <InlinePagination
                                currentPage={currentPage()}
                                totalPages={data().totalPages}
                                pageSize={RACES_PAGE_SIZE}
                                totalItems={data().totalCount}
                                onPageChange={setCurrentPage}
                                itemLabel="races"
                            />
                        </Show>
                    </div>
                )}
            </Show>
        </div>
    );
}
