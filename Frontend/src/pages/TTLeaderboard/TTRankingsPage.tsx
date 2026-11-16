import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import { Meta, Title } from "@solidjs/meta";
import { Trophy } from "lucide-solid";
import { useTTRankings } from "../../hooks/useTTRankings";
import {
    Button,
    CountryFlag,
    EmptyState,
    InlinePagination,
    LiveRegion,
    QueryError,
    type SkeletonColumn,
    TableSkeleton,
} from "../../components/common";
import ToggleGroup from "../../components/common/ToggleGroup";
import { ShroomlessFilter, TrackCategoryFilter, VehicleFilter } from "../../types/timeTrial";
import { TT_RANKINGS_META } from "../../constants/pageMeta";
import PageHeader from "../../components/common/PageHeader";

// Same columns and padding as the real table, so it does not shift when data arrives.
const RANKING_COLUMNS: SkeletonColumn[] = [
    { header: "Rank", class: "w-16 sm:px-6", bar: "w-8" },
    { header: "Player", class: "sm:px-6", bar: "w-40" },
    { header: "WRs", align: "right", class: "w-24 sm:px-6", bar: "w-6" },
];

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

    // Blank while loading or failed (the skeleton and the error alert announce themselves).
    const resultsMessage = () => {
        const query = rankings.rankingsQuery;
        if (query.isLoading || query.isError || !query.data) return "";
        const total = query.data.totalPlayers;
        if (query.data.players.length === 0) return "No world records in this category yet.";
        return `${total.toLocaleString()} ${total === 1 ? "player" : "players"} with world records.`;
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
                <LiveRegion message={resultsMessage()} />

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
                                    label="Engine class"
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
                                    label="Category type"
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
                                    label="Vehicle type"
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
                                    label="Shroomless"
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
                                    label="Track category"
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
                    <div class="overflow-hidden rounded-lg border border-line bg-canvas">
                        <TableSkeleton
                            label="Loading rankings"
                            columns={RANKING_COLUMNS}
                            rows={rankings.pageSize()}
                            rowClass="h-[3.75rem]"
                        />
                    </div>
                </Show>

                {/* Error */}
                <Show when={rankings.rankingsQuery.isError}>
                    <QueryError
                        title="Couldn't load the rankings"
                        error={rankings.rankingsQuery.error}
                        onRetry={() => rankings.rankingsQuery.refetch()}
                    />
                </Show>

                {/* Rankings Table */}
                <Show when={rankings.rankingsQuery.data && !rankings.rankingsQuery.isLoading}>
                    <div class="bg-canvas rounded-lg border border-line overflow-hidden">
                        <div class="px-4 sm:px-6 py-4 bg-surface border-b border-line">
                            <h2 class="text-xl sm:text-2xl font-semibold text-fg">
                                Player Rankings
                            </h2>
                            <p class="text-fg-subtle text-xs sm:text-sm">
                                {rankings.rankingsQuery.data!.totalPlayers.toLocaleString()} player
                                {rankings.rankingsQuery.data!.totalPlayers !== 1 ? "s" : ""} with
                                world records
                            </p>
                        </div>

                        <Show
                            when={(rankings.rankingsQuery.data?.players.length ?? 0) > 0}
                            fallback={
                                <EmptyState
                                    icon={<Trophy size={40} />}
                                    title="No world records in this category yet"
                                    action={
                                        <Show when={rankings.hasFilters()}>
                                            <Button
                                                variant="secondary"
                                                onClick={rankings.clearFilters}
                                            >
                                                Clear filters
                                            </Button>
                                        </Show>
                                    }
                                >
                                    Try the other engine class, or allow glitches and shortcuts.
                                </EmptyState>
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
