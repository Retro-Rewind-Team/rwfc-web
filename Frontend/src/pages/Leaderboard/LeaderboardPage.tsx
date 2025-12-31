import { createSignal, Show } from "solid-js";
import { useLeaderboard } from "../../hooks";
import { useLegacyLeaderboard } from "../../hooks/useLegacyLeaderboard";
import { AlertBox } from "../../components/common";
import { LeaderboardTable } from "../../components/ui";

export default function LeaderboardPage() {
    const [showLegacy, setShowLegacy] = createSignal(false);

    const currentLeaderboard = useLeaderboard();
    const legacyLeaderboard = useLegacyLeaderboard();

    const activeLeaderboard = () => 
        showLegacy() ? legacyLeaderboard : currentLeaderboard;

    return (
        <div class="space-y-8">
            {/* Hero Header Section */}
            <section class="py-12">
                <div class="max-w-4xl mx-auto text-center">
                    <div class="mb-8">
                        <h1 class="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
                            RWFC VR Leaderboard
                        </h1>
                        <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Track the best racers competing on RWFC servers
                            worldwide
                        </p>
                    </div>
                </div>
            </section>

            {/* VR Multiplier Info */}
            <div class="mb-6">
                <AlertBox type="info" icon="⭐">
                    <div>
                        <div class="font-semibold mb-1">
                            VR Multipliers Active
                        </div>
                        <p class="text-sm mb-2">
                            Earn bonus VR during special events and competitive matches!
                        </p>
                        <ul class="text-sm space-y-1 ml-4">
                            <li>• <span class="font-medium">2x VR</span> during special events:</li>
                            <li class="ml-4">- St. Patrick's Day: Mar 13 - Mar 17</li>
                            <li class="ml-4">- MKWii Birthday: Apr 10 - Apr 14</li>
                            <li class="ml-4">- Start of Summer: Jun 5 - Jun 8</li>
                            <li class="ml-4">- End of Summer: Aug 23 - Aug 29</li>
                            <li class="ml-4">- Halloween: Oct 25 - Oct 31</li>
                            <li class="ml-4">- Christmas/New Year: Dec 23 - Jan 3</li>
                            <li>• <span class="font-medium">Up to 1.83x VR</span> in Battle Elimination with 6+ players</li>
                            <li>• <span class="font-medium">Up to 2.83x VR</span> when both multipliers combine!</li>
                        </ul>
                    </div>
                </AlertBox>
            </div>

            {/* Unified Control Panel */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                {/* Header Row: Title + Actions */}
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
                    <div class="flex items-center">
                        <span class="text-3xl mr-3">🎮</span>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                            Search & Filter
                        </h2>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <Show when={legacyLeaderboard.isAvailable()}>
                            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                                <button
                                    onClick={() => setShowLegacy(false)}
                                    class={`px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                        !showLegacy()
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                    }`}
                                >
                                    Current
                                </button>
                                <button
                                    onClick={() => setShowLegacy(true)}
                                    class={`px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                        showLegacy()
                                            ? "bg-amber-600 text-white shadow-sm"
                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                    }`}
                                >
                                    🏆 Legacy
                                </button>
                            </div>
                        </Show>

                        <button
                            onClick={activeLeaderboard().refreshLeaderboard}
                            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Legacy Banner */}
                <Show when={showLegacy()}>
                    <div class="mb-6">
                        <AlertBox type="warning" icon="🏆">
                            <div>
                                <div class="font-semibold mb-1">
                                    Viewing Legacy Leaderboard
                                </div>
                                <p class="text-sm">
                                    Snapshot from before the VR cap expansion
                                </p>
                            </div>
                        </AlertBox>
                    </div>
                </Show>

                {/* Search */}
                <div class="mb-5">
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Search Players
                    </label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name or friend code..."
                            value={activeLeaderboard().searchQuery()}
                            onInput={(e) => activeLeaderboard().handleSearchInput(e.target.value)}
                            class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Show when={!showLegacy()}>
                        <div>
                            <label for="time-period-select" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                VR Change Period
                            </label>
                            <select
                                id="time-period-select"
                                value={currentLeaderboard.timePeriod()}
                                onChange={(e) => currentLeaderboard.handleTimePeriodChange(e.target.value)}
                                class="w-full px-3 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="24">Last 24 hours</option>
                                <option value="week">Last 7 days</option>
                                <option value="month">Last 30 days</option>
                            </select>
                        </div>
                    </Show>

                    <div>
                        <label for="page-size-select" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Results Per Page
                        </label>
                        <select
                            id="page-size-select"
                            value={activeLeaderboard().pageSize()}
                            onChange={(e) => activeLeaderboard().handlePageSizeChange(parseInt(e.target.value))}
                            class="w-full px-3 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="10">10 players</option>
                            <option value="25">25 players</option>
                            <option value="50">50 players</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            <Show when={activeLeaderboard().leaderboardQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-12 text-center">
                    <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
                    <p class="text-lg text-gray-600 dark:text-gray-400">
                        Loading the fastest racers...
                    </p>
                </div>
            </Show>

            {/* Error State */}
            <Show when={activeLeaderboard().leaderboardQuery.isError}>
                <AlertBox type="error" icon="😵">
                    <div class="text-center">
                        <div class="text-xl font-bold mb-2">
                            Couldn't load the leaderboard
                        </div>
                        <p class="mb-6">
                            {activeLeaderboard().leaderboardQuery.error?.message ||
                                "Something went wrong on our end"}
                        </p>
                        <button
                            onClick={() => activeLeaderboard().leaderboardQuery.refetch()}
                            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </AlertBox>
            </Show>

            {/* Leaderboard Table */}
            <Show when={activeLeaderboard().leaderboardQuery.data && !activeLeaderboard().leaderboardQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                    <LeaderboardTable
                        players={activeLeaderboard().leaderboardQuery.data!.players}
                        showLegacy={showLegacy()}
                        sortBy={activeLeaderboard().sortBy()}
                        ascending={activeLeaderboard().ascending()}
                        timePeriod={currentLeaderboard.timePeriod()}
                        onSort={activeLeaderboard().handleSort}
                        getVRGain={currentLeaderboard.getVRGain}
                    />

                    {/* No Results */}
                    <Show when={activeLeaderboard().leaderboardQuery.data!.players.length === 0}>
                        <div class="text-center py-16">
                            <div class="text-6xl mb-4">🔍</div>
                            <div class="text-gray-500 dark:text-gray-400 text-xl font-medium mb-2">
                                No racers found
                            </div>
                            <p class="text-gray-400 dark:text-gray-500">
                                Try adjusting your search or filters
                            </p>
                        </div>
                    </Show>

                    {/* Pagination */}
                    <Show when={activeLeaderboard().leaderboardQuery.data!.totalPages > 1}>
                        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t-2 border-gray-200 dark:border-gray-600 gap-2 sm:gap-0">
                            <div class="flex items-center justify-center sm:justify-start gap-2">
                                <button
                                    onClick={() => activeLeaderboard().setCurrentPage(Math.max(1, activeLeaderboard().currentPage() - 1))}
                                    disabled={activeLeaderboard().currentPage() === 1}
                                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    ← Previous
                                </button>
                                <span class="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium border-2 border-gray-200 dark:border-gray-600 whitespace-nowrap">
                                    Page {activeLeaderboard().currentPage()} of {activeLeaderboard().leaderboardQuery.data!.totalPages}
                                </span>
                                <button
                                    onClick={() =>
                                        activeLeaderboard().setCurrentPage(
                                            Math.min(
                                                activeLeaderboard().leaderboardQuery.data!.totalPages,
                                                activeLeaderboard().currentPage() + 1
                                            )
                                        )
                                    }
                                    disabled={activeLeaderboard().currentPage() === activeLeaderboard().leaderboardQuery.data!.totalPages}
                                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next →
                                </button>
                            </div>

                            <div class="text-sm text-gray-600 dark:text-gray-400 font-medium text-center sm:text-right">
                                Showing {(activeLeaderboard().currentPage() - 1) * activeLeaderboard().pageSize() + 1} –{" "}
                                {Math.min(activeLeaderboard().currentPage() * activeLeaderboard().pageSize(), activeLeaderboard().leaderboardQuery.data!.totalCount)} of {activeLeaderboard().leaderboardQuery.data!.totalCount} racers
                            </div>
                        </div>
                    </Show>
                </div>
            </Show>
        </div>
    );
}