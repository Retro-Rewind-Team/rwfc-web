import { A } from "@solidjs/router";
import { createMemo, createSignal, For, Show } from "solid-js";
import { useGlobalRaceStats } from "../../hooks/useGlobalRaceStats";
import { GlobalRaceStats, SetupEntry } from "../../types/raceStats";

const DAY_OPTIONS = [
    { label: "7d", value: 7 },
    { label: "30d", value: 30 },
    { label: "90d", value: 90 },
    { label: "All time", value: undefined },
] as const;

export default function RaceStatsPage() {
    const { globalStatsQuery, days, handleDaysChange } = useGlobalRaceStats();
    const stats = () => globalStatsQuery.data as GlobalRaceStats;

    const [trackSearch, setTrackSearch] = createSignal("");
    const [trackSort, setTrackSort] = createSignal<"plays" | "name">("plays");

    const filteredTracks = createMemo(() => {
        if (!globalStatsQuery.data) return [];
        const search = trackSearch().toLowerCase();
        const tracks = search
            ? stats().allPlayedTracks.filter(t => t.trackName.toLowerCase().includes(search))
            : stats().allPlayedTracks;

        return trackSort() === "name"
            ? [...tracks].sort((a, b) => a.trackName.localeCompare(b.trackName))
            : tracks;
    });

    const maxDayCount = createMemo(() =>
        Math.max(1, ...(globalStatsQuery.data?.racesByDayOfWeek.map(d => d.raceCount) ?? []))
    );

    const maxHourCount = createMemo(() =>
        Math.max(1, ...(globalStatsQuery.data?.racesByHour.map(h => h.raceCount) ?? []))
    );

    return (
        <div class="space-y-6">
            {/* Header + time filter */}
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 class="text-4xl font-bold text-gray-900 dark:text-white">📊 Race Statistics</h1>
                    <Show when={globalStatsQuery.data}>
                        <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                            Tracked since {new Date(stats().trackedSince).toLocaleDateString("nl-NL")}
                        </p>
                    </Show>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <For each={DAY_OPTIONS}>
                        {(opt) => (
                            <button
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
            <Show when={globalStatsQuery.isLoading}>
                <div class="flex items-center justify-center py-24">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
                    <p class="ml-4 text-gray-600 dark:text-gray-300">Loading stats...</p>
                </div>
            </Show>

            <Show when={globalStatsQuery.data}>
                {/* Overview tiles */}
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatTile label="Total Races Tracked" value={stats().totalRacesTracked.toLocaleString()} icon="🏁" />
                    <StatTile label="Unique Players" value={stats().uniquePlayersCount.toLocaleString()} icon="👥" />
                    <StatTile label="Tracks Played" value={stats().allPlayedTracks.length.toLocaleString()} icon="🗺️" />
                </div>

                {/* Most popular setup */}
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">🎮 Most Popular Setup</h2>
                    <div class="grid grid-cols-3 gap-6">
                        <SetupColumn title="Characters" entries={stats().topCharacters} />
                        <SetupColumn title="Vehicles" entries={stats().topVehicles} />
                        <SetupColumn title="Combos" entries={stats().topCombos} />
                    </div>
                </div>

                {/* Most active players + track table */}
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Most active players */}
                    <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">🏆 Most Active Players</h2>
                        <div class="space-y-2">
                            <For each={stats().mostActivePlayers}>
                                {(player, i) => (
                                    <div class="flex items-center justify-between py-1">
                                        <div class="flex items-center gap-3 min-w-0">
                                            <span class="text-sm text-gray-400 dark:text-gray-500 w-5 shrink-0 text-right">
                                                {i() + 1}.
                                            </span>
                                            <Show
                                                when={player.fc}
                                                fallback={
                                                    <span class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                                        {player.name}
                                                    </span>
                                                }
                                            >
                                                <A
                                                    href={`/player/${player.fc}`}
                                                    class="text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                                                >
                                                    {player.name}
                                                </A>
                                            </Show>
                                        </div>
                                        <span class="text-xs font-medium text-blue-600 dark:text-blue-400 shrink-0 ml-2">
                                            {player.raceCount.toLocaleString()} races
                                        </span>
                                    </div>
                                )}
                            </For>
                        </div>
                    </div>

                    {/* Track play counts */}
                    <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <h2 class="text-xl font-bold text-gray-900 dark:text-white">🗺️ Track Play Counts</h2>
                            <div class="flex items-center gap-2">
                                <div class="flex rounded overflow-hidden border border-gray-200 dark:border-gray-600 text-xs">
                                    <button
                                        onClick={() => setTrackSort("plays")}
                                        class={`px-3 py-1.5 font-medium transition-colors ${
                                            trackSort() === "plays"
                                                ? "bg-blue-600 text-white"
                                                : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                                        }`}
                                    >
                                        By plays
                                    </button>
                                    <button
                                        onClick={() => setTrackSort("name")}
                                        class={`px-3 py-1.5 font-medium transition-colors ${
                                            trackSort() === "name"
                                                ? "bg-blue-600 text-white"
                                                : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                                        }`}
                                    >
                                        A–Z
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search tracks..."
                                    value={trackSearch()}
                                    onInput={e => setTrackSearch(e.currentTarget.value)}
                                    class="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
                                />
                            </div>
                        </div>

                        <div class="overflow-y-auto max-h-80">
                            <table class="w-full text-sm">
                                <thead class="sticky top-0 bg-white dark:bg-gray-800">
                                    <tr class="text-left text-xs text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">
                                        <th class="pb-2 font-medium w-8">#</th>
                                        <th class="pb-2 font-medium">Track</th>
                                        <th class="pb-2 font-medium text-right">Races</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                                    <For each={filteredTracks()}>
                                        {(track, i) => (
                                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td class="py-1.5 pr-3 text-gray-400 dark:text-gray-500">{i() + 1}</td>
                                                <td class="py-1.5 pr-3 text-gray-800 dark:text-gray-200">{track.trackName}</td>
                                                <td class="py-1.5 text-right font-medium text-blue-600 dark:text-blue-400">
                                                    {track.raceCount.toLocaleString()}
                                                </td>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                            <Show when={filteredTracks().length === 0}>
                                <p class="text-center text-gray-400 dark:text-gray-500 py-6 text-sm">No tracks found</p>
                            </Show>
                        </div>
                    </div>
                </div>

                {/* Activity charts */}
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* By day of week */}
                    <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">📅 Races by Day of Week</h2>
                        <div class="space-y-2">
                            <For each={stats().racesByDayOfWeek}>
                                {(day) => (
                                    <div class="flex items-center gap-3">
                                        <span class="text-xs text-gray-500 dark:text-gray-400 w-24 shrink-0">{day.dayName}</span>
                                        <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                                            <div
                                                class="bg-blue-500 dark:bg-blue-600 h-full rounded-full transition-all"
                                                style={{ width: `${Math.round((day.raceCount / maxDayCount()) * 100)}%` }}
                                            />
                                        </div>
                                        <span class="text-xs font-medium text-gray-700 dark:text-gray-300 w-14 text-right shrink-0">
                                            {day.raceCount.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </For>
                        </div>
                    </div>

                    {/* By hour */}
                    <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">🕐 Races by Hour (UTC)</h2>
                        <div class="relative h-32">
                            <div class="absolute inset-0 flex items-end gap-px">
                                <For each={stats().racesByHour}>
                                    {(hour) => (
                                        <div
                                            class="flex-1 bg-blue-500 dark:bg-blue-600 rounded-t hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors cursor-default"
                                            style={{ height: `${Math.max(2, Math.round((hour.raceCount / maxHourCount()) * 100))}%` }}
                                            title={`${String(hour.hour).padStart(2, "0")}:00 — ${hour.raceCount.toLocaleString()} races`}
                                        />
                                    )}
                                </For>
                            </div>
                        </div>
                        {/* Hour axis labels */}
                        <div class="flex mt-1">
                            <For each={stats().racesByHour}>
                                {(hour) => (
                                    <div class="flex-1 text-center">
                                        <Show when={hour.hour % 6 === 0}>
                                            <span class="text-xs text-gray-400 dark:text-gray-500">
                                                {String(hour.hour).padStart(2, "0")}
                                            </span>
                                        </Show>
                                    </div>
                                )}
                            </For>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
}

function SetupColumn(props: { title: string; entries: SetupEntry[] }) {
    return (
        <div>
            <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {props.title}
            </h3>
            <div class="space-y-2">
                <For each={props.entries}>
                    {(entry, i) => (
                        <div class="flex items-start gap-2">
                            <span class="text-xs text-gray-400 dark:text-gray-500 shrink-0 mt-0.5 w-4">
                                {i() + 1}.
                            </span>
                            <div class="min-w-0">
                                <div class="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">
                                    {entry.name}
                                </div>
                                <div class="text-xs text-gray-400 dark:text-gray-500">
                                    {entry.raceCount.toLocaleString()} races
                                </div>
                            </div>
                        </div>
                    )}
                </For>
            </div>
        </div>
    );
}

function StatTile(props: { label: string; value: string; icon: string }) {
    return (
        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
            <div class="text-3xl">{props.icon}</div>
            <div>
                <div class="text-2xl font-bold text-gray-900 dark:text-white">{props.value}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">{props.label}</div>
            </div>
        </div>
    );
}
