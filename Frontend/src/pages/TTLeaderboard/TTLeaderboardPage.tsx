import { Show } from "solid-js";
import { useTTLeaderboard } from "../../hooks/useTTLeaderboard";
import { AlertBox, LoadingSpinner } from "../../components/common";
import { TTFilters, TTLeaderboardTable, TTTrackList, TTWorldRecordCard, TTWRHistory } from "../../components/ui";

export default function TTLeaderboardPage() {
    const ttLeaderboard = useTTLeaderboard();

    return (
        <div class="space-y-8">
            {/* Hero Header Section */}
            <section class="py-12">
                <div class="max-w-4xl mx-auto text-center">
                    <h1 class="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Time Trial Leaderboards
                    </h1>
                    <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Top times for Retro Rewind's custom and retro tracks
                    </p>
                </div>
            </section>

            {/* Category Selection */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <div class="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    {/* Category Toggle */}
                    <div class="flex-1">
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Track Category
                        </label>
                        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                            <button
                                onClick={() => ttLeaderboard.handleCategoryChange("retro")}
                                class={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${
                                    ttLeaderboard.selectedCategory() === "retro"
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                🏁 Retro Tracks
                            </button>
                            <button
                                onClick={() => ttLeaderboard.handleCategoryChange("custom")}
                                class={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${
                                    ttLeaderboard.selectedCategory() === "custom"
                                        ? "bg-purple-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                ⭐ Custom Tracks
                            </button>
                        </div>
                    </div>

                    {/* Refresh Button */}
                    <div class="flex-shrink-0">
                        <button
                            onClick={ttLeaderboard.refreshLeaderboard}
                            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Track Search */}
                <div class="mt-4">
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Search Tracks
                    </label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by track name..."
                            value={ttLeaderboard.searchQuery()}
                            onInput={(e) => ttLeaderboard.handleSearchInput(e.target.value)}
                            class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column: Track List */}
                <div class="lg:col-span-1">
                    <TTTrackList
                        tracks={ttLeaderboard.filteredTracks()}
                        selectedTrack={ttLeaderboard.selectedTrack()}
                        category={ttLeaderboard.selectedCategory()}
                        isLoading={ttLeaderboard.tracksQuery.isLoading}
                        isError={ttLeaderboard.tracksQuery.isError}
                        onTrackSelect={ttLeaderboard.handleTrackSelect}
                    />
                </div>

                {/* Middle Column: Filters */}
                <div class="lg:col-span-1">
                    <TTFilters
                        selectedCC={ttLeaderboard.selectedCC()}
                        vehicleFilter={ttLeaderboard.vehicleFilter()}
                        driftFilter={ttLeaderboard.driftFilter()}
                        categoryFilter={ttLeaderboard.categoryFilter()}
                        pageSize={ttLeaderboard.pageSize()}
                        category={ttLeaderboard.selectedCategory()}
                        onCCChange={ttLeaderboard.handleCCChange}
                        onVehicleFilterChange={ttLeaderboard.handleVehicleFilterChange}
                        onDriftFilterChange={ttLeaderboard.handleDriftFilterChange}
                        onCategoryFilterChange={ttLeaderboard.handleCategoryFilterChange}
                        onPageSizeChange={ttLeaderboard.handlePageSizeChange}
                    />
                </div>

                {/* Right Column: Leaderboard */}
                <div class="lg:col-span-2">
                    <Show when={!ttLeaderboard.selectedTrack()}>
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-12 text-center">
                            <div class="text-6xl mb-4">🏁</div>
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Select a Track
                            </h3>
                            <p class="text-gray-600 dark:text-gray-400">
                Choose a track from the list to view its leaderboard
                            </p>
                        </div>
                    </Show>

                    <Show when={ttLeaderboard.selectedTrack()}>
                        <div class="space-y-6">
                            {/* World Record Card */}
                            <TTWorldRecordCard
                                worldRecord={ttLeaderboard.worldRecordQuery.data}
                                isLoading={ttLeaderboard.worldRecordQuery.isLoading}
                                isError={ttLeaderboard.worldRecordQuery.isError}
                                onDownloadGhost={ttLeaderboard.handleDownloadGhost}
                            />

                            {/* World Record History */}
                            <TTWRHistory
                                history={ttLeaderboard.wrHistoryQuery.data}
                                isLoading={ttLeaderboard.wrHistoryQuery.isLoading}
                                isError={ttLeaderboard.wrHistoryQuery.isError}
                                onDownloadGhost={ttLeaderboard.handleDownloadGhost}
                            />

                            {/* Leaderboard */}
                            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                                {/* Header */}
                                <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <h2 class="text-2xl font-bold text-white mb-1">
                                                {ttLeaderboard.selectedTrack()!.name}
                                            </h2>
                                            <div class="flex items-center gap-4 text-sm text-blue-100">
                                                <span>{ttLeaderboard.selectedCC()}cc</span>
                                                <span>•</span>
                                                <span>{ttLeaderboard.selectedTrack()!.laps} lap{ttLeaderboard.selectedTrack()!.laps !== 1 ? "s" : ""}</span>
                                                <span>•</span>
                                                <span class="capitalize">{ttLeaderboard.selectedCategory()} Track</span>
                                            </div>
                                        </div>
    
                                        {/* FLAP Display */}
                                        <Show when={ttLeaderboard.leaderboardQuery.data?.fastestLapDisplay}>
                                            <div class="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                                                <div class="text-xs text-blue-100 uppercase tracking-wide font-semibold mb-1">
          Track FLAP
                                                </div>
                                                <div class="text-2xl font-black text-green-300">
                                                    {ttLeaderboard.leaderboardQuery.data!.fastestLapDisplay}
                                                </div>
                                            </div>
                                        </Show>
                                    </div>
                                </div>

                                {/* Loading State */}
                                <Show when={ttLeaderboard.leaderboardQuery.isLoading}>
                                    <div class="p-12 text-center">
                                        <LoadingSpinner />
                                        <p class="mt-4 text-gray-600 dark:text-gray-400">
                      Loading times...
                                        </p>
                                    </div>
                                </Show>

                                {/* Error State */}
                                <Show when={ttLeaderboard.leaderboardQuery.isError}>
                                    <div class="p-6">
                                        <AlertBox type="error" icon="⚠️">
                      Failed to load leaderboard
                                        </AlertBox>
                                    </div>
                                </Show>

                                {/* Leaderboard Table */}
                                <Show when={ttLeaderboard.leaderboardQuery.data && !ttLeaderboard.leaderboardQuery.isLoading}>
                                    <Show
                                        when={ttLeaderboard.filteredSubmissions().length > 0}
                                        fallback={
                                            <div class="p-12 text-center">
                                                <div class="text-6xl mb-4">🏆</div>
                                                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          No Times Found
                                                </h3>
                                                <p class="text-gray-600 dark:text-gray-400">
                          Try adjusting your filters or be the first to submit a time!
                                                </p>
                                            </div>
                                        }
                                    >
                                        <TTLeaderboardTable
                                            submissions={ttLeaderboard.filteredSubmissions()}
                                            fastestLapMs={ttLeaderboard.leaderboardQuery.data?.fastestLapMs || null}
                                            onDownloadGhost={ttLeaderboard.handleDownloadGhost}
                                        />
                                    </Show>

                                    {/* Pagination */}
                                    <Show when={ttLeaderboard.leaderboardQuery.data!.totalSubmissions > ttLeaderboard.pageSize()}>
                                        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t-2 border-gray-200 dark:border-gray-600 gap-2 sm:gap-0">
                                            <div class="flex items-center justify-center sm:justify-start gap-2">
                                                <button
                                                    onClick={() => ttLeaderboard.setCurrentPage(Math.max(1, ttLeaderboard.currentPage() - 1))}
                                                    disabled={ttLeaderboard.currentPage() === 1}
                                                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                          ← Previous
                                                </button>
                                                <span class="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium border-2 border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          Page {ttLeaderboard.currentPage()} of {Math.ceil(ttLeaderboard.leaderboardQuery.data!.totalSubmissions / ttLeaderboard.pageSize())}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        ttLeaderboard.setCurrentPage(
                                                            Math.min(
                                                                Math.ceil(ttLeaderboard.leaderboardQuery.data!.totalSubmissions / ttLeaderboard.pageSize()),
                                                                ttLeaderboard.currentPage() + 1
                                                            )
                                                        )
                                                    }
                                                    disabled={ttLeaderboard.currentPage() === Math.ceil(ttLeaderboard.leaderboardQuery.data!.totalSubmissions / ttLeaderboard.pageSize())}
                                                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                          Next →
                                                </button>
                                            </div>

                                            <div class="text-sm text-gray-600 dark:text-gray-400 font-medium text-center sm:text-right">
                        Showing {(ttLeaderboard.currentPage() - 1) * ttLeaderboard.pageSize() + 1} –{" "}
                                                {Math.min(ttLeaderboard.currentPage() * ttLeaderboard.pageSize(), ttLeaderboard.leaderboardQuery.data!.totalSubmissions)} of {ttLeaderboard.leaderboardQuery.data!.totalSubmissions} times
                                            </div>
                                        </div>
                                    </Show>
                                </Show>
                            </div>
                        </div>
                    </Show>
                </div>
            </div>
        </div>
    );
}