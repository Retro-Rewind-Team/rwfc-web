import { For, Show } from "solid-js";
import { ChevronLeft, ChevronRight, X } from "lucide-solid";
import { usePlayerRaceStats } from "../../hooks/usePlayerRaceStats";
import { PlayerRaceStats, RecentRace, SetupEntry, TrackPlayCount } from "../../types/raceStats";
import { LoadingSpinner } from "../../components/common";

interface PlayerRaceStatsCardProps {
    pid: string;
}

const DAY_OPTIONS = [
    { label: "7d", value: 7 },
    { label: "30d", value: 30 },
    { label: "90d", value: 90 },
    { label: "All time", value: undefined },
] as const;

export default function PlayerRaceStatsCard(props: PlayerRaceStatsCardProps) {
    const {
        raceStatsQuery,
        hasRaceStats,
        days,
        courseId,
        engineClassId,
        activeTrackName,
        currentPage,
        setCurrentPage,
        handleDaysChange,
        handleCourseIdChange,
        handleEngineClassChange,
    } = usePlayerRaceStats(props.pid);

    const stats = () => raceStatsQuery.data as PlayerRaceStats;

    const formatTimestamp = (ts: string) =>
        new Date(ts).toLocaleString("nl-NL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    return (
        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6 space-y-6">
            {/* Header + filters */}
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Race Stats</h2>
                </div>
                <div class="flex items-center gap-2 flex-wrap justify-end">
                    {/* CC toggle */}
                    <div class="flex rounded overflow-hidden border border-gray-200 dark:border-gray-600 text-xs">
                        {(
                            [
                                { label: "All", value: undefined },
                                { label: "150cc", value: 2 },
                                { label: "200cc", value: 1 },
                            ] as const
                        ).map((opt) => (
                            <button
                                type="button"
                                onClick={() => handleEngineClassChange(opt.value)}
                                class={`px-3 py-1.5 font-medium transition-colors ${
                                    engineClassId() === opt.value
                                        ? "bg-purple-600 text-white"
                                        : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {/* Day filter */}
                    <div class="flex items-center gap-1">
                        <For each={DAY_OPTIONS}>
                            {(opt) => (
                                <button
                                    type="button"
                                    onClick={() => handleDaysChange(opt.value)}
                                    class={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                        days() === opt.value
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            )}
                        </For>
                    </div>
                </div>
            </div>

            {/* Active track filter badge */}
            <Show when={courseId() !== undefined}>
                <div class="flex items-center gap-2 -mt-3">
                    <span class="text-xs text-gray-500 dark:text-gray-400">Filtered by track:</span>
                    <button
                        type="button"
                        onClick={() => handleCourseIdChange(undefined)}
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                    >
                        {activeTrackName()}
                        <X size={12} />
                    </button>
                </div>
            </Show>

            {/* Loading */}
            <Show when={raceStatsQuery.isLoading}>
                <div class="flex items-center justify-center py-8 gap-3">
                    <LoadingSpinner />
                    <p class="text-gray-600 dark:text-gray-300">Loading race stats...</p>
                </div>
            </Show>

            {/* No data */}
            <Show when={!raceStatsQuery.isLoading && !hasRaceStats()}>
                <p class="text-gray-500 dark:text-gray-400 text-sm">
                    No race data available for this player yet.
                </p>
            </Show>

            <Show when={hasRaceStats()}>
                <div class="space-y-6">
                    <p class="text-xs text-gray-400 dark:text-gray-500 -mt-4">
                        Tracked since {new Date(stats().trackedSince).toLocaleDateString("nl-NL")}
                    </p>

                    {/* Summary tiles */}
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <StatTile label="Total Races" value={stats().totalRaces.toLocaleString()} />
                        <StatTile
                            label="Total Frames in 1st"
                            value={stats().totalFramesIn1st.toLocaleString()}
                        />
                        <StatTile
                            label="Avg Frames in 1st"
                            value={stats().avgFramesIn1stPerRace.toFixed(1)}
                        />
                    </div>

                    {/* Setup stats + top tracks */}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Setup columns */}
                        <div class="grid grid-cols-3 gap-3">
                            <SetupColumn title="Characters" entries={stats().topCharacters} />
                            <SetupColumn title="Vehicles" entries={stats().topVehicles} />
                            <SetupColumn title="Combos" entries={stats().topCombos} />
                        </div>

                        {/* Top tracks */}
                        <Show when={stats().topTracks.length > 0}>
                            <div>
                                <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                    Most Played Tracks
                                </h3>
                                <div class="space-y-2">
                                    <For each={stats().topTracks}>
                                        {(track: TrackPlayCount, i) => (
                                            <div class="flex items-center justify-between">
                                                <div class="flex items-center space-x-2 min-w-0">
                                                    <span class="text-xs text-gray-400 dark:text-gray-500 w-4 shrink-0">
                                                        {i() + 1}.
                                                    </span>
                                                    <span
                                                        class="text-gray-700 dark:text-gray-300 text-sm truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                        title={`Filter by ${track.trackName}`}
                                                        onClick={() =>
                                                            handleCourseIdChange(
                                                                track.courseId,
                                                                track.trackName,
                                                            )
                                                        }
                                                    >
                                                        {track.trackName}
                                                    </span>
                                                </div>
                                                <span class="text-xs font-medium text-blue-600 dark:text-blue-400 shrink-0 ml-2">
                                                    {track.raceCount}x
                                                </span>
                                            </div>
                                        )}
                                    </For>
                                </div>
                            </div>
                        </Show>
                    </div>

                    {/* Recent races */}
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                Recent Races
                            </h3>
                            <span class="text-xs text-gray-400 dark:text-gray-500">
                                {stats().totalRecentRaces.toLocaleString()} total
                            </span>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="text-left text-xs text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">
                                        <th class="pb-2 font-medium">Track</th>
                                        <th class="pb-2 font-medium">Time</th>
                                        <th class="pb-2 font-medium hidden sm:table-cell">
                                            Character
                                        </th>
                                        <th class="pb-2 font-medium hidden md:table-cell">
                                            Vehicle
                                        </th>
                                        <th class="pb-2 font-medium text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                                    <For each={stats().recentRaces}>
                                        {(race: RecentRace) => (
                                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td class="py-2 pr-3 max-w-[140px]">
                                                    <span
                                                        class="text-gray-800 dark:text-gray-200 truncate block cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                        title={`Filter by ${race.trackName}`}
                                                        onClick={() =>
                                                            handleCourseIdChange(
                                                                race.courseId,
                                                                race.trackName,
                                                            )
                                                        }
                                                    >
                                                        {race.trackName}
                                                    </span>
                                                </td>
                                                <td class="py-2 pr-3 font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                                    {race.finishTimeDisplay}
                                                </td>
                                                <td class="py-2 pr-3 text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                                                    {race.characterName}
                                                </td>
                                                <td class="py-2 pr-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">
                                                    {race.vehicleName}
                                                </td>
                                                <td class="py-2 text-gray-400 dark:text-gray-500 text-right whitespace-nowrap">
                                                    {formatTimestamp(race.timestamp)}
                                                </td>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <Show when={stats().totalPages > 1}>
                            <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage() === 1}
                                    class="inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={14} />
                                    Previous
                                </button>
                                <span class="text-sm text-gray-500 dark:text-gray-400">
                                    Page {currentPage()} of {stats().totalPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage((p) => Math.min(stats().totalPages, p + 1))
                                    }
                                    disabled={currentPage() === stats().totalPages}
                                    class="inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </Show>
                    </div>
                </div>
            </Show>
        </div>
    );
}

function SetupColumn(props: { title: string; entries: SetupEntry[] }) {
    return (
        <div>
            <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {props.title}
            </h3>
            <div class="space-y-1.5">
                <For each={props.entries}>
                    {(entry, i) => (
                        <div class="flex items-start gap-1.5">
                            <span class="text-xs text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">
                                {i() + 1}.
                            </span>
                            <div class="min-w-0">
                                <div class="text-xs font-medium text-gray-800 dark:text-gray-200 leading-tight">
                                    {entry.name}
                                </div>
                                <div class="text-xs text-gray-400 dark:text-gray-500">
                                    {entry.raceCount} races
                                </div>
                            </div>
                        </div>
                    )}
                </For>
            </div>
        </div>
    );
}

function StatTile(props: { label: string; value: string }) {
    return (
        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
            <div class="text-lg font-bold text-gray-900 dark:text-white">{props.value}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{props.label}</div>
        </div>
    );
}
