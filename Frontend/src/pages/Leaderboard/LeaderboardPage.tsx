import { createSignal, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { useLeaderboard } from "../../hooks";
import { useLegacyLeaderboard } from "../../hooks/useLegacyLeaderboard";
import { formatLastSeen, getVRGainClass } from "../../utils";
import { MiiComponent, VRTierNumberPlate } from "../../components/ui";

export default function LeaderboardPage() {
    const [showLegacy, setShowLegacy] = createSignal(false);

    const currentLeaderboard = useLeaderboard();
    const legacyLeaderboard = useLegacyLeaderboard();

    // Use whichever leaderboard is active
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
                            Track the best Mario Kart Wii racers competing on RWFC servers
                            worldwide
                        </p>
                    </div>

                    {/* Quick Stats Cards - Always show current stats */}
                    <Show when={currentLeaderboard.statsQuery.data}>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 p-6 transition-colors">
                                <div class="text-4xl mb-2">👥</div>
                                <div class="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                                    {currentLeaderboard.statsQuery.data!.totalPlayers.toLocaleString()}
                                </div>
                                <div class="text-gray-600 dark:text-gray-400 font-medium">
                                    Total Racers
                                </div>
                            </div>
                            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 p-6 transition-colors">
                                <div class="text-4xl mb-2">⚡</div>
                                <div class="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                                    {currentLeaderboard.statsQuery.data!.activePlayers.toLocaleString()}
                                </div>
                                <div class="text-gray-600 dark:text-gray-400 font-medium">
                                    Active This Week
                                </div>
                            </div>
                        </div>
                    </Show>
                </div>
            </section>

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

                {/* Legacy Banner (inside panel) */}
                <Show when={showLegacy()}>
                    <div class="mb-6 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-lg p-4">
                        <div class="flex items-start gap-3">
                            <span class="text-2xl">🏆</span>
                            <div>
                                <div class="font-semibold text-amber-800 dark:text-amber-300 mb-1">
                                    Viewing Legacy Leaderboard
                                </div>
                                <p class="text-sm text-amber-700 dark:text-amber-400">
                                    Snapshot from before the VR cap expansion
                                </p>
                            </div>
                        </div>
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
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                    <Show when={!showLegacy()}>
                        <div class="flex items-end">
                            <label class="flex items-center gap-3 cursor-pointer bg-gray-50 dark:bg-gray-700/50 px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full">
                                <input
                                    type="checkbox"
                                    checked={currentLeaderboard.activeOnly()}
                                    onChange={(e) => currentLeaderboard.handleActiveOnlyChange(e.target.checked)}
                                    class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 w-5 h-5"
                                />
                                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Active players only
                                </span>
                            </label>
                        </div>
                    </Show>
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
                <div class="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 rounded-r-lg p-8">
                    <div class="text-center">
                        <div class="text-6xl mb-4">😵</div>
                        <div class="text-red-600 dark:text-red-400 text-xl font-bold mb-2">
                            Couldn't load the leaderboard
                        </div>
                        <p class="text-red-500 dark:text-red-400 mb-6">
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
                </div>
            </Show>

            {/* Leaderboard Table */}
            <Show when={activeLeaderboard().leaderboardQuery.data && !activeLeaderboard().leaderboardQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full table-fixed">
                            <thead class={showLegacy() ? "bg-amber-600 text-white" : "bg-blue-600 text-white"}>
                                <tr>
                                    <th
                                        class={`px-6 py-4 text-center cursor-pointer transition-colors ${
                                            showLegacy() ? "hover:bg-amber-700" : "hover:bg-blue-700"
                                        }`}
                                        onClick={() => activeLeaderboard().handleSort("rank")}
                                    >
                                        <div class="flex items-center justify-center space-x-2">
                                            <span class="font-bold">Rank</span>
                                            <Show when={activeLeaderboard().sortBy() === "rank"}>
                                                <span class="text-sm">{activeLeaderboard().ascending() ? "↑" : "↓"}</span>
                                            </Show>
                                        </div>
                                    </th>
                                    <th class="px-6 py-4 text-center font-bold">User</th>
                                    <th
                                        class={`px-6 py-4 text-center cursor-pointer transition-colors ${
                                            showLegacy() ? "hover:bg-amber-700" : "hover:bg-blue-700"
                                        }`}
                                        onClick={() => activeLeaderboard().handleSort("vr")}
                                    >
                                        <div class="flex items-center justify-center space-x-2">
                                            <span class="font-bold">VR</span>
                                            <Show when={activeLeaderboard().sortBy() === "vr"}>
                                                <span class="text-sm">{activeLeaderboard().ascending() ? "↓" : "↑"}</span>
                                            </Show>
                                        </div>
                                    </th>
                                    <th class="px-6 py-4 text-center hidden md:table-cell font-bold">
                                        Friend Code
                                    </th>
                                    
                                    {/* Show Last Seen only for current leaderboard */}
                                    <Show when={!showLegacy()}>
                                        <th
                                            class="px-6 py-4 text-center cursor-pointer hover:bg-blue-700 transition-colors hidden md:table-cell"
                                            onClick={() => currentLeaderboard.handleSort("lastSeen")}
                                        >
                                            <div class="flex items-center justify-center space-x-2">
                                                <span class="font-bold">Last Seen</span>
                                                <Show when={currentLeaderboard.sortBy() === "lastSeen"}>
                                                    <span class="text-sm">{currentLeaderboard.ascending() ? "↓" : "↑"}</span>
                                                </Show>
                                            </div>
                                        </th>
                                    </Show>

                                    {/* Show VR Change only for current leaderboard */}
                                    <Show when={!showLegacy()}>
                                        <th
                                            class="px-6 py-4 text-center cursor-pointer hover:bg-blue-700 transition-colors"
                                            onClick={() => {
                                                let vrGainField;
                                                if (currentLeaderboard.timePeriod() === "24") {
                                                    vrGainField = "vrgain24";
                                                } else if (currentLeaderboard.timePeriod() === "week") {
                                                    vrGainField = "vrgain7";
                                                } else {
                                                    vrGainField = "vrgain30";
                                                }
                                                currentLeaderboard.handleSort(vrGainField);
                                            }}
                                        >
                                            <div class="flex items-center justify-center space-x-2">
                                                <span class="font-bold">
                                                    VR Change (
                                                    {(() => {
                                                        const period = currentLeaderboard.timePeriod();
                                                        if (period === "24") return "24h";
                                                        if (period === "week") return "7d";
                                                        return "30d";
                                                    })()}
                                                    )
                                                </span>
                                                <Show
                                                    when={(() => {
                                                        const currentTimePeriod = currentLeaderboard.timePeriod();
                                                        let expectedSortField;
                                                        if (currentTimePeriod === "24") {
                                                            expectedSortField = "vrgain24";
                                                        } else if (currentTimePeriod === "week") {
                                                            expectedSortField = "vrgain7";
                                                        } else {
                                                            expectedSortField = "vrgain30";
                                                        }
                                                        return currentLeaderboard.sortBy() === expectedSortField;
                                                    })()}
                                                >
                                                    <span class="text-sm">{currentLeaderboard.ascending() ? "↓" : "↑"}</span>
                                                </Show>
                                            </div>
                                        </th>
                                    </Show>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                <For each={activeLeaderboard().leaderboardQuery.data!.players}>
                                    {(player) => {
                                        const rankToUse = !showLegacy() && currentLeaderboard.activeOnly()
                                            ? player.activeRank
                                            : player.rank;
                                        const vrGain = !showLegacy() ? currentLeaderboard.getVRGain(player) : 0;
                                        const isOnline = !showLegacy() && formatLastSeen(player.lastSeen) === "Now Online";

                                        return (
                                            <tr
                                                class={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${player.isSuspicious ? "bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500" : ""}`}
                                            >
                                                <td class="px-6 py-4 text-center">
                                                    <div class="flex items-center justify-center">
                                                        <VRTierNumberPlate
                                                            rank={rankToUse || player.rank}
                                                            vr={player.vr}
                                                            isSuspicious={player.isSuspicious}
                                                            size="sm"
                                                        />
                                                    </div>
                                                </td>

                                                <td class="px-6 py-4 align-top">
                                                    <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 md:gap-6 w-full">
                                                        <A
                                                            href={`/player/${player.friendCode}`}
                                                            class="flex-shrink-0 mx-auto sm:mx-0"
                                                        >
                                                            <MiiComponent
                                                                playerName={player.name}
                                                                friendCode={player.friendCode}
                                                                size="md"
                                                                className="transition-opacity hover:opacity-80"
                                                                lazy={true}
                                                            />
                                                        </A>

                                                        <div class="w-full sm:flex-1 text-center sm:text-left">
                                                            <A
                                                                href={`/player/${player.friendCode}`}
                                                                class="
                                                                        block font-bold text-lg text-gray-900 dark:text-white
                                                                        hover:text-red-600 dark:hover:text-red-400 transition-colors
                                                                        whitespace-normal break-words
                                                                        "
                                                            >
                                                                {player.name}
                                                            </A>

                                                            <div class="hidden sm:flex space-x-2 mt-1 justify-center sm:justify-start">
                                                                <Show when={!showLegacy() && !player.isActive}>
                                                                    <span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full font-medium">
                                                                        Inactive
                                                                    </span>
                                                                </Show>
                                                                <Show when={player.isSuspicious}>
                                                                    <span class="text-xs bg-red-200 dark:bg-red-800 text-red-600 dark:text-red-400 px-2 py-1 rounded-full font-medium">
                                                                        ⚠️ Suspicious
                                                                    </span>
                                                                </Show>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td class="px-6 py-4 text-center">
                                                    <span class="text-xl font-bold text-gray-900 dark:text-white">
                                                        {player.vr.toLocaleString()}
                                                    </span>
                                                </td>

                                                <td class="px-6 py-4 text-center hidden md:table-cell">
                                                    <code class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-sm font-mono text-gray-900 dark:text-white">
                                                        {player.friendCode}
                                                    </code>
                                                </td>

                                                <Show when={!showLegacy()}>
                                                    <td
                                                        class={`px-6 py-4 text-center hidden md:table-cell font-medium ${isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400"}`}
                                                    >
                                                        {isOnline && (
                                                            <span class="inline-flex items-center">
                                                                <span class="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                                                            </span>
                                                        )}
                                                        {formatLastSeen(player.lastSeen)}
                                                    </td>

                                                    <td class="px-6 py-4 text-center">
                                                        <span
                                                            class={`text-lg font-bold ${getVRGainClass(vrGain)}`}
                                                        >
                                                            {vrGain > 0 ? "+" : ""}
                                                            {vrGain}
                                                        </span>
                                                    </td>
                                                </Show>
                                            </tr>
                                        );
                                    }}
                                </For>
                            </tbody>
                        </table>
                    </div>

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

            {/* FAQ Section */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-8">
                <div class="text-center mb-8">
                    <h3 class="text-3xl font-bold text-gray-900 dark:text-white">
                        Frequently Asked Questions
                    </h3>
                </div>

                <div class="space-y-4 max-w-4xl mx-auto">
                    <details class="bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                        <summary class="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors flex items-center">
                            <span class="mr-3">✨</span>
                            What new features will be added?
                        </summary>
                        <div class="px-6 py-4 border-t-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                            For now no new features are planned, but I will keep the
                            leaderboard updated and maintained. If you have any suggestions or
                            ideas, feel free to reach out to me (Noël) on Discord.
                        </div>
                    </details>

                    <details class="bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                        <summary class="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors flex items-center">
                            <span class="mr-3">🔄</span>
                            How often is the leaderboard updated?
                        </summary>
                        <div class="px-6 py-4 border-t-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                            The leaderboard database updates every minute. Try to refresh the
                            page to see new changes.
                        </div>
                    </details>

                    <details class="bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                        <summary class="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors flex items-center">
                            <span class="mr-3">⚠️</span>
                            Why is some of the data wrong?
                        </summary>
                        <div class="px-6 py-4 border-t-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                            The VR Gain data might be slightly inaccurate due to complex
                            formulas. If your data hasn't been updated since your last race,
                            it probably means you left Retro WFC before your data could get
                            updated. Join a room again and it should be updated accordingly.
                            Also note that there is a gap of about 4 weeks worth of missing
                            data.
                        </div>
                    </details>

                    <details class="bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                        <summary class="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors flex items-center">
                            <span class="mr-3">🔍</span>I can't find my name on the
                            leaderboard. What should I do?
                        </summary>
                        <div class="px-6 py-4 border-t-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                            Make sure to be in an online room for at least a few minutes. If
                            you still can't see your name please contact me (Noël) on Discord.
                        </div>
                    </details>

                    <details class="bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                        <summary class="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors flex items-center">
                            <span class="mr-3">🚨</span>I am placed at the bottom of the
                            leaderboard and displayed in red, why is that?
                        </summary>
                        <div class="px-6 py-4 border-t-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                            It probably means you tried to set your VR to a very high value.
                            If you think I made a mistake, contact me (Noël) on Discord.
                        </div>
                    </details>

                    <Show when={legacyLeaderboard.isAvailable()}>
                        <details class="bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                            <summary class="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors flex items-center">
                                <span class="mr-3">🏆</span>What is the Legacy Leaderboard?
                            </summary>
                            <div class="px-6 py-4 border-t-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                The Legacy Leaderboard is a snapshot of the rankings before the VR cap expansion update. 
                            </div>
                        </details>
                    </Show>
                </div>
            </div>
        </div>
    );
}