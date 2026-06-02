import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import { ChevronLeft, TriangleAlert, Trophy } from "lucide-solid";
import { useTTRankings } from "../../hooks/useTTRankings";
import { CountryFlag, InlinePagination, LoadingSpinner } from "../../components/common";
import ToggleGroup from "../../components/common/ToggleGroup";
import { ShroomlessFilter, TrackCategoryFilter, VehicleFilter } from "../../types/timeTrial";

type CCOption = "150" | "200";
type GlitchOption = "unrestricted" | "no-glitch";

export default function TTRankingsPage() {
    const rankings = useTTRankings();

    const ccValue = (): CCOption => String(rankings.selectedCC()) as CCOption;
    const glitchValue = (): GlitchOption =>
        rankings.glitchAllowed() ? "unrestricted" : "no-glitch";

    const filterSummary = () => {
        const parts: string[] = [];
        parts.push(`${rankings.selectedCC()}cc`);
        parts.push(rankings.glitchAllowed() ? "Unrestricted" : "Non-Glitch");
        const v = rankings.vehicleFilter();
        if (v !== "all") parts.push(v.charAt(0).toUpperCase() + v.slice(1));
        const s = rankings.shroomlessFilter();
        if (s === "only") parts.push("Shroomless");
        else if (s === "exclude") parts.push("No Shroomless");
        const tc = rankings.trackCategoryFilter();
        if (tc === "retro") parts.push("Retro");
        else if (tc === "custom") parts.push("Custom");
        return parts.join(" • ");
    };

    return (
        <div class="space-y-6">
            {/* Back Button */}
            <div>
                <A
                    href="/timetrial"
                    class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                    <ChevronLeft size={16} />
                    Back to Time Trial Leaderboards
                </A>
            </div>

            {/* Page Title */}
            <div class="pb-6 border-b border-gray-200 dark:border-gray-700">
                <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    TT Player Rankings
                </h1>
                <p class="text-lg text-gray-600 dark:text-gray-400">
                    Players ranked by world records held
                </p>
            </div>

            {/* Filters */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="px-4 sm:px-6 py-4 bg-gray-200 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">Filters</h2>
                    <p class="text-gray-500 dark:text-white/80 text-xs sm:text-sm">{filterSummary()}</p>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700/50 p-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                        {/* Engine Class */}
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Engine Class
                            </label>
                            <ToggleGroup<CCOption>
                                value={ccValue()}
                                onChange={(v) =>
                                    rankings.handleCCChange(Number(v) as 150 | 200)
                                }
                                options={[
                                    { value: "150", label: "150cc" },
                                    { value: "200", label: "200cc" },
                                ]}
                            />
                        </div>

                        {/* Category Type */}
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Category Type
                            </label>
                            <ToggleGroup<GlitchOption>
                                value={glitchValue()}
                                onChange={(v) =>
                                    rankings.handleGlitchAllowedChange(v === "unrestricted")
                                }
                                options={[
                                    { value: "unrestricted", label: "Unrestricted" },
                                    { value: "no-glitch", label: "No Glitch" },
                                ]}
                            />
                        </div>

                        {/* Vehicle Type */}
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Vehicle Type
                            </label>
                            <ToggleGroup<VehicleFilter>
                                value={rankings.vehicleFilter()}
                                onChange={rankings.handleVehicleFilterChange}
                                options={[
                                    { value: "all", label: "All" },
                                    { value: "karts", label: "Karts" },
                                    { value: "bikes", label: "Bikes" },
                                ]}
                            />
                        </div>

                        {/* Shroomless */}
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Shroomless
                            </label>
                            <ToggleGroup<ShroomlessFilter>
                                value={rankings.shroomlessFilter()}
                                onChange={rankings.handleShroomlessFilterChange}
                                options={[
                                    { value: "all", label: "All" },
                                    { value: "only", label: "Only" },
                                    { value: "exclude", label: "Exclude" },
                                ]}
                            />
                        </div>

                        {/* Track Category */}
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Track Category
                            </label>
                            <ToggleGroup<TrackCategoryFilter>
                                value={rankings.trackCategoryFilter()}
                                onChange={rankings.handleTrackCategoryFilterChange}
                                options={[
                                    { value: "all", label: "All" },
                                    { value: "retro", label: "Retro" },
                                    { value: "custom", label: "Custom" },
                                ]}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading */}
            <Show when={rankings.rankingsQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center gap-4">
                    <LoadingSpinner />
                    <p class="text-gray-600 dark:text-gray-400">Loading rankings...</p>
                </div>
            </Show>

            {/* Error */}
            <Show when={rankings.rankingsQuery.isError && !rankings.rankingsQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-red-200 dark:border-red-800 p-8">
                    <div class="text-center space-y-4">
                        <div class="flex justify-center text-red-400">
                            <TriangleAlert size={48} />
                        </div>
                        <h2 class="text-2xl font-bold text-red-900 dark:text-red-100">
                            Failed to load rankings
                        </h2>
                        <button
                            type="button"
                            onClick={() => rankings.rankingsQuery.refetch()}
                            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </Show>

            {/* Rankings Table */}
            <Show
                when={rankings.rankingsQuery.data && !rankings.rankingsQuery.isLoading}
            >
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div class="px-4 sm:px-6 py-4 bg-gray-200 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                        <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Player Rankings</h2>
                        <p class="text-gray-500 dark:text-white/80 text-xs sm:text-sm">
                            {rankings.rankingsQuery.data!.totalPlayers} player
                            {rankings.rankingsQuery.data!.totalPlayers !== 1 ? "s" : ""} with world records
                        </p>
                    </div>

                    <Show
                        when={(rankings.rankingsQuery.data?.players.length ?? 0) > 0}
                        fallback={
                            <div class="p-12 text-center">
                                <div class="flex justify-center mb-4 text-gray-300 dark:text-gray-600">
                                    <Trophy size={48} />
                                </div>
                                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    No Records Found
                                </h3>
                                <p class="text-gray-600 dark:text-gray-400">
                                    No world records exist for this category yet.
                                </p>
                            </div>
                        }
                    >
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead class="bg-gray-200 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                                    <tr>
                                        <th class="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-200 w-16">
                                            Rank
                                        </th>
                                        <th class="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-200">
                                            Player
                                        </th>
                                        <th class="px-4 sm:px-6 py-3 text-right text-xs font-medium uppercase tracking-wider w-24">
                                            WRs
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                    <For each={rankings.rankingsQuery.data!.players}>
                                        {(player) => (
                                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td class="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <span class="text-lg font-bold text-gray-900 dark:text-white">
                                                        #{player.rank}
                                                    </span>
                                                </td>
                                                <td class="px-4 sm:px-6 py-4">
                                                    <A
                                                        href={`/timetrial/player/${player.ttProfileId}`}
                                                        class="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                                    >
                                                        <span class="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                            {player.displayName}
                                                        </span>
                                                        <CountryFlag
                                                            countryAlpha2={player.countryAlpha2}
                                                            countryName={player.countryName}
                                                            size="sm"
                                                        />
                                                    </A>
                                                </td>
                                                <td class="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                                    <span class="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                        {player.worldRecordCount}
                                                    </span>
                                                </td>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <Show when={(rankings.rankingsQuery.data?.totalPages ?? 1) > 1}>
                            <InlinePagination
                                currentPage={rankings.currentPage()}
                                totalPages={rankings.rankingsQuery.data!.totalPages}
                                pageSize={rankings.rankingsQuery.data!.pageSize}
                                totalItems={rankings.rankingsQuery.data!.totalPlayers}
                                onPageChange={rankings.setCurrentPage}
                                itemLabel="players"
                            />
                        </Show>
                    </Show>
                </div>
            </Show>
        </div>
    );
}
