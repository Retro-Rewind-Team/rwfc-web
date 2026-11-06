import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import { Meta, Title } from "@solidjs/meta";
import { TriangleAlert, Trophy } from "lucide-solid";
import { useTTRankings } from "../../hooks/useTTRankings";
import { CountryFlag, InlinePagination, LoadingSpinner } from "../../components/common";
import ToggleGroup from "../../components/common/ToggleGroup";
import { ShroomlessFilter, TrackCategoryFilter, VehicleFilter } from "../../types/timeTrial";
import { TT_RANKINGS_META } from "../../constants/pageMeta";
import PageHeader from "../../components/common/PageHeader";

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
        <>
            <PageHeader
                page="ttRankings"
                compact
                crumbs={[{ label: "Time trials", href: "/tt" }]}
                title="Player rankings"
                description="Players ranked by the number of time trial world records they hold."
            />
            <div class="space-y-6">
                <Title>{TT_RANKINGS_META.title}</Title>
                <Meta name="description" content={TT_RANKINGS_META.description} />

                {/* Page Title */}

                {/* Filters */}
                <div class="bg-canvas rounded-lg border border-line overflow-hidden">
                    <div class="px-4 sm:px-6 py-4 bg-surface border-b border-line">
                        <h2 class="text-xl font-semibold text-fg">Filters</h2>
                        <p class="text-fg-subtle text-xs sm:text-sm">{filterSummary()}</p>
                    </div>
                    <div class="bg-surface p-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                            {/* Engine Class */}
                            <div>
                                <label class="block text-xs font-semibold text-fg-muted mb-1">
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
                                <label class="block text-xs font-semibold text-fg-muted mb-1">
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
                                <label class="block text-xs font-semibold text-fg-muted mb-1">
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
                                <label class="block text-xs font-semibold text-fg-muted mb-1">
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
                                <label class="block text-xs font-semibold text-fg-muted mb-1">
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
                    <div class="bg-canvas rounded-lg border border-line p-12 flex flex-col items-center gap-4">
                        <LoadingSpinner />
                        <p class="text-fg-muted">Loading rankings...</p>
                    </div>
                </Show>

                {/* Error */}
                <Show when={rankings.rankingsQuery.isError && !rankings.rankingsQuery.isLoading}>
                    <div class="bg-canvas rounded-lg border border-red-200 dark:border-red-800 p-8">
                        <div class="text-center space-y-4">
                            <div class="flex justify-center text-red-400">
                                <TriangleAlert size={48} />
                            </div>
                            <h2 class="text-2xl font-semibold text-red-900 dark:text-red-100">
                                Failed to load rankings
                            </h2>
                            <button
                                type="button"
                                onClick={() => rankings.rankingsQuery.refetch()}
                                class="bg-accent hover:bg-accent-hover text-accent-fg font-semibold py-2 px-6 rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </Show>

                {/* Rankings Table */}
                <Show when={rankings.rankingsQuery.data && !rankings.rankingsQuery.isLoading}>
                    <div class="bg-canvas rounded-lg border border-line overflow-hidden">
                        <div class="px-4 sm:px-6 py-4 bg-surface border-b border-line">
                            <h2 class="text-xl sm:text-2xl font-semibold text-fg">
                                Player Rankings
                            </h2>
                            <p class="text-fg-subtle text-xs sm:text-sm">
                                {rankings.rankingsQuery.data!.totalPlayers} player
                                {rankings.rankingsQuery.data!.totalPlayers !== 1 ? "s" : ""} with
                                world records
                            </p>
                        </div>

                        <Show
                            when={(rankings.rankingsQuery.data?.players.length ?? 0) > 0}
                            fallback={
                                <div class="p-12 text-center">
                                    <div class="flex justify-center mb-4 text-fg-subtle">
                                        <Trophy size={48} />
                                    </div>
                                    <h3 class="text-xl font-semibold text-fg mb-2">
                                        No Records Found
                                    </h3>
                                    <p class="text-fg-muted">
                                        No world records exist for this category yet.
                                    </p>
                                </div>
                            }
                        >
                            <div class="relative overflow-x-auto">
                                <table class="w-full">
                                    <thead class="bg-surface border-b border-line">
                                        <tr>
                                            <th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 w-16">
                                                Rank
                                            </th>
                                            <th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200">
                                                Player
                                            </th>
                                            <th class="px-4 sm:px-6 py-3 text-right text-xs font-medium w-24">
                                                WRs
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-line">
                                        <For each={rankings.rankingsQuery.data!.players}>
                                            {(player) => (
                                                <tr class="hover:bg-surface transition-colors">
                                                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                        <span class="text-lg font-semibold text-fg">
                                                            #{player.rank}
                                                        </span>
                                                    </td>
                                                    <td class="px-4 sm:px-6 py-4">
                                                        <A
                                                            href={`/timetrial/player/${player.ttProfileId}`}
                                                            class="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                                        >
                                                            <span class="font-medium text-fg hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
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
                                                        <span class="text-lg font-semibold text-blue-600 dark:text-blue-400">
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
        </>
    );
}
