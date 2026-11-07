import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import { Globe, Lock, X } from "lucide-solid";
import { RACES_PAGE_SIZE, useRaces } from "../../hooks/useRaces";
import { RaceEntry, RaceResult } from "../../types/raceStats";
import { InlinePagination, LoadingSpinner } from "../../components/common";
import { queryKeys } from "../../constants/queryKeys";
import { useQuery } from "@tanstack/solid-query";
import { timeTrialApi } from "../../services/api";
import PositionBadge from "../../components/ui/player/PositionBadge";
import { Meta, Title } from "@solidjs/meta";
import { RACES_META } from "../../constants/pageMeta";
import PageHeader from "../../components/common/PageHeader";

// The backend recomputes finishPos from finish times on ingest and uses 0 for a player who did
// not finish. Reading that is exact; parsing it back out of the formatted time is not, because a
// DNF is sent as "N/A".
const DNF = 0;

const didNotFinish = (entry: RaceEntry) => entry.finishPos === DNF;

function RaceCard(props: { race: RaceResult }) {
    const date = () =>
        new Date(props.race.timestamp).toLocaleString(undefined, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    const sortedParticipants = () =>
        [...props.race.participants].sort((a, b) => {
            const dnfA = didNotFinish(a);
            const dnfB = didNotFinish(b);
            if (dnfA && dnfB) return 0;
            if (dnfA) return 1;
            if (dnfB) return -1;
            return a.finishPos - b.finishPos;
        });

    return (
        <div class="bg-canvas rounded-lg border border-line overflow-hidden">
            {/* Header zone */}
            <div class="bg-surface border-b border-line px-4 py-3">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                    <span class="font-semibold text-fg truncate text-base">
                        {props.race.trackName}
                    </span>
                    <div class="flex min-w-0 flex-wrap items-center gap-2">
                        <span class="inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-xs font-medium border-line text-fg-muted">
                            {props.race.engineClassId === 1 ? "200cc" : "150cc"}
                        </span>
                        <Show when={props.race.gameMode}>
                            <span class="inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-xs font-medium border-line text-fg-muted">
                                {props.race.gameMode}
                            </span>
                        </Show>
                        <Show when={props.race.isPublic !== null}>
                            <span
                                class={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-xs font-medium ${props.race.isPublic ? "border-transparent bg-accent-soft text-accent-text" : "border-line text-fg-muted"}`}
                            >
                                <Show when={props.race.isPublic} fallback={<Lock size={10} />}>
                                    <Globe size={10} />
                                </Show>
                                {props.race.isPublic ? "Public" : "Private"}
                            </span>
                        </Show>
                        <span class="text-xs text-fg-subtle">
                            {props.race.participants.length} players
                        </span>
                        <span class="text-xs text-fg-subtle">{date()}</span>
                    </div>
                </div>
            </div>

            {/* Body zone */}
            <div class="relative px-4 py-4 overflow-x-auto overscroll-contain">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="text-left text-xs text-fg-subtle border-b border-line">
                            <th class="pb-1.5 font-medium w-8">Pos</th>
                            <th class="pb-1.5 font-medium">Player</th>
                            <th class="pb-1.5 font-medium hidden sm:table-cell">Character</th>
                            <th class="pb-1.5 font-medium hidden md:table-cell">Vehicle</th>
                            <th class="pb-1.5 font-medium text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50 dark:divide-gray-700/50">
                        <For each={sortedParticipants()}>
                            {(entry: RaceEntry) => {
                                // null renders the DNF badge. The server's finishPos is used
                                // rather than the row index so a DNF cannot be handed a position.
                                const pos = () => (didNotFinish(entry) ? null : entry.finishPos);
                                return (
                                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td class="py-2.5 pr-2">
                                            <PositionBadge pos={pos()} size="lg" />
                                        </td>
                                        <td class="py-2.5 pr-3 font-medium">
                                            <Show
                                                when={entry.friendCode}
                                                fallback={
                                                    <span class="text-fg-subtle italic">
                                                        {entry.name ?? "Unknown Player"}
                                                    </span>
                                                }
                                            >
                                                <A
                                                    href={`/player/${entry.friendCode}`}
                                                    class="text-fg hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                                                >
                                                    {entry.name}
                                                </A>
                                            </Show>
                                        </td>
                                        <td class="py-2.5 pr-3 text-fg-muted hidden sm:table-cell">
                                            {entry.characterName}
                                        </td>
                                        <td class="py-2.5 pr-3 text-fg-muted hidden md:table-cell">
                                            {entry.vehicleName}
                                        </td>
                                        <td class="py-2.5 text-right font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap">
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
        <>
            <PageHeader
                page="races"
                title="Races"
                description="Recorded online races from Retro WFC, with finishing positions, players and setups. Filter by track, engine class, room or player."
            />
            <div class="space-y-8">
                <Title>{RACES_META.title}</Title>
                <Meta name="description" content={RACES_META.description} />

                {/* Filters -- hidden when deep-linked to a specific race */}
                <Show when={!isDeepLinked()}>
                    <div class="bg-canvas rounded-lg border border-line p-4">
                        <div class="flex flex-col gap-4">
                            {/* Row 1: text search */}
                            <div class="flex flex-col sm:flex-row gap-3">
                                <div class="flex flex-col gap-1 flex-1">
                                    <label class="text-xs font-medium text-fg-subtle">
                                        Player (friend code)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="0000-0000-0000"
                                        value={fcQuery()}
                                        onInput={(e) => handleFcInput(e.currentTarget.value)}
                                        class="text-sm px-3 py-2 border border-line rounded-lg bg-canvas text-fg placeholder:text-fg-subtle transition-colors w-full"
                                        aria-label="Filter by player friend code"
                                    />
                                </div>
                                <div class="flex flex-col gap-1 flex-1">
                                    <label class="text-xs font-medium text-fg-subtle">Track</label>
                                    <select
                                        value={courseId()?.toString() ?? ""}
                                        onChange={(e) =>
                                            setCourseId(
                                                e.currentTarget.value
                                                    ? parseInt(e.currentTarget.value)
                                                    : undefined,
                                            )
                                        }
                                        class="h-10 w-full min-w-0 rounded-md border border-line-strong bg-canvas px-3 text-sm text-fg transition-colors hover:border-fg-subtle"
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
                            </div>

                            {/* Row 2: option filters */}
                            <div class="flex flex-col sm:flex-row sm:items-end gap-3">
                                <div class="flex flex-col gap-1">
                                    <label class="text-xs font-medium text-fg-subtle">CC</label>
                                    <div class="flex gap-1">
                                        {(
                                            [
                                                {
                                                    label: "All",
                                                    value: undefined as number | undefined,
                                                },
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
                                                class={`px-3 py-2 text-xs rounded-lg border font-medium transition-colors ${
                                                    engineClassId() === opt.value
                                                        ? "border-accent bg-accent-soft text-accent-text"
                                                        : "bg-canvas border-line-strong text-fg-muted hover:border-gray-400 dark:hover:border-gray-500"
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-3 sm:flex">
                                    <div class="flex min-w-0 flex-col gap-1">
                                        <label
                                            for="races-from"
                                            class="text-xs font-medium text-fg-subtle"
                                        >
                                            From
                                        </label>
                                        <input
                                            id="races-from"
                                            type="date"
                                            value={from() ?? ""}
                                            onInput={(e) => {
                                                setFrom(e.currentTarget.value || undefined);
                                                setCurrentPage(1);
                                            }}
                                            class="h-10 w-full min-w-0 rounded-md border border-line-strong bg-canvas px-3 text-sm text-fg transition-colors hover:border-fg-subtle"
                                        />
                                    </div>
                                    <div class="flex min-w-0 flex-col gap-1">
                                        <label
                                            for="races-to"
                                            class="text-xs font-medium text-fg-subtle"
                                        >
                                            To
                                        </label>
                                        <input
                                            id="races-to"
                                            type="date"
                                            value={to() ?? ""}
                                            onInput={(e) => {
                                                setTo(e.currentTarget.value || undefined);
                                                setCurrentPage(1);
                                            }}
                                            class="h-10 w-full min-w-0 rounded-md border border-line-strong bg-canvas px-3 text-sm text-fg transition-colors hover:border-fg-subtle"
                                        />
                                    </div>
                                </div>

                                <Show when={hasFilters()}>
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line-strong text-sm font-medium bg-canvas text-fg-muted hover:border-gray-400 dark:hover:border-gray-500 transition-colors self-end"
                                    >
                                        <X size={14} />
                                        Clear
                                    </button>
                                </Show>
                            </div>
                        </div>
                    </div>
                </Show>

                {/* Loading */}
                <Show when={racesQuery.isLoading}>
                    <div class="flex items-center justify-center py-24 gap-4">
                        <LoadingSpinner />
                        <p class="text-fg-muted">Loading races...</p>
                    </div>
                </Show>

                {/* Error */}
                <Show when={racesQuery.isError}>
                    <div class="bg-canvas rounded-lg border border-red-200 dark:border-red-800 p-8 text-center space-y-4">
                        <p class="text-red-600 dark:text-red-400 font-medium">
                            Failed to load races.
                        </p>
                        <button
                            type="button"
                            onClick={() => racesQuery.refetch()}
                            class="bg-accent hover:bg-accent-hover text-accent-fg font-semibold py-2 px-6 rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </Show>

                {/* Results */}
                <Show when={racesQuery.data}>
                    {(data) => (
                        <div class="space-y-6">
                            <Show when={data().items.length === 0}>
                                <p class="text-center text-fg-subtle py-16">
                                    No races found matching these filters.
                                </p>
                            </Show>

                            <For each={data().items}>{(race) => <RaceCard race={race} />}</For>

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
        </>
    );
}
