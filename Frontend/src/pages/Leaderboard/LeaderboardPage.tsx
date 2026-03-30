import { createSignal, Show } from "solid-js";
import {
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Search,
    Star,
    Trophy,
} from "lucide-solid";
import { useLeaderboard } from "../../hooks";
import { useLegacyLeaderboard } from "../../hooks/useLegacyLeaderboard";
import { AlertBox, LoadingSpinner } from "../../components/common";
import { LeaderboardTable } from "../../components/ui";

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

export default function LeaderboardPage() {
    const [showLegacy, setShowLegacy] = createSignal(false);
    const [showVRMultipliers] = createSignal(isVRMultiplierActive());

    const currentLeaderboard = useLeaderboard();
    const legacyLeaderboard = useLegacyLeaderboard();

    const activeLeaderboard = () =>
        showLegacy() ? legacyLeaderboard : currentLeaderboard;

    return (
        <div class="space-y-8">
            {/* Page Title */}
            <div class="pb-6 border-b border-gray-200 dark:border-gray-700">
                <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          RWFC VR Leaderboard
                </h1>
                <p class="text-lg text-gray-600 dark:text-gray-400">
          Track the best racers competing on RWFC servers worldwide
                </p>
            </div>

            {/* VR Multiplier Info */}
            <Show when={showVRMultipliers()}>
                <AlertBox
                    type="info"
                    icon={<Star size={20} />}
                    title="VR Multipliers Active"
                >
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
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            Search & Filter
                    </h2>

                    <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <Show when={legacyLeaderboard.isAvailable()}>
                            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1 flex border border-gray-200 dark:border-gray-600">
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
                                    class={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                        showLegacy()
                                            ? "bg-amber-600 text-white shadow-sm"
                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                    }`}
                                >
                                    <Trophy size={14} />
                  Legacy
                                </button>
                            </div>
                        </Show>

                        <button
                            onClick={activeLeaderboard().refreshLeaderboard}
                            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg transition-colors inline-flex items-center justify-center gap-2 text-sm"
                        >
                            <RefreshCw size={14} />
              Refresh
                        </button>
                    </div>
                </div>

                {/* Legacy Banner */}
                <Show when={showLegacy()}>
                    <div class="mb-6">
                        <AlertBox type="warning" title="Viewing Legacy Leaderboard">
                            <p class="text-sm">Snapshot from before the VR cap expansion</p>
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
                            <Search size={18} class="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name or friend code..."
                            value={activeLeaderboard().searchQuery()}
                            onInput={(e) =>
                                activeLeaderboard().handleSearchInput(e.target.value)
                            }
                            class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Show when={!showLegacy()}>
                        <div>
                            <label
                                for="time-period-select"
                                class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                            >
                VR Change Period
                            </label>
                            <select
                                id="time-period-select"
                                value={currentLeaderboard.timePeriod()}
                                onChange={(e) =>
                                    currentLeaderboard.handleTimePeriodChange(e.target.value)
                                }
                                class="w-full px-3 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="24">Last 24 hours</option>
                                <option value="week">Last 7 days</option>
                                <option value="month">Last 30 days</option>
                            </select>
                        </div>
                    </Show>
                    <div>
                        <label
                            for="page-size-select"
                            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                        >
              Results Per Page
                        </label>
                        <select
                            id="page-size-select"
                            value={activeLeaderboard().pageSize()}
                            onChange={(e) =>
                                activeLeaderboard().handlePageSizeChange(
                                    parseInt(e.target.value),
                                )
                            }
                            class="w-full px-3 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="10">10 players</option>
                            <option value="25">25 players</option>
                            <option value="50">50 players</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Loading */}
            <Show when={activeLeaderboard().leaderboardQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center gap-4">
                    <LoadingSpinner />
                    <p class="text-gray-600 dark:text-gray-400">
            Loading the fastest racers...
                    </p>
                </div>
            </Show>

            {/* Error */}
            <Show when={activeLeaderboard().leaderboardQuery.isError}>
                <AlertBox type="error">
                    <div class="text-center">
                        <div class="font-bold mb-2">Couldn't load the leaderboard</div>
                        <p class="mb-4 text-sm">
                            {activeLeaderboard().leaderboardQuery.error?.message ||
                "Something went wrong on our end"}
                        </p>
                        <button
                            onClick={() => activeLeaderboard().leaderboardQuery.refetch()}
                            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                        >
              Try Again
                        </button>
                    </div>
                </AlertBox>
            </Show>

            {/* Table */}
            <Show
                when={
                    activeLeaderboard().leaderboardQuery.data &&
          !activeLeaderboard().leaderboardQuery.isLoading
                }
            >
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

                    {/* Empty */}
                    <Show
                        when={
              activeLeaderboard().leaderboardQuery.data!.players.length === 0
                        }
                    >
                        <div class="text-center py-16">
                            <div class="flex justify-center mb-4 text-gray-300 dark:text-gray-600">
                                <Search size={48} />
                            </div>
                            <div class="text-gray-500 dark:text-gray-400 text-xl font-medium mb-2">
                No racers found
                            </div>
                            <p class="text-gray-400 dark:text-gray-500">
                Try adjusting your search or filters
                            </p>
                        </div>
                    </Show>

                    {/* Pagination */}
                    <Show
                        when={activeLeaderboard().leaderboardQuery.data!.totalPages > 1}
                    >
                        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 dark:border-gray-600 gap-2 sm:gap-0">
                            <div class="flex items-center justify-center sm:justify-start gap-2">
                                <button
                                    onClick={() =>
                                        activeLeaderboard().setCurrentPage(
                                            Math.max(1, activeLeaderboard().currentPage() - 1),
                                        )
                                    }
                                    disabled={activeLeaderboard().currentPage() === 1}
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
                                        max={activeLeaderboard().leaderboardQuery.data!.totalPages}
                                        value={activeLeaderboard().currentPage()}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                const val = parseInt(
                                                    (e.target as HTMLInputElement).value,
                                                );
                                                const total =
                          activeLeaderboard().leaderboardQuery.data!.totalPages;
                                                if (!isNaN(val) && val >= 1 && val <= total) {
                                                    activeLeaderboard().setCurrentPage(val);
                                                } else {
                                                    (e.target as HTMLInputElement).value = String(
                                                        activeLeaderboard().currentPage(),
                                                    );
                                                }
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const val = parseInt(e.target.value);
                                            const total =
                        activeLeaderboard().leaderboardQuery.data!.totalPages;
                                            if (!isNaN(val) && val >= 1 && val <= total) {
                                                activeLeaderboard().setCurrentPage(val);
                                            } else {
                                                e.target.value = String(
                                                    activeLeaderboard().currentPage(),
                                                );
                                            }
                                        }}
                                        class="w-16 px-2 py-1 text-center border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                  of {activeLeaderboard().leaderboardQuery.data!.totalPages}
                                </span>
                                <button
                                    onClick={() =>
                                        activeLeaderboard().setCurrentPage(
                                            Math.min(
                        activeLeaderboard().leaderboardQuery.data!.totalPages,
                        activeLeaderboard().currentPage() + 1,
                                            ),
                                        )
                                    }
                                    disabled={
                                        activeLeaderboard().currentPage() ===
                    activeLeaderboard().leaderboardQuery.data!.totalPages
                                    }
                                    class="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                  Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                            <div class="text-sm text-gray-600 dark:text-gray-400 font-medium text-center sm:text-right">
                Showing{" "}
                                {(activeLeaderboard().currentPage() - 1) *
                  activeLeaderboard().pageSize() +
                  1}
                –
                                {Math.min(
                                    activeLeaderboard().currentPage() *
                    activeLeaderboard().pageSize(),
                  activeLeaderboard().leaderboardQuery.data!.totalCount,
                                )}{" "}
                of {activeLeaderboard().leaderboardQuery.data!.totalCount}{" "}
                racers
                            </div>
                        </div>
                    </Show>
                </div>
            </Show>
        </div>
    );
}
