import { createSignal, For, Show } from "solid-js";
import { ChevronDown, ChevronUp } from "lucide-solid";
import { usePlayerAnalytics } from "../../hooks/usePlayerAnalytics";
import { PositionCount, TrackPerformance } from "../../types/raceStats";
import { LoadingSpinner } from "../../components/common";

interface PlayerAnalyticsCardProps {
    pid: string;
}

const DAY_OPTIONS = [
    { label: "7d", value: 7 },
    { label: "30d", value: 30 },
    { label: "90d", value: 90 },
    { label: "All time", value: undefined as number | undefined },
] as const;

function positionLabel(pos: number) {
    if (pos === 1) return "1st";
    if (pos === 2) return "2nd";
    if (pos === 3) return "3rd";
    if (pos === 9) return "9th+";
    return `${pos}th`;
}

function positionBarColor(pos: number) {
    if (pos === 1) return "bg-yellow-400";
    if (pos === 2) return "bg-gray-300";
    if (pos === 3) return "bg-amber-600";
    return "bg-blue-400 dark:bg-blue-500";
}

type SortKey = "races" | "winRate" | "avgPos";

export default function PlayerAnalyticsCard(props: PlayerAnalyticsCardProps) {
    const {
        analyticsQuery,
        handleExpand,
        days,
        engineClassId,
        handleDaysChange,
        handleEngineClassChange,
    } = usePlayerAnalytics(props.pid);

    const [isOpen, setIsOpen] = createSignal(false);
    const [trackSort, setTrackSort] = createSignal<SortKey>("races");

    const toggle = () => {
        const next = !isOpen();
        setIsOpen(next);
        if (next) handleExpand();
    };

    const analytics = () => analyticsQuery.data;

    const sortedTracks = () => {
        const tracks = analytics()?.trackPerformance ?? [];
        if (trackSort() === "winRate") return [...tracks].sort((a, b) => b.winRate - a.winRate);
        if (trackSort() === "avgPos") return [...tracks].sort((a, b) => a.avgFinishPos - b.avgFinishPos);
        return tracks;
    };

    const totalRaces = () =>
        analytics()?.finishPositionDistribution.reduce((s, p) => s + p.count, 0) ?? 0;

    const maxPosCount = () => Math.max(1, ...(analytics()?.finishPositionDistribution.map(d => d.count) ?? [1]));
    const maxDayCount = () => Math.max(1, ...(analytics()?.racesByDayOfWeek.map(d => d.raceCount) ?? [1]));
    const maxHourCount = () => Math.max(1, ...(analytics()?.racesByHour.map(h => h.raceCount) ?? [1]));

    return (
        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
            <button
                type="button"
                onClick={toggle}
                class="w-full flex items-center justify-between p-6 text-left"
                aria-expanded={isOpen()}
            >
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h2>
                {isOpen() ? (
                    <ChevronUp size={20} class="text-gray-400 shrink-0" />
                ) : (
                    <ChevronDown size={20} class="text-gray-400 shrink-0" />
                )}
            </button>

            <Show when={isOpen()}>
                <div class="px-6 pb-6 space-y-6 border-t border-gray-100 dark:border-gray-700 pt-4">
                    {/* Filters */}
                    <div class="flex flex-wrap items-center gap-2 justify-end">
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

                    {/* Loading */}
                    <Show when={analyticsQuery.isLoading}>
                        <div class="flex items-center justify-center py-12 gap-3">
                            <LoadingSpinner />
                            <p class="text-gray-600 dark:text-gray-300">Loading analytics...</p>
                        </div>
                    </Show>

                    {/* No data */}
                    <Show when={!analyticsQuery.isLoading && !analytics()}>
                        <p class="text-gray-500 dark:text-gray-400 text-sm text-center py-6">
                            No race data available for this player yet.
                        </p>
                    </Show>

                    <Show when={analytics()}>
                        {/* Headline tiles */}
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                                <div class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                                    {analytics()!.winRate.toFixed(1)}%
                                </div>
                                <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Win Rate</div>
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                                <div class="text-3xl font-bold text-gray-900 dark:text-white">
                                    {totalRaces().toLocaleString()}
                                </div>
                                <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Races Analyzed</div>
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                                <div class="text-3xl font-bold text-gray-900 dark:text-white">
                                    {analytics()!.trackPerformance.length}
                                </div>
                                <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Tracks Played</div>
                            </div>
                        </div>

                        {/* Position distribution */}
                        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-4">
                            <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                                Finish Position Distribution
                            </h3>
                            <div class="space-y-2">
                                <For each={analytics()!.finishPositionDistribution}>
                                    {(item: PositionCount) => (
                                        <div class="flex items-center gap-3">
                                            <span class="text-xs text-gray-500 dark:text-gray-400 w-10 shrink-0 text-right">
                                                {positionLabel(item.position)}
                                            </span>
                                            <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                                                <div
                                                    class={`${positionBarColor(item.position)} h-full rounded-full transition-all`}
                                                    style={{
                                                        width: `${Math.round((item.count / maxPosCount()) * 100)}%`,
                                                    }}
                                                />
                                            </div>
                                            <span class="text-xs font-medium text-gray-700 dark:text-gray-300 w-10 text-right shrink-0">
                                                {item.count}
                                            </span>
                                        </div>
                                    )}
                                </For>
                            </div>
                        </div>

                        {/* Track performance table */}
                        <div>
                            <div class="flex items-center justify-between mb-3">
                                <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    Track Performance
                                </h3>
                                <div class="flex rounded overflow-hidden border border-gray-200 dark:border-gray-600 text-xs">
                                    {(
                                        [
                                            { label: "By Races", value: "races" },
                                            { label: "By Win%", value: "winRate" },
                                            { label: "By Avg Pos", value: "avgPos" },
                                        ] as const
                                    ).map((opt) => (
                                        <button
                                            type="button"
                                            onClick={() => setTrackSort(opt.value)}
                                            class={`px-2.5 py-1.5 font-medium transition-colors ${
                                                trackSort() === opt.value
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div class="overflow-x-auto max-h-72 overflow-y-auto">
                                <table class="w-full text-sm">
                                    <thead class="sticky top-0 z-10 bg-white dark:bg-gray-800">
                                        <tr class="text-left text-xs text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">
                                            <th class="pb-2 font-medium">Track</th>
                                            <th class="pb-2 font-medium text-right">Races</th>
                                            <th class="pb-2 font-medium text-right">Win %</th>
                                            <th class="pb-2 font-medium text-right">Avg Pos</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                                        <For each={sortedTracks()}>
                                            {(track: TrackPerformance) => (
                                                <tr
                                                    class={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                                                        track.lowSample ? "opacity-50" : ""
                                                    }`}
                                                    title={
                                                        track.lowSample
                                                            ? "Win rate may not be representative (fewer than 3 races)"
                                                            : undefined
                                                    }
                                                >
                                                    <td class="py-1.5 pr-3 text-gray-800 dark:text-gray-200 max-w-[160px] truncate">
                                                        {track.trackName}
                                                    </td>
                                                    <td class="py-1.5 pr-3 text-right text-gray-600 dark:text-gray-400">
                                                        {track.raceCount}
                                                    </td>
                                                    <td class="py-1.5 pr-3 text-right font-medium text-yellow-600 dark:text-yellow-400">
                                                        {track.winRate.toFixed(1)}%
                                                    </td>
                                                    <td class="py-1.5 text-right text-gray-600 dark:text-gray-400">
                                                        {track.avgFinishPos.toFixed(1)}
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Activity patterns */}
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* By day */}
                            <div>
                                <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                    Races by Day of Week
                                </h3>
                                <div class="space-y-1.5">
                                    <For each={analytics()!.racesByDayOfWeek}>
                                        {(day) => (
                                            <div class="flex items-center gap-3">
                                                <span class="text-xs text-gray-500 dark:text-gray-400 w-20 shrink-0">
                                                    {day.dayName}
                                                </span>
                                                <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                                    <div
                                                        class="bg-blue-500 dark:bg-blue-600 h-full rounded-full"
                                                        style={{
                                                            width: `${Math.round((day.raceCount / maxDayCount()) * 100)}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span class="text-xs text-gray-600 dark:text-gray-400 w-8 text-right shrink-0">
                                                    {day.raceCount}
                                                </span>
                                            </div>
                                        )}
                                    </For>
                                </div>
                            </div>

                            {/* By hour */}
                            <div>
                                <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                    Races by Hour (UTC)
                                </h3>
                                <div class="relative h-24">
                                    <div class="absolute inset-0 flex items-end gap-px">
                                        <For each={analytics()!.racesByHour}>
                                            {(hour) => (
                                                <div
                                                    class="flex-1 bg-blue-500 dark:bg-blue-600 rounded-t hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors cursor-default"
                                                    style={{
                                                        height: `${Math.max(
                                                            2,
                                                            Math.round((hour.raceCount / maxHourCount()) * 100),
                                                        )}%`,
                                                    }}
                                                    title={`${String(hour.hour).padStart(2, "0")}:00 -- ${hour.raceCount} races`}
                                                />
                                            )}
                                        </For>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Show>
                </div>
            </Show>
        </div>
    );
}
