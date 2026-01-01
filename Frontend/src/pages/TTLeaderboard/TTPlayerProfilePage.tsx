import { A, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import { useTTPlayer } from "../../hooks/useTTPlayer";
import { LoadingSpinner } from "../../components/common";
import { TTPlayerStatsCard, TTPlayerSubmissionsTable } from "../../components/ui";
import { CountryFlag } from "../../components/common";

export default function TTPlayerProfilePage() {
    const params = useParams();
    const ttPlayer = useTTPlayer(Number(params.ttProfileId));

    return (
        <div class="space-y-6">
            {/* Back Button */}
            <div>
                <A
                    href="/timetrial"
                    class="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    <span>Back to Time Trial Leaderboards</span>
                </A>
            </div>

            {/* Loading State */}
            <Show when={ttPlayer.profileQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                    <div class="flex justify-center items-center py-12">
                        <LoadingSpinner />
                        <p class="ml-4 text-gray-600 dark:text-gray-300">
                            Loading player profile...
                        </p>
                    </div>
                </div>
            </Show>

            {/* Player Not Found State */}
            <Show when={ttPlayer.isPlayerNotFound()}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-8">
                    <div class="text-center space-y-4">
                        <div class="text-6xl">❌</div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                            Player Not Found
                        </h2>
                        <p class="text-gray-600 dark:text-gray-400">
                            No Time Trial profile found for this player.
                        </p>
                        <p class="text-sm text-gray-500 dark:text-gray-500">
                            This player hasn't submitted any times yet.
                        </p>
                        <div class="pt-4">
                            <A
                                href="/timetrial"
                                class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors inline-flex items-center"
                            >
                                <svg
                                    class="w-5 h-5 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                                Browse Leaderboards
                            </A>
                        </div>
                    </div>
                </div>
            </Show>

            {/* Error State */}
            <Show when={ttPlayer.profileQuery.isError && !ttPlayer.isPlayerNotFound()}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-red-200 dark:border-red-800 p-8">
                    <div class="text-center space-y-4">
                        <div class="text-6xl">⚠️</div>
                        <h2 class="text-2xl font-bold text-red-900 dark:text-red-100">
                            Error Loading Profile
                        </h2>
                        <p class="text-red-600 dark:text-red-400">
                            An error occurred while loading player profile.
                        </p>
                        <div class="pt-4">
                            <button
                                onClick={() => ttPlayer.refreshAll()}
                                class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </Show>

            {/* Player Profile */}
            <Show when={ttPlayer.profileQuery.data}>
                {(profile) => (
                    <div class="space-y-6">
                        {/* Player Header Card */}
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                            <div class="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                                <div class="flex items-center space-x-6">
                                    {/* Player Image Placeholder */}
                                    <div class="flex-shrink-0">
                                        <div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                            <svg class="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                            </svg>
                                            {/* Future: Replace with <img src={profile().imageUrl} /> */}
                                        </div>
                                    </div>
                                    
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
                                        icon="🏁"
                                        colorScheme="blue"
                                    />
                                    <TTPlayerStatsCard
                                        value={stats().totalTracks}
                                        label="Tracks Played"
                                        icon="🏎️"
                                        colorScheme="green"
                                    />
                                </div>
                            )}
                        </Show>

                        {/* Filters */}
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                            <div class="flex items-center mb-4">
                                <span class="text-2xl mr-3">🔍</span>
                                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                                    Filter Submissions
                                </h2>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* CC Filter */}
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Filter by CC
                                    </label>
                                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                                        <button
                                            onClick={() => ttPlayer.handleCCChange("all")}
                                            class={`flex-1 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                                ttPlayer.selectedCC() === "all"
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

                                {/* Search */}
                                <div>
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
                                            value={ttPlayer.searchQuery()}
                                            onInput={(e) => ttPlayer.handleSearchInput(e.target.value)}
                                            class="w-full pl-10 pr-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submissions Table */}
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div class="bg-blue-600 px-6 py-4">
                                <h2 class="text-2xl font-bold text-white">
                                    All Submissions
                                </h2>
                                <p class="text-blue-100 text-sm">
                                    {ttPlayer.filteredSubmissions().length} submission{ttPlayer.filteredSubmissions().length !== 1 ? "s" : ""}
                                </p>
                            </div>

                            <Show when={ttPlayer.submissionsQuery.isLoading}>
                                <div class="p-12 text-center">
                                    <LoadingSpinner />
                                    <p class="mt-4 text-gray-600 dark:text-gray-400">
                                        Loading submissions...
                                    </p>
                                </div>
                            </Show>

                            <Show when={ttPlayer.submissionsQuery.data && !ttPlayer.submissionsQuery.isLoading}>
                                <Show
                                    when={ttPlayer.filteredSubmissions().length > 0}
                                    fallback={
                                        <div class="p-12 text-center">
                                            <div class="text-6xl mb-4">🏁</div>
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
                                        onDownloadGhost={(submission) => ttPlayer.handleDownloadGhost(submission.id)}
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