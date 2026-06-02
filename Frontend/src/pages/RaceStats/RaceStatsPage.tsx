import { A } from "@solidjs/router";
import { createMemo, createSignal, For, Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { Calendar, ChartBarBig, Clock, Gamepad2, Map, Trophy, Users } from "lucide-solid";
import { useGlobalRaceStats } from "../../hooks/useGlobalRaceStats";
import { GlobalRaceStats } from "../../types/raceStats";
import { LoadingSpinner, StatCard, Tooltip } from "../../components/common";
import { SetupColumn } from "../../components/ui/leaderboard";
import { timeTrialApi } from "../../services/api";
import { queryKeys } from "../../constants/queryKeys";

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
    const [trackCategory, setTrackCategory] = createSignal<"all" | "retro" | "custom">("all");
    const [setupMode, setSetupMode] = createSignal<"usage" | "winrate" | "wincount">("usage");

    const tracksQuery = useQuery(() => ({
        queryKey: queryKeys.ttTracks,
        queryFn: () => timeTrialApi.getAllTracks(),
        staleTime: Infinity,
    }));

    const courseIdCategoryMap = createMemo(() => {
        const map: Record<number, "retro" | "custom"> = {};
        tracksQuery.data?.forEach((t) => {
            map[t.courseId] = t.category;
        });
        return map;
    });

    const filteredTracks = createMemo(() => {
        if (!globalStatsQuery.data) return [];

        // Attach original rank before filtering/sorting
        const ranked = stats().allPlayedTracks.map((t, i) => ({
            ...t,
            originalRank: i + 1,
        }));

        const search = trackSearch().toLowerCase();
        const category = trackCategory();
        const categoryMap = courseIdCategoryMap();

        const tracks = ranked.filter((t) => {
            if (search && !t.trackName.toLowerCase().includes(search)) return false;
            if (category !== "all" && categoryMap[t.courseId] !== category) return false;
            return true;
        });

        return trackSort() === "name"
            ? [...tracks].sort((a, b) => a.trackName.localeCompare(b.trackName))
            : tracks;
    });

    const maxDayCount = createMemo(() =>
        Math.max(1, ...(globalStatsQuery.data?.racesByDayOfWeek.map((d) => d.raceCount) ?? [])),
    );

    const maxHourCount = createMemo(() =>
        Math.max(1, ...(globalStatsQuery.data?.racesByHour.map((h) => h.raceCount) ?? [])),
    );

    return (
        <div class="space-y-8">
            <div class="pb-6 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Race Statistics
                        </h1>
                        <p class="text-lg text-gray-600 dark:text-gray-400">
                            Global race data across all Retro Rewind tracks and players
                        </p>
                        <Show when={globalStatsQuery.data}>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Tracked since {new Date(stats().trackedSince).toLocaleDateString("nl-NL")}
                            </p>
                        </Show>
                    </div>
                    <div class="flex items-center gap-1 flex-shrink-0 pt-1">
                        <For each={DAY_OPTIONS}>
                            {(opt) => (
                                <button
                                    type="button"
                                    onClick={() => handleDaysChange(opt.value)}
                                    class={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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

            {/* Loading */}
            <Show when={globalStatsQuery.isLoading}>
                <div class="flex items-center justify-center py-24 gap-4">
                    <LoadingSpinner />
                    <p class="text-gray-600 dark:text-gray-300">Loading stats...</p>
                </div>
            </Show>

            <Show when={globalStatsQuery.data}>
                {/* Overview tiles */}
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                        label="Total Races Tracked"
                        value={stats().totalRacesTracked.toLocaleString()}
                        colorScheme="blue"
                        icon={<ChartBarBig size={24} />}
                    />
                    <StatCard
                        label="Unique Players"
                        value={stats().uniquePlayersCount.toLocaleString()}
                        colorScheme="emerald"
                        icon={<Users size={24} />}
                    />
                    <StatCard
                        label="Tracks Played"
                        value={stats().allPlayedTracks.length.toLocaleString()}
                        colorScheme="purple"
                        icon={<Map size={24} />}
                    />
                </div>

                {/* Most popular setup */}
                <div class="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                    <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
                        <div class="flex items-center gap-2">
                            <Gamepad2 size={20} class="text-blue-500 dark:text-blue-400" />
                            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                                Most Popular Setup
                            </h2>
                        </div>
                        <div class="flex gap-1">
                            <button
                                type="button"
                                onClick={() => setSetupMode("usage")}
                                class={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    setupMode() === "usage"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                            >
                                Most Used
                            </button>
                            <button
                                type="button"
                                onClick={() => setSetupMode("winrate")}
                                class={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    setupMode() === "winrate"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                            >
                                Win Rate
                            </button>
                            <button
                                type="button"
                                onClick={() => setSetupMode("wincount")}
                                class={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    setupMode() === "wincount"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                            >
                                Total Wins
                            </button>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-6">
                        <SetupColumn
                            title="Characters"
                            mode={setupMode()}
                            usageEntries={stats().topCharacters}
                            winRateEntries={stats().topCharactersByWinRate}
                            winCountEntries={stats().topCharactersByWinCount}
                        />
                        <SetupColumn
                            title="Vehicles"
                            mode={setupMode()}
                            usageEntries={stats().topVehicles}
                            winRateEntries={stats().topVehiclesByWinRate}
                            winCountEntries={stats().topVehiclesByWinCount}
                        />
                        <SetupColumn
                            title="Combos"
                            mode={setupMode()}
                            usageEntries={stats().topCombos}
                            winRateEntries={stats().topCombosByWinRate}
                            winCountEntries={stats().topCombosByWinCount}
                        />
                    </div>
                </div>

                {/* Most active players + track table */}
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Most active players */}
                    <div class="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                        <div class="flex items-center gap-2 mb-4">
                            <Trophy size={20} class="text-amber-500 dark:text-amber-400" />
                            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                                Most Active Players
                            </h2>
                        </div>
                        <div class="space-y-3">
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
                    <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div class="flex items-center gap-2">
                                <Map size={20} class="text-purple-500 dark:text-purple-400" />
                                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                                    Track Play Counts
                                </h2>
                            </div>
                            <div class="flex items-center gap-2 flex-wrap">
                                {/* Category toggle */}
                                <div class="flex gap-1 text-xs">
                                    {(
                                        [
                                            { label: "All", value: "all" },
                                            { label: "Retro", value: "retro" },
                                            { label: "Custom", value: "custom" },
                                        ] as const
                                    ).map((opt) => (
                                        <button
                                            type="button"
                                            onClick={() => setTrackCategory(opt.value)}
                                            class={`px-3 py-1.5 rounded-lg border-2 font-medium transition-colors ${
                                                trackCategory() === opt.value
                                                    ? "bg-gray-900 border-gray-900 text-white hover:bg-gray-800 hover:border-gray-800 dark:bg-white dark:border-white dark:text-gray-900 dark:hover:bg-gray-100 dark:hover:border-gray-100"
                                                    : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Sort toggle */}
                                <div class="flex gap-1 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setTrackSort("plays")}
                                        class={`px-3 py-1.5 rounded-lg border-2 font-medium transition-colors ${
                                            trackSort() === "plays"
                                                ? "bg-gray-900 border-gray-900 text-white hover:bg-gray-800 hover:border-gray-800 dark:bg-white dark:border-white dark:text-gray-900 dark:hover:bg-gray-100 dark:hover:border-gray-100"
                                                : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
                                        }`}
                                    >
                                        By plays
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTrackSort("name")}
                                        class={`px-3 py-1.5 rounded-lg border-2 font-medium transition-colors ${
                                            trackSort() === "name"
                                                ? "bg-gray-900 border-gray-900 text-white hover:bg-gray-800 hover:border-gray-800 dark:bg-white dark:border-white dark:text-gray-900 dark:hover:bg-gray-100 dark:hover:border-gray-100"
                                                : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
                                        }`}
                                    >
                                        A-Z
                                    </button>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Search tracks..."
                                    value={trackSearch()}
                                    onInput={(e) => setTrackSearch(e.currentTarget.value)}
                                    class="text-sm px-3 py-1.5 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors w-36"
                                />
                            </div>
                        </div>

                        <div class="overflow-y-auto max-h-80 overscroll-contain">
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
                                        {(track) => (
                                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td class="py-1.5 pr-3 text-gray-400 dark:text-gray-500">
                                                    {track.originalRank}
                                                </td>
                                                <td class="py-1.5 pr-3 text-gray-800 dark:text-gray-200">
                                                    {track.trackName}
                                                </td>
                                                <td class="py-1.5 text-right font-medium text-blue-600 dark:text-blue-400">
                                                    {track.raceCount.toLocaleString()}
                                                </td>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                            <Show when={filteredTracks().length === 0}>
                                <p class="text-center text-gray-400 dark:text-gray-500 py-6 text-sm">
                                    No tracks found
                                </p>
                            </Show>
                        </div>
                    </div>
                </div>

                {/* Activity charts */}
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* By day of week */}
                    <div class="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                        <div class="flex items-center gap-2 mb-4">
                            <Calendar size={20} class="text-emerald-500 dark:text-emerald-400" />
                            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                                Races by Day of Week
                            </h2>
                        </div>
                        <div class="space-y-3">
                            <For each={stats().racesByDayOfWeek}>
                                {(day) => (
                                    <div class="flex items-center gap-3">
                                        <span class="text-xs text-gray-500 dark:text-gray-400 w-24 shrink-0">
                                            {day.dayName}
                                        </span>
                                        <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                                            <div
                                                class="bg-blue-500 dark:bg-blue-600 h-full rounded-full transition-all"
                                                style={{
                                                    width: `${Math.round((day.raceCount / maxDayCount()) * 100)}%`,
                                                }}
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
                    <div class="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                        <div class="flex items-center gap-2 mb-4">
                            <Clock size={20} class="text-orange-500 dark:text-orange-400" />
                            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                                Races by Hour (UTC)
                            </h2>
                        </div>
                        <div class="relative h-32">
                            <div class="absolute inset-0 flex items-end gap-px">
                                <For each={stats().racesByHour}>
                                    {(hour) => (
                                        <Tooltip
                                            text={`${String(hour.hour).padStart(2, "0")}:00 - ${hour.raceCount.toLocaleString()} races`}
                                            class="flex-1"
                                        >
                                            <div
                                                class="w-full bg-blue-500 dark:bg-blue-600 rounded-t hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors cursor-default"
                                                style={{
                                                    height: `${Math.max(2, Math.round((hour.raceCount / maxHourCount()) * 100))}%`,
                                                }}
                                            />
                                        </Tooltip>
                                    )}
                                </For>
                            </div>
                        </div>
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
