import { A, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import { Car, Flag, UserX } from "lucide-solid";
import { Meta, Title } from "@solidjs/meta";
import { useTTPlayer } from "../../hooks/useTTPlayer";
import {
    Button,
    CountryFlag,
    EmptyState,
    InlinePagination,
    QueryError,
    SkeletonBar,
    type SkeletonColumn,
    TableSkeleton,
} from "../../components/common";
import TTPlayerFilters from "../../components/ui/timeTrial/TTPlayerFilters";
import TTPlayerStatsCard from "../../components/ui/timeTrial/TTPlayerStatsCard";
import TTPlayerSubmissionsTable from "../../components/ui/timeTrial/TTPlayerSubmissionsTable";
import { DYNAMIC_META_DEFAULTS } from "../../constants/pageMeta";
import PageHeader from "../../components/common/PageHeader";

// Same columns and breakpoints as TTPlayerSubmissionsTable, so it does not shift when data arrives.
const SUBMISSION_COLUMNS: SkeletonColumn[] = [
    { header: "Track", class: "pin-start sm:px-6", bar: "w-28" },
    { header: "Category", class: "sm:px-6", bar: "w-16" },
    { header: "Time", class: "sm:px-6", bar: "w-16" },
    { header: "Fastest Lap", class: "hidden md:table-cell sm:px-6", bar: "w-16" },
    { header: "Character", class: "hidden lg:table-cell sm:px-6", bar: "w-20" },
    { header: "Vehicle", class: "hidden lg:table-cell sm:px-6", bar: "w-24" },
    { header: "Controller", class: "hidden xl:table-cell sm:px-6", bar: "w-20" },
    { header: "Date", class: "hidden xl:table-cell sm:px-6", bar: "w-20" },
    { header: "Actions", align: "right", class: "sm:px-6", bar: "w-8" },
];

export default function TTPlayerProfilePage() {
    const params = useParams();
    const ttPlayer = useTTPlayer(() => Number(params.ttProfileId));

    return (
        <>
            <PageHeader
                page="ttPlayer"
                compact
                crumbs={[{ label: "Time trials", href: "/tt" }]}
                title={ttPlayer.queries.profileQuery.data?.displayName ?? "Player profile"}
                description="Time trial records and submissions for this player."
            />
            <div class="space-y-6">
                <Title>
                    {ttPlayer.queries.profileQuery.data
                        ? `${ttPlayer.queries.profileQuery.data.displayName} | Retro Rewind`
                        : DYNAMIC_META_DEFAULTS.ttPlayerProfile.title}
                </Title>
                <Meta
                    name="description"
                    content={DYNAMIC_META_DEFAULTS.ttPlayerProfile.description}
                />

                {/* Loading */}
                <Show when={ttPlayer.queries.profileQuery.isLoading}>
                    <div
                        class="rounded-lg border border-line bg-canvas p-6"
                        role="status"
                        aria-busy="true"
                    >
                        <span class="sr-only">Loading player profile</span>
                        <div class="flex items-center justify-between gap-6">
                            <div class="space-y-3">
                                <SkeletonBar class="h-7 w-48" />
                                <SkeletonBar class="h-4 w-32" />
                            </div>
                            <SkeletonBar class="h-12 w-16" />
                        </div>
                    </div>
                </Show>

                {/* Not Found */}
                <Show when={ttPlayer.computed.isPlayerNotFound()}>
                    <div class="bg-canvas rounded-lg border border-line p-8">
                        <div class="text-center space-y-4">
                            <div class="flex justify-center text-fg-subtle">
                                <UserX size={56} />
                            </div>
                            <h2 class="text-2xl font-semibold text-fg">Player Not Found</h2>
                            <p class="text-fg-muted">
                                No Time Trial profile found for this player.
                            </p>
                            <p class="text-sm text-gray-500">
                                This player hasn't submitted any times yet.
                            </p>
                            <div class="pt-4">
                                <A
                                    href="/timetrial"
                                    class="bg-accent hover:bg-accent-hover text-accent-fg font-semibold py-2 px-6 rounded-lg transition-colors inline-flex items-center"
                                >
                                    Browse Leaderboards
                                </A>
                            </div>
                        </div>
                    </div>
                </Show>

                {/* Error */}
                <Show
                    when={
                        ttPlayer.queries.profileQuery.isError &&
                        !ttPlayer.computed.isPlayerNotFound()
                    }
                >
                    <QueryError
                        title="Couldn't load this profile"
                        error={ttPlayer.queries.profileQuery.error}
                        onRetry={() => ttPlayer.handlers.refreshAll()}
                    />
                </Show>

                {/* Profile */}
                <Show when={ttPlayer.queries.profileQuery.data}>
                    {(profile) => (
                        <div class="space-y-6">
                            {/* Player Header */}
                            <div class="bg-canvas rounded-lg border border-line p-6">
                                <div class="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                                    <div class="flex items-center space-x-6">
                                        <div>
                                            <div class="flex items-center gap-3 mb-2">
                                                <h2 class="sr-only">{profile().displayName}</h2>
                                                <CountryFlag
                                                    countryAlpha2={profile().countryAlpha2}
                                                    countryName={profile().countryName}
                                                    size="lg"
                                                />
                                            </div>
                                            <div class="text-fg-muted">Time Trial Profile</div>
                                        </div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-5xl font-semibold text-blue-600 dark:text-blue-400 mb-1">
                                            {ttPlayer.computed.worldRecordsHeld()}
                                        </div>
                                        <div class="text-sm font-semibold text-fg-muted">
                                            World Records
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <Show when={ttPlayer.queries.statsQuery.data}>
                                {(stats) => (
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <TTPlayerStatsCard
                                            value={stats().profile.totalSubmissions}
                                            label="Total Submissions"
                                            icon={<Flag size={28} />}
                                            colorScheme="blue"
                                        />
                                        <TTPlayerStatsCard
                                            value={stats().totalTracks}
                                            label="Tracks Played"
                                            icon={<Car size={28} />}
                                            colorScheme="green"
                                        />
                                    </div>
                                )}
                            </Show>

                            {/* Filters */}
                            <TTPlayerFilters
                                selectedCC={ttPlayer.filters.selectedCC()}
                                glitchFilter={ttPlayer.filters.glitchFilter()}
                                vehicleFilter={ttPlayer.filters.vehicleFilter()}
                                shroomlessFilter={ttPlayer.filters.shroomlessFilter()}
                                searchQuery={ttPlayer.filters.searchQuery()}
                                pageSize={ttPlayer.pagination.pageSize()}
                                onCCChange={ttPlayer.handlers.handleCCChange}
                                onGlitchFilterChange={ttPlayer.handlers.handleGlitchFilterChange}
                                onVehicleFilterChange={ttPlayer.handlers.handleVehicleFilterChange}
                                onShroomlessFilterChange={
                                    ttPlayer.handlers.handleShroomlessFilterChange
                                }
                                onSearchInput={ttPlayer.handlers.handleSearchInput}
                                onPageSizeChange={ttPlayer.pagination.handlePageSizeChange}
                            />

                            {/* Submissions Table */}
                            <div class="bg-canvas rounded-lg border border-line overflow-hidden">
                                <div class="px-6 py-4 bg-surface border-b border-line">
                                    <h2 class="text-2xl font-semibold text-fg">All Submissions</h2>
                                    <p class="text-fg-subtle text-sm">
                                        {ttPlayer.computed.totalSubmissions().toLocaleString()}{" "}
                                        submission
                                        {ttPlayer.computed.totalSubmissions() !== 1 ? "s" : ""}
                                    </p>
                                </div>

                                <Show when={ttPlayer.queries.submissionsQuery.isLoading}>
                                    <TableSkeleton
                                        label="Loading submissions"
                                        columns={SUBMISSION_COLUMNS}
                                        rows={ttPlayer.pagination.pageSize()}
                                        rowClass="h-[4.5rem]"
                                    />
                                </Show>

                                <Show when={ttPlayer.queries.submissionsQuery.isError}>
                                    <div class="p-4 sm:p-6">
                                        <QueryError
                                            title="Couldn't load submissions"
                                            error={ttPlayer.queries.submissionsQuery.error}
                                            onRetry={() =>
                                                ttPlayer.queries.submissionsQuery.refetch()
                                            }
                                        />
                                    </div>
                                </Show>

                                <Show
                                    when={
                                        ttPlayer.queries.submissionsQuery.data &&
                                        !ttPlayer.queries.submissionsQuery.isLoading
                                    }
                                >
                                    <Show
                                        when={ttPlayer.computed.filteredSubmissions().length > 0}
                                        fallback={
                                            <EmptyState
                                                icon={<Flag size={40} />}
                                                title={
                                                    ttPlayer.filters.search()
                                                        ? `No submissions on this page match "${ttPlayer.filters.search()}"`
                                                        : "No submissions match these filters"
                                                }
                                                action={
                                                    <Show when={ttPlayer.filters.hasFilters()}>
                                                        <Button
                                                            variant="secondary"
                                                            onClick={ttPlayer.handlers.clearFilters}
                                                        >
                                                            Clear search and filters
                                                        </Button>
                                                    </Show>
                                                }
                                            >
                                                {ttPlayer.filters.search()
                                                    ? "The track search only looks at the page you are on. Try another page, or clear it."
                                                    : "Try a different engine class, or remove the shroomless and vehicle filters."}
                                            </EmptyState>
                                        }
                                    >
                                        <TTPlayerSubmissionsTable
                                            submissions={ttPlayer.computed.filteredSubmissions()}
                                            onDownloadGhost={ttPlayer.handlers.handleDownloadGhost}
                                        />
                                    </Show>

                                    {/* Pagination */}
                                    <Show when={ttPlayer.computed.totalPages() > 1}>
                                        <InlinePagination
                                            currentPage={ttPlayer.pagination.currentPage()}
                                            totalPages={ttPlayer.computed.totalPages()}
                                            pageSize={ttPlayer.pagination.pageSize()}
                                            totalItems={ttPlayer.computed.totalSubmissions()}
                                            onPageChange={ttPlayer.pagination.setCurrentPage}
                                            itemLabel="submissions"
                                        />
                                    </Show>
                                </Show>
                            </div>
                        </div>
                    )}
                </Show>
            </div>
        </>
    );
}
