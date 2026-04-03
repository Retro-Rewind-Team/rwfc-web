import { A, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import { Car, ChevronLeft, Flag, TriangleAlert, UserX } from "lucide-solid";
import { useTTPlayer } from "../../hooks/useTTPlayer";
import { CountryFlag, InlinePagination, LoadingSpinner } from "../../components/common";
import {
    TTPlayerFilters,
    TTPlayerStatsCard,
    TTPlayerSubmissionsTable,
} from "../../components/ui";

export default function TTPlayerProfilePage() {
    const params = useParams();
    const ttPlayer = useTTPlayer(Number(params.ttProfileId));

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

            {/* Loading */}
            <Show when={ttPlayer.queries.profileQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                    <div class="flex justify-center items-center py-12 gap-4">
                        <LoadingSpinner />
                        <p class="text-gray-600 dark:text-gray-300">Loading player profile...</p>
                    </div>
                </div>
            </Show>

            {/* Not Found */}
            <Show when={ttPlayer.computed.isPlayerNotFound()}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-8">
                    <div class="text-center space-y-4">
                        <div class="flex justify-center text-gray-300 dark:text-gray-600">
                            <UserX size={56} />
                        </div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Player Not Found</h2>
                        <p class="text-gray-600 dark:text-gray-400">
                            No Time Trial profile found for this player.
                        </p>
                        <p class="text-sm text-gray-500">This player hasn't submitted any times yet.</p>
                        <div class="pt-4">
                            <A
                                href="/timetrial"
                                class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors inline-flex items-center"
                            >
                                Browse Leaderboards
                            </A>
                        </div>
                    </div>
                </div>
            </Show>

            {/* Error */}
            <Show when={ttPlayer.queries.profileQuery.isError && !ttPlayer.computed.isPlayerNotFound()}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-red-200 dark:border-red-800 p-8">
                    <div class="text-center space-y-4">
                        <div class="flex justify-center text-red-400">
                            <TriangleAlert size={48} />
                        </div>
                        <h2 class="text-2xl font-bold text-red-900 dark:text-red-100">
                            Error Loading Profile
                        </h2>
                        <button
                            type="button"
                            onClick={() => ttPlayer.handlers.refreshAll()}
                            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
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
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                            <div class="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                                <div class="flex items-center space-x-6">
                                    <div>
                                        <div class="flex items-center gap-3 mb-2">
                                            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                                                {profile().displayName}
                                            </h1>
                                            <CountryFlag
                                                countryAlpha2={profile().countryAlpha2}
                                                countryName={profile().countryName}
                                                size="lg"
                                            />
                                        </div>
                                        <div class="text-gray-600 dark:text-gray-300">
                                            Time Trial Profile
                                        </div>
                                    </div>
                                </div>
                                <div class="text-center">
                                    <div class="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                                        {ttPlayer.computed.worldRecordsHeld()}
                                    </div>
                                    <div class="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
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
                            onShroomlessFilterChange={ttPlayer.handlers.handleShroomlessFilterChange}
                            onSearchInput={ttPlayer.handlers.handleSearchInput}
                            onPageSizeChange={ttPlayer.pagination.handlePageSizeChange}
                        />

                        {/* Submissions Table */}
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div class="bg-blue-600 px-6 py-4">
                                <h2 class="text-2xl font-bold text-white">All Submissions</h2>
                                <p class="text-blue-100 text-sm">
                                    {ttPlayer.computed.totalSubmissions()} submission
                                    {ttPlayer.computed.totalSubmissions() !== 1 ? "s" : ""}
                                </p>
                            </div>

                            <Show when={ttPlayer.queries.submissionsQuery.isLoading}>
                                <div class="p-12 flex flex-col items-center gap-4">
                                    <LoadingSpinner />
                                    <p class="text-gray-600 dark:text-gray-400">Loading submissions...</p>
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
                                            <div class="flex justify-center mb-4 text-gray-300 dark:text-gray-600">
                                                <Flag size={48} />
                                            </div>
                                            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                No Submissions Found
                                            </h3>
                                            <p class="text-gray-600 dark:text-gray-400">
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
    );
}
