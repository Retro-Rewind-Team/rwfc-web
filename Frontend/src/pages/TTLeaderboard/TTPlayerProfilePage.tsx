import { A, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import { Car, Flag, TriangleAlert, UserX } from "lucide-solid";
import { Meta, Title } from "@solidjs/meta";
import { useTTPlayer } from "../../hooks/useTTPlayer";
import { CountryFlag, InlinePagination, LoadingSpinner } from "../../components/common";
import { TTPlayerFilters, TTPlayerStatsCard, TTPlayerSubmissionsTable } from "../../components/ui";
import { DYNAMIC_META_DEFAULTS } from "../../constants/pageMeta";
import PageHeader from "../../components/common/PageHeader";

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
                    <div class="bg-canvas rounded-lg border border-line p-6">
                        <div class="flex justify-center items-center py-12 gap-4">
                            <LoadingSpinner />
                            <p class="text-fg-muted">Loading player profile...</p>
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
                    <div class="bg-canvas rounded-lg border border-red-200 dark:border-red-800 p-8">
                        <div class="text-center space-y-4">
                            <div class="flex justify-center text-red-400">
                                <TriangleAlert size={48} />
                            </div>
                            <h2 class="text-2xl font-semibold text-red-900 dark:text-red-100">
                                Error Loading Profile
                            </h2>
                            <button
                                type="button"
                                onClick={() => ttPlayer.handlers.refreshAll()}
                                class="bg-accent hover:bg-accent-hover text-accent-fg font-semibold py-2 px-6 rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
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
                                        {ttPlayer.computed.totalSubmissions()} submission
                                        {ttPlayer.computed.totalSubmissions() !== 1 ? "s" : ""}
                                    </p>
                                </div>

                                <Show when={ttPlayer.queries.submissionsQuery.isLoading}>
                                    <div class="p-12 flex flex-col items-center gap-4">
                                        <LoadingSpinner />
                                        <p class="text-fg-muted">Loading submissions...</p>
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
                                            <div class="p-12 text-center">
                                                <div class="flex justify-center mb-4 text-fg-subtle">
                                                    <Flag size={48} />
                                                </div>
                                                <h3 class="text-xl font-semibold text-fg mb-2">
                                                    No Submissions Found
                                                </h3>
                                                <p class="text-fg-muted">
                                                    Try adjusting your filters
                                                </p>
                                            </div>
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
