import { A, useParams } from "@solidjs/router";
import { createMemo, Show } from "solid-js";
import { useTTTrackDetail } from "../../hooks/useTTTrackDetail";
import { AlertBox, LoadingSpinner } from "../../components/common";
import { TTFilters, TTLeaderboardTable, TTWRHistory } from "../../components/ui";

export default function TTTrackDetailPage() {
    const params = useParams();
    
    // Parse CC from route params as a memo
    const selectedCC = createMemo((): 150 | 200 => {
        const cc = params.cc;
        if (cc === "150cc") return 150;
        if (cc === "200cc") return 200;
        return 150; // default
    });

    // Parse track ID from route params as a memo
    const trackId = createMemo(() => Number(params.trackId));

    // Use the track detail hook
    const ttTrack = useTTTrackDetail(trackId, selectedCC);

    // Get track category for filters
    const trackCategory = () => ttTrack.trackQuery.data?.category || "retro";

    // Get FLAP holder info
    const flapHolder = () => {
        if (!ttTrack.leaderboardQuery.data?.fastestLapMs) return null;
        
        const fastestLap = ttTrack.leaderboardQuery.data.fastestLapMs;
        const submissions = ttTrack.leaderboardQuery.data.submissions || [];
        
        // Find the submission that has this FLAP
        for (const submission of submissions) {
            for (let i = 0; i < submission.lapSplitsMs.length; i++) {
                if (submission.lapSplitsMs[i] === fastestLap) {
                    return {
                        playerName: submission.playerName,
                        miiName: submission.miiName,
                        lapNumber: i + 1,
                        time: submission.lapSplitsDisplay[i],
                        shroomless: submission.shroomless,
                        glitch: submission.glitch,
                    };
                }
            }
        }
        return null;
    };

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
                    <span>Back to Track Browser</span>
                </A>
            </div>

            {/* Loading State */}
            <Show when={ttTrack.trackQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-12 text-center">
                    <LoadingSpinner />
                    <p class="mt-4 text-gray-600 dark:text-gray-400">
                        Loading track...
                    </p>
                </div>
            </Show>

            {/* Error State */}
            <Show when={ttTrack.trackQuery.isError}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-red-200 dark:border-red-800 p-8">
                    <div class="text-center space-y-4">
                        <div class="text-6xl">⚠️</div>
                        <h2 class="text-2xl font-bold text-red-900 dark:text-red-100">
                            Failed to load track
                        </h2>
                        <button
                            onClick={() => ttTrack.trackQuery.refetch()}
                            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </Show>

            {/* Track Detail */}
            <Show when={ttTrack.trackQuery.data}>
                {(track) => (
                    <div class="space-y-6">
                        {/* Track Header & Filters */}
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Header */}
                            <div class="bg-blue-600 px-6 py-4">
                                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <h1 class="text-3xl font-bold text-white mb-1">
                                            {track().name}
                                        </h1>
                                        <div class="flex items-center gap-3 text-sm text-blue-100">
                                            <span>{selectedCC()}cc</span>
                                            <span>•</span>
                                            <span>{track().laps} lap{track().laps !== 1 ? "s" : ""}</span>
                                            <span>•</span>
                                            <span class="capitalize">{track().category} Track</span>
                                        </div>
                                    </div>

                                    {/* FLAP Display with holder info */}
                                    <Show when={flapHolder()}>
                                        {(holder) => (
                                            <div class="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                                                <div class="text-xs text-blue-100 uppercase tracking-wide font-semibold mb-1">
                                                    Track FLAP
                                                </div>
                                                <div class="text-2xl font-black text-green-300 mb-1">
                                                    {holder().time}
                                                </div>
                                                <div class="text-xs text-blue-100">
                                                    <div class="font-semibold">{holder().playerName}</div>
                                                    <div class="flex items-center gap-2 mt-1">
                                                        <span>Lap {holder().lapNumber}</span>
                                                        <Show when={holder().shroomless}>
                                                            <span class="bg-yellow-100/20 text-yellow-200 px-1.5 py-0.5 rounded text-xs">🍄</span>
                                                        </Show>
                                                        <Show when={holder().glitch}>
                                                            <span class="bg-purple-100/20 text-purple-200 px-1.5 py-0.5 rounded text-xs">⚡</span>
                                                        </Show>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Show>
                                </div>
                            </div>

                            {/* Filters */}
                            <div class="bg-gray-50 dark:bg-gray-700/50 p-4 border-b-2 border-gray-200 dark:border-gray-700">
                                <TTFilters
                                    trackId={trackId()}
                                    currentCC={selectedCC()}
                                    shroomlessFilter={ttTrack.shroomlessFilter()}
                                    glitchFilter={ttTrack.glitchFilter()}
                                    vehicleFilter={ttTrack.vehicleFilter()}
                                    driftFilter={ttTrack.driftFilter()}
                                    pageSize={ttTrack.pageSize()}
                                    category={trackCategory()}
                                    onShroomlessFilterChange={ttTrack.handleShroomlessFilterChange}
                                    onGlitchFilterChange={ttTrack.handleGlitchFilterChange}
                                    onVehicleFilterChange={ttTrack.handleVehicleFilterChange}
                                    onDriftFilterChange={ttTrack.handleDriftFilterChange}
                                    onPageSizeChange={ttTrack.handlePageSizeChange}
                                />
                            </div>

                            {/* Loading State */}
                            <Show when={ttTrack.leaderboardQuery.isLoading}>
                                <div class="p-12 text-center">
                                    <LoadingSpinner />
                                    <p class="mt-4 text-gray-600 dark:text-gray-400">
                                        Loading times...
                                    </p>
                                </div>
                            </Show>

                            {/* Error State */}
                            <Show when={ttTrack.leaderboardQuery.isError}>
                                <div class="p-6">
                                    <AlertBox type="error" icon="⚠️">
                                        Failed to load leaderboard
                                    </AlertBox>
                                </div>
                            </Show>

                            {/* Leaderboard Table */}
                            <Show when={ttTrack.leaderboardQuery.data && !ttTrack.leaderboardQuery.isLoading}>
                                <Show
                                    when={ttTrack.filteredSubmissions().length > 0}
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
                                        submissions={ttTrack.filteredSubmissions()}
                                        fastestLapMs={ttTrack.leaderboardQuery.data?.fastestLapMs || null}
                                        trackLaps={track().laps}
                                        onDownloadGhost={ttTrack.handleDownloadGhost}
                                    />
                                </Show>

                                {/* Pagination */}
                                <Show when={ttTrack.leaderboardQuery.data!.totalSubmissions > ttTrack.pageSize()}>
                                    <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t-2 border-gray-200 dark:border-gray-600 gap-2 sm:gap-0">
                                        <div class="flex items-center justify-center sm:justify-start gap-2">
                                            <button
                                                onClick={() => ttTrack.setCurrentPage(Math.max(1, ttTrack.currentPage() - 1))}
                                                disabled={ttTrack.currentPage() === 1}
                                                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                ← Previous
                                            </button>
                                            <span class="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium border-2 border-gray-200 dark:border-gray-600 whitespace-nowrap">
                                                Page {ttTrack.currentPage()} of {Math.ceil(ttTrack.leaderboardQuery.data!.totalSubmissions / ttTrack.pageSize())}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    ttTrack.setCurrentPage(
                                                        Math.min(
                                                            Math.ceil(ttTrack.leaderboardQuery.data!.totalSubmissions / ttTrack.pageSize()),
                                                            ttTrack.currentPage() + 1
                                                        )
                                                    )
                                                }
                                                disabled={ttTrack.currentPage() === Math.ceil(ttTrack.leaderboardQuery.data!.totalSubmissions / ttTrack.pageSize())}
                                                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Next →
                                            </button>
                                        </div>

                                        <div class="text-sm text-gray-600 dark:text-gray-400 font-medium text-center sm:text-right">
                                            Showing {(ttTrack.currentPage() - 1) * ttTrack.pageSize() + 1} –{" "}
                                            {Math.min(ttTrack.currentPage() * ttTrack.pageSize(), ttTrack.leaderboardQuery.data!.totalSubmissions)} of {ttTrack.leaderboardQuery.data!.totalSubmissions} times
                                        </div>
                                    </div>
                                </Show>
                            </Show>
                        </div>

                        {/* WR History */}
                        <TTWRHistory
                            history={ttTrack.wrHistoryQuery.data}
                            isLoading={ttTrack.wrHistoryQuery.isLoading}
                            isError={ttTrack.wrHistoryQuery.isError}
                            onDownloadGhost={ttTrack.handleDownloadGhost}
                        />
                    </div>
                )}
            </Show>
        </div>
    );
}