import { A, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import {
    Car,
    ChevronLeft,
    ChevronRight,
    Flag,
    Search,
    SlidersHorizontal,
    TriangleAlert,
    UserX,
} from "lucide-solid";
import { useTTPlayer } from "../../hooks/useTTPlayer";
import { CountryFlag, LoadingSpinner } from "../../components/common";
import {
    TTPlayerStatsCard,
    TTPlayerSubmissionsTable,
} from "../../components/ui";
import { ShroomlessFilter, VehicleFilter } from "../../types/timeTrial";

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
            <Show when={ttPlayer.profileQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                    <div class="flex justify-center items-center py-12 gap-4">
                        <LoadingSpinner />
                        <p class="text-gray-600 dark:text-gray-300">
              Loading player profile...
                        </p>
                    </div>
                </div>
            </Show>

            {/* Not Found */}
            <Show when={ttPlayer.isPlayerNotFound()}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-8">
                    <div class="text-center space-y-4">
                        <div class="flex justify-center text-gray-300 dark:text-gray-600">
                            <UserX size={56} />
                        </div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              Player Not Found
                        </h2>
                        <p class="text-gray-600 dark:text-gray-400">
              No Time Trial profile found for this player.
                        </p>
                        <p class="text-sm text-gray-500">
              This player hasn't submitted any times yet.
                        </p>
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
            <Show
                when={ttPlayer.profileQuery.isError && !ttPlayer.isPlayerNotFound()}
            >
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-red-200 dark:border-red-800 p-8">
                    <div class="text-center space-y-4">
                        <div class="flex justify-center text-red-400">
                            <TriangleAlert size={48} />
                        </div>
                        <h2 class="text-2xl font-bold text-red-900 dark:text-red-100">
              Error Loading Profile
                        </h2>
                        <button
                            onClick={() => ttPlayer.refreshAll()}
                            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                        >
              Try Again
                        </button>
                    </div>
                </div>
            </Show>

            {/* Profile */}
            <Show when={ttPlayer.profileQuery.data}>
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
                                        {ttPlayer.worldRecordsHeld()}
                                    </div>
                                    <div class="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                    World Records
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <Show when={ttPlayer.statsQuery.data}>
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
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                            <div class="flex items-center gap-2 mb-4">
                                <SlidersHorizontal
                                    size={20}
                                    class="text-gray-400 dark:text-gray-500"
                                />
                                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  Filter Submissions
                                </h2>
                            </div>
                            <div class="space-y-4">
                                {/* CC Filter */}
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Engine Class
                                    </label>
                                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1 flex border border-gray-200 dark:border-gray-600">
                                        <button
                                            onClick={() => ttPlayer.handleCCChange(undefined)}
                                            class={`flex-1 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                                ttPlayer.selectedCC() === undefined
                                                    ? "bg-blue-600 text-white shadow-sm"
                                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                            }`}
                                        >
                      All
                                        </button>
                                        <button
                                            onClick={() => ttPlayer.handleCCChange(150)}
                                            class={`flex-1 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                                ttPlayer.selectedCC() === 150
                                                    ? "bg-green-600 text-white shadow-sm"
                                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                            }`}
                                        >
                      150cc
                                        </button>
                                        <button
                                            onClick={() => ttPlayer.handleCCChange(200)}
                                            class={`flex-1 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                                ttPlayer.selectedCC() === 200
                                                    ? "bg-sky-600 text-white shadow-sm"
                                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                            }`}
                                        >
                      200cc
                                        </button>
                                    </div>
                                </div>

                                {/* Glitch Filter */}
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Glitch/Shortcut
                                    </label>
                                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1 flex border border-gray-200 dark:border-gray-600">
                                        <button
                                            onClick={() =>
                                                ttPlayer.handleGlitchFilterChange(undefined)
                                            }
                                            class={`flex-1 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                                ttPlayer.glitchFilter() === undefined
                                                    ? "bg-blue-600 text-white shadow-sm"
                                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                            }`}
                                        >
                      All
                                        </button>
                                        <button
                                            onClick={() => ttPlayer.handleGlitchFilterChange(false)}
                                            class={`flex-1 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                                ttPlayer.glitchFilter() === false
                                                    ? "bg-green-600 text-white shadow-sm"
                                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                            }`}
                                        >
                      Non-Glitch
                                        </button>
                                        <button
                                            onClick={() => ttPlayer.handleGlitchFilterChange(true)}
                                            class={`flex-1 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                                ttPlayer.glitchFilter() === true
                                                    ? "bg-purple-600 text-white shadow-sm"
                                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                            }`}
                                        >
                      Glitch
                                        </button>
                                    </div>
                                </div>

                                {/* Vehicle Filter */}
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Vehicle Type
                                    </label>
                                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1 flex border border-gray-200 dark:border-gray-600">
                                        {(["all", "karts", "bikes"] as VehicleFilter[]).map((v) => (
                                            <button
                                                onClick={() => ttPlayer.handleVehicleFilterChange(v)}
                                                class={`flex-1 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                                    ttPlayer.vehicleFilter() === v
                                                        ? "bg-blue-600 text-white shadow-sm"
                                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                                }`}
                                            >
                                                {v === "all"
                                                    ? "All"
                                                    : v.charAt(0).toUpperCase() + v.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Shroomless Filter */}
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Shroomless
                                    </label>
                                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1 flex border border-gray-200 dark:border-gray-600">
                                        {(["all", "only", "exclude"] as ShroomlessFilter[]).map(
                                            (s) => (
                                                <button
                                                    onClick={() =>
                                                        ttPlayer.handleShroomlessFilterChange(s)
                                                    }
                                                    class={`flex-1 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                                        ttPlayer.shroomlessFilter() === s
                                                            ? "bg-amber-600 text-white shadow-sm"
                                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                                    }`}
                                                >
                                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </div>

                                {/* Track Search */}
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Search Tracks
                                    </label>
                                    <div class="relative">
                                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search size={18} class="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search by track name..."
                                            value={ttPlayer.searchQuery()}
                                            onInput={(e) =>
                                                ttPlayer.handleSearchInput(e.target.value)
                                            }
                                            class="w-full pl-10 pr-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                        />
                                    </div>
                                </div>

                                {/* Results Per Page */}
                                <div>
                                    <label
                                        for="player-page-size"
                                        class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                                    >
                    Results Per Page
                                    </label>
                                    <select
                                        id="player-page-size"
                                        value={ttPlayer.pageSize()}
                                        onChange={(e) =>
                                            ttPlayer.handlePageSizeChange(parseInt(e.target.value))
                                        }
                                        class="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="10">10 submissions</option>
                                        <option value="25">25 submissions</option>
                                        <option value="50">50 submissions</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Submissions Table */}
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div class="bg-blue-600 px-6 py-4">
                                <h2 class="text-2xl font-bold text-white">All Submissions</h2>
                                <p class="text-blue-100 text-sm">
                                    {ttPlayer.totalSubmissions()} submission
                                    {ttPlayer.totalSubmissions() !== 1 ? "s" : ""}
                                </p>
                            </div>

                            <Show when={ttPlayer.submissionsQuery.isLoading}>
                                <div class="p-12 flex flex-col items-center gap-4">
                                    <LoadingSpinner />
                                    <p class="text-gray-600 dark:text-gray-400">
                    Loading submissions...
                                    </p>
                                </div>
                            </Show>

                            <Show
                                when={
                                    ttPlayer.submissionsQuery.data &&
                  !ttPlayer.submissionsQuery.isLoading
                                }
                            >
                                <Show
                                    when={ttPlayer.filteredSubmissions().length > 0}
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
                                        submissions={ttPlayer.filteredSubmissions()}
                                        onDownloadGhost={(submission) =>
                                            ttPlayer.handleDownloadGhost(submission.id)
                                        }
                                    />
                                </Show>

                                {/* Pagination */}
                                <Show when={ttPlayer.totalPages() > 1}>
                                    <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 dark:border-gray-600 gap-2 sm:gap-0">
                                        <div class="flex items-center justify-center sm:justify-start gap-2">
                                            <button
                                                onClick={() =>
                                                    ttPlayer.setCurrentPage(
                                                        Math.max(1, ttPlayer.currentPage() - 1),
                                                    )
                                                }
                                                disabled={ttPlayer.currentPage() === 1}
                                                class="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronLeft size={16} />
                        Previous
                                            </button>
                                            <span class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                        Page
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={ttPlayer.totalPages()}
                                                    value={ttPlayer.currentPage()}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            const val = parseInt(
                                                                (e.target as HTMLInputElement).value,
                                                            );
                                                            if (
                                                                !isNaN(val) &&
                                val >= 1 &&
                                val <= ttPlayer.totalPages()
                                                            ) {
                                                                ttPlayer.setCurrentPage(val);
                                                            } else {
                                                                (e.target as HTMLInputElement).value = String(
                                                                    ttPlayer.currentPage(),
                                                                );
                                                            }
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        if (
                                                            !isNaN(val) &&
                              val >= 1 &&
                              val <= ttPlayer.totalPages()
                                                        ) {
                                                            ttPlayer.setCurrentPage(val);
                                                        } else {
                                                            e.target.value = String(ttPlayer.currentPage());
                                                        }
                                                    }}
                                                    class="w-16 px-2 py-1 text-center border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                        of {ttPlayer.totalPages()}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    ttPlayer.setCurrentPage(
                                                        Math.min(
                                                            ttPlayer.totalPages(),
                                                            ttPlayer.currentPage() + 1,
                                                        ),
                                                    )
                                                }
                                                disabled={
                                                    ttPlayer.currentPage() === ttPlayer.totalPages()
                                                }
                                                class="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                        Next
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                        <div class="text-sm text-gray-600 dark:text-gray-400 font-medium text-center sm:text-right">
                      Showing{" "}
                                            {(ttPlayer.currentPage() - 1) * ttPlayer.pageSize() + 1}–
                                            {Math.min(
                                                ttPlayer.currentPage() * ttPlayer.pageSize(),
                                                ttPlayer.totalSubmissions(),
                                            )}{" "}
                      of {ttPlayer.totalSubmissions()} submissions
                                        </div>
                                    </div>
                                </Show>
                            </Show>
                        </div>
                    </div>
                )}
            </Show>
        </div>
    );
}
