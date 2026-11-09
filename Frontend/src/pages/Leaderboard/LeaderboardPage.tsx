import SearchInput from "../../components/common/SearchInput";
import Select from "../../components/common/Select";
import { createSignal, Show } from "solid-js";
import { RefreshCw, Search, Star, Trophy } from "lucide-solid";
import { Meta, Title } from "@solidjs/meta";
import { useLeaderboard } from "../../hooks";
import { useLegacyLeaderboard } from "../../hooks/useLegacyLeaderboard";
import { useUrlState } from "../../hooks/useUrlState";
import {
    AlertBox,
    Button,
    EmptyState,
    InlinePagination,
    LiveRegion,
    QueryError,
    type SkeletonColumn,
    TableSkeleton,
} from "../../components/common";
import LeaderboardTable from "../../components/ui/leaderboard/LeaderboardTable";
import { VR_LEADERBOARD_META } from "../../constants/pageMeta";
import PageHeader from "../../components/common/PageHeader";

function isVRMultiplierActive(): boolean {
    const now = new Date();
    const year = now.getFullYear();

    const events = [
        { start: new Date(year, 2, 13), end: new Date(year, 2, 17) },
        { start: new Date(year, 3, 10), end: new Date(year, 3, 14) },
        { start: new Date(year, 5, 5), end: new Date(year, 5, 8) },
        { start: new Date(year, 7, 23), end: new Date(year, 7, 29) },
        { start: new Date(year, 9, 25), end: new Date(year, 9, 31) },
        { start: new Date(year, 11, 23), end: new Date(year + 1, 0, 3) },
    ];

    return events.some((event) => {
        const startTime = event.start.setHours(0, 0, 0, 0);
        const endTime = event.end.setHours(23, 59, 59, 999);
        const nowTime = now.getTime();
        return nowTime >= startTime && nowTime <= endTime;
    });
}

// Same widths and breakpoints as LeaderboardTable, so the table does not shift when data arrives.
const CURRENT_COLUMNS: SkeletonColumn[] = [
    { header: "Rank", class: "w-20 sm:w-24", bar: "w-10" },
    { header: "Player", avatar: true, bar: "w-32" },
    { header: "VR", align: "right", class: "w-24 sm:w-28", bar: "w-12" },
    { header: "Friend code", class: "hidden w-44 md:table-cell", bar: "w-32" },
    { header: "Last seen", class: "hidden w-36 md:table-cell", bar: "w-20" },
    { header: "VR change", align: "right", class: "hidden w-32 sm:table-cell", bar: "w-10" },
];
const LEGACY_COLUMNS = CURRENT_COLUMNS.slice(0, 4);

export default function LeaderboardPage() {
    // Which board is showing is part of the URL too (`?legacy=1`), so a link to it works.
    const urlState = useUrlState();
    const showLegacy = () => urlState.get("legacy") === "1";
    const [showVRMultipliers] = createSignal(isVRMultiplierActive());

    const currentLeaderboard = useLeaderboard({ enabled: () => !showLegacy() });
    const legacyLeaderboard = useLegacyLeaderboard({ enabled: () => showLegacy() });

    const activeLeaderboard = () => (showLegacy() ? legacyLeaderboard : currentLeaderboard);
    const hasOtherFilters = () =>
        !showLegacy() &&
        (currentLeaderboard.activeDays() !== null ||
            currentLeaderboard.vehicleFilter() !== undefined);

    // The two boards sort by different columns, so a sort from one means nothing on the other.
    const setLegacy = (legacy: boolean) =>
        urlState.update({ legacy, sort: undefined, dir: undefined }, { resetPage: true });

    // Blank while loading or failed (the skeleton and the error alert announce themselves), so a
    // filter change reads as one sentence once the new results are in.
    const resultsMessage = () => {
        const query = activeLeaderboard().leaderboardQuery;
        if (query.isLoading || query.isError || !query.data) return "";
        const total = query.data.totalCount;
        if (query.data.players.length === 0) return "No players match these filters.";
        return `${total.toLocaleString()} ${total === 1 ? "racer" : "racers"} found.`;
    };

    return (
        <>
            <PageHeader
                page="vr"
                title="VR leaderboard"
                description="Every racer on the Retro WFC servers, ranked by VR, up to 1,000,000. Search by name or friend code, or filter by vehicle and recent activity."
            />
            <div class="space-y-8">
                <Title>{VR_LEADERBOARD_META.title}</Title>
                <Meta name="description" content={VR_LEADERBOARD_META.description} />
                <LiveRegion message={resultsMessage()} />

                {/* VR Multiplier Info */}
                <Show when={showVRMultipliers()}>
                    <AlertBox type="info" icon={<Star size={20} />} title="VR Multipliers Active">
                        <p class="text-sm mb-2">
                            Earn bonus VR during special events and competitive matches!
                        </p>
                        <ul class="text-sm space-y-1 ml-4">
                            <li>
                                • <span class="font-medium">2x VR</span> during special events:
                            </li>
                            <li class="ml-4">- St. Patrick's Day: Mar 13 – Mar 17</li>
                            <li class="ml-4">- MKWii Birthday: Apr 10 – Apr 14</li>
                            <li class="ml-4">- Start of Summer: Jun 5 – Jun 8</li>
                            <li class="ml-4">- End of Summer: Aug 23 – Aug 29</li>
                            <li class="ml-4">- Halloween: Oct 25 – Oct 31</li>
                            <li class="ml-4">- Christmas/New Year: Dec 23 – Jan 3</li>
                            <li>
                                • <span class="font-medium">Up to 1.83x VR</span> in Battle
                                Elimination with 6+ players
                            </li>
                            <li>
                                • <span class="font-medium">Up to 2.83x VR</span> when both
                                multipliers combine!
                            </li>
                        </ul>
                    </AlertBox>
                </Show>

                {/* Control Panel */}
                <div class="bg-canvas rounded-lg border border-line overflow-hidden">
                    {/* Header */}
                    <div class="px-6 py-4 bg-surface border-b border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <h2 class="text-lg font-semibold text-fg">Filters</h2>
                        <div class="flex gap-3 items-center flex-wrap">
                            <Show when={legacyLeaderboard.isAvailable()}>
                                <div class="bg-canvas/50 rounded-lg p-1 flex border border-line-strong">
                                    <button
                                        type="button"
                                        aria-pressed={!showLegacy()}
                                        onClick={() => setLegacy(false)}
                                        class={`px-4 py-1.5 rounded-md font-medium transition-colors text-sm ${
                                            !showLegacy()
                                                ? "bg-accent-soft text-accent-text"
                                                : "text-fg-muted hover:text-gray-900 dark:hover:text-gray-100"
                                        }`}
                                    >
                                        Current
                                    </button>
                                    <button
                                        type="button"
                                        aria-pressed={showLegacy()}
                                        onClick={() => setLegacy(true)}
                                        class={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md font-medium transition-colors text-sm ${
                                            showLegacy()
                                                ? "bg-accent-soft text-accent-text"
                                                : "text-fg-muted hover:text-gray-900 dark:hover:text-gray-100"
                                        }`}
                                    >
                                        <Trophy size={14} />
                                        Legacy
                                    </button>
                                </div>
                            </Show>
                            <button
                                type="button"
                                onClick={activeLeaderboard().refreshLeaderboard}
                                class="bg-accent hover:bg-accent-hover text-accent-fg font-medium py-2 px-5 rounded-lg transition-colors inline-flex items-center justify-center gap-2 text-sm"
                            >
                                <RefreshCw size={14} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    <div class="p-6">
                        {/* Legacy Banner */}
                        <Show when={showLegacy()}>
                            <div class="mb-6">
                                <AlertBox type="warning" title="Viewing Legacy Leaderboard">
                                    <p class="text-sm">Snapshot from before the VR cap expansion</p>
                                </AlertBox>
                            </div>
                        </Show>

                        {/* Search */}
                        <SearchInput
                            id="leaderboard-search"
                            class="mb-5"
                            label="Search players"
                            placeholder="Name or friend code, e.g. 1234-5678-9012…"
                            value={activeLeaderboard().searchQuery()}
                            onValueChange={(v) => activeLeaderboard().handleSearchInput(v)}
                        />

                        {/* Filters */}
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Show when={!showLegacy()}>
                                <Select
                                    label="VR change period"
                                    id="time-period-select"
                                    value={currentLeaderboard.timePeriod()}
                                    onChange={(e) =>
                                        currentLeaderboard.handleTimePeriodChange(e.target.value)
                                    }
                                >
                                    <option value="24">Last 24 hours</option>
                                    <option value="week">Last 7 days</option>
                                    <option value="month">Last 30 days</option>
                                </Select>
                                <Select
                                    label="Active players"
                                    id="active-players-select"
                                    value={currentLeaderboard.activeDays() ?? ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        currentLeaderboard.handleActiveDaysChange(
                                            val === "" ? null : parseInt(val),
                                        );
                                    }}
                                >
                                    <option value="">All time</option>
                                    <option value="7">Last 7 days</option>
                                    <option value="14">Last 14 days</option>
                                    <option value="30">Last 30 days</option>
                                </Select>
                                <div>
                                    <span
                                        id="vehicle-filter-label"
                                        class="block text-sm font-semibold text-fg-muted mb-2"
                                    >
                                        Vehicle
                                    </span>
                                    <div
                                        role="group"
                                        aria-labelledby="vehicle-filter-label"
                                        class="bg-canvas/50 rounded-lg p-1 flex border border-line-strong"
                                    >
                                        <button
                                            type="button"
                                            aria-pressed={
                                                currentLeaderboard.vehicleFilter() === undefined
                                            }
                                            onClick={() =>
                                                currentLeaderboard.handleVehicleFilterChange(
                                                    undefined,
                                                )
                                            }
                                            class={`flex-1 px-4 py-1.5 rounded-md font-medium transition-colors text-sm ${
                                                currentLeaderboard.vehicleFilter() === undefined
                                                    ? "bg-accent-soft text-accent-text"
                                                    : "text-fg-muted hover:text-gray-900 dark:hover:text-gray-100"
                                            }`}
                                        >
                                            All
                                        </button>
                                        <button
                                            type="button"
                                            aria-pressed={
                                                currentLeaderboard.vehicleFilter() === "kart"
                                            }
                                            onClick={() =>
                                                currentLeaderboard.handleVehicleFilterChange("kart")
                                            }
                                            class={`flex-1 px-4 py-1.5 rounded-md font-medium transition-colors text-sm ${
                                                currentLeaderboard.vehicleFilter() === "kart"
                                                    ? "bg-accent-soft text-accent-text"
                                                    : "text-fg-muted hover:text-gray-900 dark:hover:text-gray-100"
                                            }`}
                                        >
                                            Kart
                                        </button>
                                        <button
                                            type="button"
                                            aria-pressed={
                                                currentLeaderboard.vehicleFilter() === "bike"
                                            }
                                            onClick={() =>
                                                currentLeaderboard.handleVehicleFilterChange("bike")
                                            }
                                            class={`flex-1 px-4 py-1.5 rounded-md font-medium transition-colors text-sm ${
                                                currentLeaderboard.vehicleFilter() === "bike"
                                                    ? "bg-accent-soft text-accent-text"
                                                    : "text-fg-muted hover:text-gray-900 dark:hover:text-gray-100"
                                            }`}
                                        >
                                            Bike
                                        </button>
                                    </div>
                                </div>
                            </Show>
                            <Select
                                label="Results per page"
                                id="page-size-select"
                                value={activeLeaderboard().pageSize()}
                                onChange={(e) =>
                                    activeLeaderboard().handlePageSizeChange(
                                        parseInt(e.target.value),
                                    )
                                }
                            >
                                <option value="10">10 players</option>
                                <option value="25">25 players</option>
                                <option value="50">50 players</option>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Loading: placeholder rows the size of the real table, so nothing jumps */}
                <Show when={activeLeaderboard().leaderboardQuery.isLoading}>
                    <div class="overflow-hidden rounded-lg border border-line bg-canvas">
                        <TableSkeleton
                            label="Loading the leaderboard"
                            columns={showLegacy() ? LEGACY_COLUMNS : CURRENT_COLUMNS}
                            rows={activeLeaderboard().pageSize()}
                            rowClass="h-16 sm:h-[4.5rem]"
                            tableClass="table-fixed"
                        />
                    </div>
                </Show>

                {/* Error */}
                <Show when={activeLeaderboard().leaderboardQuery.isError}>
                    <QueryError
                        title="Couldn't load the leaderboard"
                        error={activeLeaderboard().leaderboardQuery.error}
                        onRetry={() => activeLeaderboard().leaderboardQuery.refetch()}
                    />
                </Show>

                {/* Table */}
                <Show
                    when={
                        activeLeaderboard().leaderboardQuery.data &&
                        !activeLeaderboard().leaderboardQuery.isLoading
                    }
                >
                    <div class="bg-canvas rounded-lg border border-line overflow-hidden">
                        <LeaderboardTable
                            players={activeLeaderboard().leaderboardQuery.data!.players}
                            showLegacy={showLegacy()}
                            sortBy={activeLeaderboard().sortBy()}
                            ascending={activeLeaderboard().ascending()}
                            timePeriod={currentLeaderboard.timePeriod()}
                            onSort={activeLeaderboard().handleSort}
                            getVRGain={currentLeaderboard.getVRGain}
                        />

                        {/* Empty */}
                        <Show
                            when={activeLeaderboard().leaderboardQuery.data!.players.length === 0}
                        >
                            <EmptyState
                                icon={<Search size={40} />}
                                title={
                                    activeLeaderboard().search()
                                        ? `No players match "${activeLeaderboard().search()}"`
                                        : "No players match these filters"
                                }
                                action={
                                    <Button
                                        variant="secondary"
                                        onClick={activeLeaderboard().clearFilters}
                                    >
                                        {activeLeaderboard().search() && !hasOtherFilters()
                                            ? "Clear search"
                                            : "Clear search and filters"}
                                    </Button>
                                }
                            >
                                {activeLeaderboard().search()
                                    ? "Check the spelling, or search by friend code (1234-5678-9012)."
                                    : "Try a longer activity window, or show both karts and bikes."}
                            </EmptyState>
                        </Show>

                        {/* Pagination */}
                        <Show when={activeLeaderboard().leaderboardQuery.data!.totalPages > 1}>
                            <InlinePagination
                                currentPage={activeLeaderboard().currentPage()}
                                totalPages={activeLeaderboard().leaderboardQuery.data!.totalPages}
                                pageSize={activeLeaderboard().pageSize()}
                                totalItems={activeLeaderboard().leaderboardQuery.data!.totalCount}
                                onPageChange={activeLeaderboard().setCurrentPage}
                                itemLabel="racers"
                            />
                        </Show>
                    </div>
                </Show>
            </div>
        </>
    );
}
