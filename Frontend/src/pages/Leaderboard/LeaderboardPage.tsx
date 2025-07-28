import { Show, For } from "solid-js";
import { A } from "@solidjs/router";
import { useLeaderboard } from "../../hooks";
import { formatLastSeen, getVRGainClass } from "../../utils";
import { MiiComponent, VRTierNumberPlate } from "../../components/ui";

export default function LeaderboardPage() {
  const {
    // State
    currentPage,
    pageSize,
    activeOnly,
    sortBy,
    ascending,
    searchQuery,
    timePeriod,

    // Queries
    statsQuery,
    leaderboardQuery,

    // Handlers
    handleSearchInput,
    handleSort,
    handleActiveOnlyChange,
    handleTimePeriodChange,
    handlePageSizeChange,
    getVRGain,
    refreshLeaderboard,

    // Setters
    setCurrentPage,
  } = useLeaderboard();

  return (
    <div class="space-y-8">
      {/* Hero Header Section */}
      <section class="text-center py-12">
        <div class="max-w-4xl mx-auto">
          <h1 class="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 transition-colors">
            <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              RWFC VR Leaderboard
            </span>
          </h1>
          <p class="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto transition-colors">
            Track the best Mario Kart Wii racers competing on RWFC servers
            worldwide
          </p>

          {/* Quick Stats Cards */}
          <Show when={statsQuery.data}>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl dark:shadow-gray-900/20 p-6 transition-all">
                <div class="text-4xl mb-2">👥</div>
                <div class="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {statsQuery.data!.totalPlayers.toLocaleString()}
                </div>
                <div class="text-gray-600 dark:text-gray-300 font-medium">
                  Total Racers
                </div>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl dark:shadow-gray-900/20 p-6 transition-all">
                <div class="text-4xl mb-2">⚡</div>
                <div class="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {statsQuery.data!.activePlayers.toLocaleString()}
                </div>
                <div class="text-gray-600 dark:text-gray-300 font-medium">
                  Active This Week
                </div>
              </div>
            </div>
          </Show>

          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={refreshLeaderboard}
              class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Refresh Rankings</span>
            </button>
          </div>
        </div>
      </section>

      {/* Search and Filters Card */}
      <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800 transition-colors">
        <div class="flex items-center mb-6">
          <span class="text-3xl mr-3">🔍</span>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            Find Users
          </h2>
        </div>

        <div class="space-y-6">
          <div>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  class="h-6 w-6 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name or friend code..."
                value={searchQuery()}
                onInput={(e) => handleSearchInput(e.target.value)}
                class="w-full px-4 py-4 pl-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label
                for="time-period-select"
                class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Time Period (VR Change)
              </label>
              <select
                id="time-period-select"
                value={timePeriod()}
                onChange={(e) => handleTimePeriodChange(e.target.value)}
                class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
              >
                <option value="24">Last 24h</option>
                <option value="week">Last 7d</option>
                <option value="month">Last 30d</option>
              </select>
            </div>

            <div>
              <label
                for="page-size-select"
                class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Results Per Page
              </label>
              <select
                id="page-size-select"
                value={pageSize()}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>

            <div class="sm:col-span-2 lg:col-span-2 flex items-end">
              <label class="flex items-center space-x-3 cursor-pointer bg-white dark:bg-gray-700 px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all w-full">
                <input
                  type="checkbox"
                  checked={activeOnly()}
                  onChange={(e) => handleActiveOnlyChange(e.target.checked)}
                  class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700 w-5 h-5"
                />
                <span class="text-base font-semibold text-gray-700 dark:text-gray-300">
                  Show active players only
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      <Show when={leaderboardQuery.isLoading}>
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
          <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p class="text-lg text-gray-600 dark:text-gray-400">
            Loading the fastest racers...
          </p>
        </div>
      </Show>

      {/* Error State */}
      <Show when={leaderboardQuery.isError}>
        <div class="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl shadow-lg p-8 border border-red-200 dark:border-red-800">
          <div class="text-center">
            <div class="text-6xl mb-4">😵</div>
            <div class="text-red-600 dark:text-red-400 text-xl font-bold mb-2">
              Couldn't load the leaderboard
            </div>
            <p class="text-red-500 dark:text-red-400 mb-6">
              {leaderboardQuery.error?.message ||
                "Something went wrong on our end"}
            </p>
            <button
              onClick={() => leaderboardQuery.refetch()}
              class="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105"
            >
              Try Again
            </button>
          </div>
        </div>
      </Show>

      {/* Leaderboard Table */}
      <Show when={leaderboardQuery.data && !leaderboardQuery.isLoading}>
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/20 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th
                    class="px-6 py-4 text-center cursor-pointer hover:bg-blue-700/50 transition-colors"
                    onClick={() => handleSort("rank")}
                  >
                    <div class="flex items-center justify-center space-x-2">
                      <span class="font-bold">Rank</span>
                      <Show when={sortBy() === "rank"}>
                        <span class="text-sm">{ascending() ? "↑" : "↓"}</span>
                      </Show>
                    </div>
                  </th>
                  <th class="px-6 py-4 text-left font-bold">User</th>
                  <th
                    class="px-6 py-4 text-center cursor-pointer hover:bg-blue-700/50 transition-colors"
                    onClick={() => handleSort("vr")}
                  >
                    <div class="flex items-center justify-center space-x-2">
                      <span class="font-bold">VR</span>
                      <Show when={sortBy() === "vr"}>
                        <span class="text-sm">{ascending() ? "↓" : "↑"}</span>
                      </Show>
                    </div>
                  </th>
                  <th class="px-6 py-4 text-center hidden md:table-cell font-bold">
                    Friend Code
                  </th>
                  <th
                    class="px-6 py-4 text-center cursor-pointer hover:bg-blue-700/50 transition-colors hidden md:table-cell"
                    onClick={() => handleSort("lastSeen")}
                  >
                    <div class="flex items-center justify-center space-x-2">
                      <span class="font-bold">Last Seen</span>
                      <Show when={sortBy() === "lastSeen"}>
                        <span class="text-sm">{ascending() ? "↓" : "↑"}</span>
                      </Show>
                    </div>
                  </th>
                  <th
                    class="px-6 py-4 text-center cursor-pointer hover:bg-blue-700/50 transition-colors"
                    onClick={() => {
                      let vrGainField;
                      if (timePeriod() === "24") {
                        vrGainField = "vrgain24";
                      } else if (timePeriod() === "week") {
                        vrGainField = "vrgain7";
                      } else {
                        vrGainField = "vrgain30";
                      }
                      handleSort(vrGainField);
                    }}
                  >
                    <div class="flex items-center justify-center space-x-2">
                      <span class="font-bold">
                        VR Change (
                        {(() => {
                          const period = timePeriod();
                          if (period === "24") return "24h";
                          if (period === "week") return "7d";
                          return "30d";
                        })()}
                        )
                      </span>
                      <Show
                        when={(() => {
                          const currentTimePeriod = timePeriod();
                          let expectedSortField;
                          if (currentTimePeriod === "24") {
                            expectedSortField = "vrgain24";
                          } else if (currentTimePeriod === "week") {
                            expectedSortField = "vrgain7";
                          } else {
                            expectedSortField = "vrgain30";
                          }
                          return sortBy() === expectedSortField;
                        })()}
                      >
                        <span class="text-sm">{ascending() ? "↓" : "↑"}</span>
                      </Show>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <For each={leaderboardQuery.data!.players}>
                  {(player) => {
                    const rankToUse = activeOnly()
                      ? player.activeRank
                      : player.rank;
                    const vrGain = getVRGain(player);
                    const isOnline =
                      formatLastSeen(player.lastSeen) === "Now Online";

                    return (
                      <tr
                        class={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all ${player.isSuspicious ? "bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-800" : ""}`}
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

                        <td class="px-6 py-4">
                          <div class="flex items-center space-x-3">
                            {/* Mii Image - Now with progressive loading */}
                            <MiiComponent
                              playerName={player.name}
                              friendCode={player.friendCode}
                              size="md"
                              className="flex-shrink-0"
                              lazy={true}
                            />

                            {/* Player Info */}
                            <div class="min-w-0 flex-1">
                              <A
                                href={`/player/${player.friendCode}`}
                                class="font-bold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate block"
                              >
                                {player.name}
                              </A>
                              <div class="flex space-x-2 mt-1">
                                <Show when={!player.isActive}>
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

                        <td
                          class={`px-6 py-4 text-center hidden md:table-cell font-medium ${isOnline ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}
                        >
                          {isOnline && (
                            <span class="inline-flex items-center">
                              <span class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
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
                      </tr>
                    );
                  }}
                </For>
              </tbody>
            </table>
          </div>

          {/* No Results */}
          <Show when={leaderboardQuery.data!.players.length === 0}>
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
          <Show when={leaderboardQuery.data!.totalPages > 1}>
            <div class="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-600">
              <div class="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage() - 1))}
                  disabled={currentPage() === 1}
                  class="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100"
                >
                  ← Previous
                </button>
                <span class="px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium border border-gray-200 dark:border-gray-600">
                  Page {currentPage()} of {leaderboardQuery.data!.totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage(
                      Math.min(
                        leaderboardQuery.data!.totalPages,
                        currentPage() + 1
                      )
                    )
                  }
                  disabled={currentPage() === leaderboardQuery.data!.totalPages}
                  class="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100"
                >
                  Next →
                </button>
              </div>

              <div class="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Showing {(currentPage() - 1) * pageSize() + 1} -{" "}
                {Math.min(
                  currentPage() * pageSize(),
                  leaderboardQuery.data!.totalCount
                )}{" "}
                of {leaderboardQuery.data!.totalCount} racers
              </div>
            </div>
          </Show>
        </div>
      </Show>

      {/* FAQ Section */}
      <div class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl shadow-lg p-8 border border-indigo-200 dark:border-indigo-800 transition-colors">
        <div class="text-center mb-8">
          <span class="text-4xl mb-4 block">❓</span>
          <h3 class="text-3xl font-bold text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h3>
        </div>

        <div class="space-y-4 max-w-4xl mx-auto">
          <details class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm overflow-hidden">
            <summary class="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors flex items-center">
              <span class="mr-3">🏆</span>
              What is the Retro WFC VR Leaderboard?
            </summary>
            <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50">
              The Retro WFC VR Leaderboard tracks and ranks players based on
              their Virtual Ranking (VR) in the Retro WFC servers. It is updated
              regularly to show the most competitive players.
            </div>
          </details>

          <details class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm overflow-hidden">
            <summary class="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors flex items-center">
              <span class="mr-3">✨</span>
              What new features will be added?
            </summary>
            <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50">
              For now no new features are planned, but I will keep the
              leaderboard updated and maintained. If you have any suggestions or
              ideas, feel free to reach out to me (Noël) on Discord.
            </div>
          </details>

          <details class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm overflow-hidden">
            <summary class="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors flex items-center">
              <span class="mr-3">🔄</span>
              How often is the leaderboard updated?
            </summary>
            <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50">
              The leaderboard database updates every minute. Try to refresh the
              page to see new changes.
            </div>
          </details>

          <details class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm overflow-hidden">
            <summary class="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors flex items-center">
              <span class="mr-3">⚠️</span>
              Why is some of the data wrong?
            </summary>
            <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50">
              The VR Gain data might be slightly inaccurate due to complex
              formulas. If your data hasn't been updated since your last race,
              it probably means you left Retro WFC before your data could get
              updated. Join a room again and it should be updated accordingly.
              Also note that there is a gap of about 4 weeks worth of missing
              data.
            </div>
          </details>

          <details class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm overflow-hidden">
            <summary class="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors flex items-center">
              <span class="mr-3">🔍</span>I can't find my name on the
              leaderboard. What should I do?
            </summary>
            <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50">
              Make sure to be in an online room for at least a few minutes. If
              you still can't see your name please contact me (Noël) on Discord.
            </div>
          </details>

          <details class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm overflow-hidden">
            <summary class="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors flex items-center">
              <span class="mr-3">🚨</span>I am placed at the bottom of the
              leaderboard and displayed in red, why is that?
            </summary>
            <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50">
              It probably means you tried to set your VR to a very high value.
              If you think I made a mistake, contact me (Noël) on Discord.
            </div>
          </details>
        </div>
      </div>

      {/* Call to Action */}
      <section class="py-12 text-center">
        <div class="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
          <div class="text-5xl mb-4">🎮</div>
          <h2 class="text-3xl font-bold mb-4">Ready to Climb the Rankings?</h2>
          <p class="text-xl mb-6 text-green-100">
            Join the competition and see how you stack up against the best
            racers
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <A
              href="/downloads"
              class="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105"
            >
              Get Started
            </A>
            <A
              href="/tutorials"
              class="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-8 rounded-lg border border-white/30 transition-all"
            >
              Learn More
            </A>
          </div>
        </div>
      </section>
    </div>
  );
}
