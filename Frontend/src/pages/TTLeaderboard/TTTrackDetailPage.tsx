import { A, useParams } from "@solidjs/router";
import { createMemo, Show } from "solid-js";
import { useTTTrackDetail } from "../../hooks/useTTTrackDetail";
import { AlertBox, LoadingSpinner } from "../../components/common";
import { TTFilters, TTLeaderboardTable, TTWRHistory } from "../../components/ui";

export default function TTTrackDetailPage() {
    const params = useParams();

    const selectedCC = createMemo((): 150 | 200 => {
        const cc = params.cc;
        if (cc === "no-glitch-150cc" || cc === "150cc") return 150;
        if (cc === "no-glitch-200cc" || cc === "200cc") return 200;
        return 150;
    });

    const glitchAllowed = createMemo((): boolean => {
        return !params.cc?.startsWith("no-glitch-");
    });

    const trackId = createMemo(() => Number(params.trackId));

    const ttTrack = useTTTrackDetail(trackId, selectedCC, glitchAllowed);

    const flapHolder = () => {
        const flapMs = ttTrack.flapQuery.data?.fastestLapMs;
        if (!flapMs) return null;

        const submissions = ttTrack.leaderboardQuery.data?.submissions ?? [];
        for (const submission of submissions) {
            for (let i = 0; i < submission.lapSplitsMs.length; i++) {
                if (submission.lapSplitsMs[i] === flapMs) {
                    return {
                        playerName: submission.playerName,
                        miiName: submission.miiName,
                        lapNumber: i + 1,
                        time: ttTrack.flapQuery.data!.fastestLapDisplay,
                        shroomless: submission.shroomless,
                        glitch: submission.glitch,
                    };
                }
            }
        }
        return null;
    };

    const categoryLabel = () => {
        if (!glitchAllowed()) {
            return selectedCC() === 150 ? "Non-Glitch/Shortcut 150cc" : "Non-Glitch/Shortcut 200cc";
        }
        return selectedCC() === 150 ? "All Times 150cc" : "All Times 200cc";
    };

    return (
        <div class="space-y-6">
            {/* Back Button */}
            <div>
                <A
                    href="/timetrial"
                    class="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back to Track Browser</span>
                </A>
            </div>

            {/* Loading */}
            <Show when={ttTrack.trackQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-12 text-center">
                    <LoadingSpinner />
                    <p class="mt-4 text-gray-600 dark:text-gray-400">Loading track...</p>
                </div>
            </Show>

            {/* Error */}
            <Show when={ttTrack.trackQuery.isError}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-red-200 dark:border-red-800 p-8">
                    <div class="text-center space-y-4">
                        <div class="text-6xl">⚠️</div>
                        <h2 class="text-2xl font-bold text-red-900 dark:text-red-100">Failed to load track</h2>
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
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Header */}
                            <div class={`px-6 py-4 ${
                                !glitchAllowed()
                                    ? "bg-gradient-to-r from-green-600 to-emerald-600"
                                    : "bg-blue-600"
                            }`}>
                                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <h1 class="text-3xl font-bold text-white mb-1">
                                            {track().name}
                                        </h1>
                                        <div class="flex items-center gap-3 text-sm text-blue-100">
                                            <span class="font-semibold">{categoryLabel()}</span>
                                            <span>•</span>
                                            <span>{track().laps} lap{track().laps !== 1 ? "s" : ""}</span>
                                            <span>•</span>
                                            <span class="capitalize">{track().category} Track</span>
                                        </div>
                                    </div>

                                    {/* FLAP Display */}
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
                                    trackSupportsGlitch={track().supportsGlitch}
                                    currentCC={selectedCC()}
                                    currentGlitchAllowed={glitchAllowed()}
                                    shroomlessFilter={ttTrack.shroomlessFilter()}
                                    vehicleFilter={ttTrack.vehicleFilter()}
                                    driftFilter={ttTrack.driftFilter()}
                                    driftCategoryFilter={ttTrack.driftCategoryFilter()}
                                    pageSize={ttTrack.pageSize()}
                                    onShroomlessFilterChange={ttTrack.handleShroomlessFilterChange}
                                    onVehicleFilterChange={ttTrack.handleVehicleFilterChange}
                                    onDriftFilterChange={ttTrack.handleDriftFilterChange}
                                    onDriftCategoryFilterChange={ttTrack.handleDriftCategoryFilterChange}
                                    onPageSizeChange={ttTrack.handlePageSizeChange}
                                />
                            </div>

                            {/* Leaderboard Loading */}
                            <Show when={ttTrack.leaderboardQuery.isLoading}>
                                <div class="p-12 text-center">
                                    <LoadingSpinner />
                                    <p class="mt-4 text-gray-600 dark:text-gray-400">Loading times...</p>
                                </div>
                            </Show>

                            {/* Leaderboard Error */}
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
                                        fastestLapMs={ttTrack.flapQuery.data?.fastestLapMs ?? null}
                                        trackLaps={track().laps}
                                        onDownloadGhost={ttTrack.handleDownloadGhost}
                                    />
                                </Show>

                                {/* Pagination */}
                                <Show when={(ttTrack.leaderboardQuery.data?.totalPages ?? 1) > 1}>
                                    <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t-2 border-gray-200 dark:border-gray-600 gap-2 sm:gap-0">
                                        <div class="flex items-center justify-center sm:justify-start gap-2">
                                            <button
                                                onClick={() => ttTrack.setCurrentPage(Math.max(1, ttTrack.currentPage() - 1))}
                                                disabled={ttTrack.currentPage() === 1}
                                                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                ← Previous
                                            </button>
                                            <span class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                                                Page
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={ttTrack.leaderboardQuery.data!.totalPages}
                                                    value={ttTrack.currentPage()}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            const val = parseInt((e.target as HTMLInputElement).value);
                                                            const total = ttTrack.leaderboardQuery.data!.totalPages;
                                                            if (!isNaN(val) && val >= 1 && val <= total) {
                                                                ttTrack.setCurrentPage(val);
                                                            } else {
                                                                (e.target as HTMLInputElement).value = String(ttTrack.currentPage());
                                                            }
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        const total = ttTrack.leaderboardQuery.data!.totalPages;
                                                        if (!isNaN(val) && val >= 1 && val <= total) {
                                                            ttTrack.setCurrentPage(val);
                                                        } else {
                                                            e.target.value = String(ttTrack.currentPage());
                                                        }
                                                    }}
                                                    class="w-16 px-2 py-1 text-center border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                of {ttTrack.leaderboardQuery.data!.totalPages}
                                            </span>
                                            <button
                                                onClick={() => ttTrack.setCurrentPage(
                                                    Math.min(ttTrack.leaderboardQuery.data!.totalPages, ttTrack.currentPage() + 1)
                                                )}
                                                disabled={ttTrack.currentPage() === ttTrack.leaderboardQuery.data!.totalPages}
                                                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Next →
                                            </button>
                                        </div>
                                        <div class="text-sm text-gray-600 dark:text-gray-400 font-medium text-center sm:text-right">
                                            Showing {(ttTrack.currentPage() - 1) * ttTrack.pageSize() + 1}–{Math.min(
                                                ttTrack.currentPage() * ttTrack.pageSize(),
                                                ttTrack.leaderboardQuery.data!.totalSubmissions
                                            )} of {ttTrack.leaderboardQuery.data!.totalSubmissions} times
                                        </div>
                                    </div>
                                </Show>
                            </Show>
                        </div>

                        {/* WR History */}
                        <TTWRHistory
                            history={ttTrack.filteredWRHistory()}
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
