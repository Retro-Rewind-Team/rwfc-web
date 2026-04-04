import { A, useParams } from "@solidjs/router";
import { createMemo, Show } from "solid-js";
import { ChevronLeft, TriangleAlert, Trophy, Zap } from "lucide-solid";
import { useTTTrackDetail } from "../../hooks/useTTTrackDetail";
import { AlertBox, InlinePagination, LoadingSpinner } from "../../components/common";
import { TTFilters, TTLeaderboardTable, TTWRHistory } from "../../components/ui";
import { LeaderboardMode } from "../../types/timeTrial";

function parseRouteCC(ccParam: string): {
    cc: 150 | 200;
    glitchAllowed: boolean;
    mode: LeaderboardMode;
} {
    const isFlap = ccParam.startsWith("flap-");
    const withoutFlap = isFlap ? ccParam.slice("flap-".length) : ccParam;
    const isNoGlitch = withoutFlap.startsWith("no-glitch-");
    const withoutGlitch = isNoGlitch ? withoutFlap.slice("no-glitch-".length) : withoutFlap;
    const cc = withoutGlitch === "200cc" ? 200 : 150;
    return { cc, glitchAllowed: !isNoGlitch, mode: isFlap ? "flap" : "regular" };
}

export default function TTTrackDetailPage() {
    const params = useParams();

    const parsed = createMemo(() => parseRouteCC(params.cc ?? "150cc"));
    const selectedCC = createMemo((): 150 | 200 => parsed().cc);
    const glitchAllowed = createMemo((): boolean => parsed().glitchAllowed);
    const mode = createMemo((): LeaderboardMode => parsed().mode);
    const trackId = createMemo(() => Number(params.trackId));

    const { filters, pagination, computed, queries, handlers } = useTTTrackDetail(
        trackId,
        selectedCC,
        glitchAllowed,
        mode,
    );

    const categoryLabel = () => {
        const parts: string[] = [];
        if (mode() === "flap") parts.push("Flap");
        if (!glitchAllowed()) parts.push("Non-Glitch/Shortcut");
        parts.push(`${selectedCC()}cc`);
        return parts.join(" ");
    };

    const headerColor = () => {
        if (mode() === "flap") return "bg-orange-500";
        if (!glitchAllowed()) return "bg-green-600";
        return "bg-blue-600";
    };

    const wrHistoryTitle = () =>
        mode() === "flap" ? "Flap Record History" : "World Record History";

    const wrHistorySubtitle = () =>
        mode() === "flap"
            ? "Track the progression of fastest lap records over time"
            : "Track the progression of world records over time";

    return (
        <div class="space-y-6">
            {/* Back Button */}
            <div>
                <A
                    href="/timetrial"
                    class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                    <ChevronLeft size={16} />
                    Back to Track Browser
                </A>
            </div>

            {/* Loading */}
            <Show when={queries.trackQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center gap-4">
                    <LoadingSpinner />
                    <p class="text-gray-600 dark:text-gray-400">Loading track...</p>
                </div>
            </Show>

            {/* Error */}
            <Show when={queries.trackQuery.isError}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-red-200 dark:border-red-800 p-8">
                    <div class="text-center space-y-4">
                        <div class="flex justify-center text-red-400">
                            <TriangleAlert size={48} />
                        </div>
                        <h2 class="text-2xl font-bold text-red-900 dark:text-red-100">
                            Failed to load track
                        </h2>
                        <button
                            type="button"
                            onClick={() => queries.trackQuery.refetch()}
                            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </Show>

            {/* Track Detail */}
            <Show when={queries.trackQuery.data}>
                {(track) => (
                    <div class="space-y-6">
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Header */}
                            <div class={`px-6 py-4 ${headerColor()}`}>
                                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <h1 class="text-3xl font-bold text-white mb-1">
                                            {track().name}
                                        </h1>
                                        <div class="flex items-center gap-3 text-sm text-white/80">
                                            <span class="font-semibold">{categoryLabel()}</span>
                                            <span>•</span>
                                            <span>
                                                {track().laps} lap{track().laps !== 1 ? "s" : ""}
                                            </span>
                                            <span>•</span>
                                            <span class="capitalize">{track().category} Track</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div class="bg-gray-50 dark:bg-gray-700/50 p-4 border-b border-gray-200 dark:border-gray-700">
                                <TTFilters
                                    trackId={trackId()}
                                    trackSupportsGlitch={track().supportsGlitch}
                                    currentCC={selectedCC()}
                                    currentGlitchAllowed={glitchAllowed()}
                                    currentMode={mode()}
                                    shroomlessFilter={filters.shroomlessFilter()}
                                    vehicleFilter={filters.vehicleFilter()}
                                    driftFilter={filters.driftFilter()}
                                    driftCategoryFilter={filters.driftCategoryFilter()}
                                    pageSize={pagination.pageSize()}
                                    onShroomlessFilterChange={handlers.handleShroomlessFilterChange}
                                    onVehicleFilterChange={handlers.handleVehicleFilterChange}
                                    onDriftFilterChange={handlers.handleDriftFilterChange}
                                    onDriftCategoryFilterChange={
                                        handlers.handleDriftCategoryFilterChange
                                    }
                                    onPageSizeChange={pagination.handlePageSizeChange}
                                />
                            </div>

                            {/* Leaderboard Loading */}
                            <Show when={queries.leaderboardQuery.isLoading}>
                                <div class="p-12 flex flex-col items-center gap-4">
                                    <LoadingSpinner />
                                    <p class="text-gray-600 dark:text-gray-400">Loading times...</p>
                                </div>
                            </Show>

                            {/* Leaderboard Error */}
                            <Show when={queries.leaderboardQuery.isError}>
                                <div class="p-6">
                                    <AlertBox type="error">Failed to load leaderboard</AlertBox>
                                </div>
                            </Show>

                            {/* Leaderboard Table */}
                            <Show
                                when={
                                    queries.leaderboardQuery.data &&
                                    !queries.leaderboardQuery.isLoading
                                }
                            >
                                <Show
                                    when={computed.filteredSubmissions().length > 0}
                                    fallback={
                                        <div class="p-12 text-center">
                                            <div class="flex justify-center mb-4 text-gray-300 dark:text-gray-600">
                                                {mode() === "flap" ? (
                                                    <Zap size={48} />
                                                ) : (
                                                    <Trophy size={48} />
                                                )}
                                            </div>
                                            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                No Times Found
                                            </h3>
                                            <p class="text-gray-600 dark:text-gray-400">
                                                {mode() === "flap"
                                                    ? "No flap runs have been submitted for this category yet."
                                                    : "Try adjusting your filters or be the first to submit a time!"}
                                            </p>
                                        </div>
                                    }
                                >
                                    <TTLeaderboardTable
                                        submissions={computed.filteredSubmissions()}
                                        fastestLapMs={
                                            mode() === "regular"
                                                ? (queries.flapQuery.data?.fastestLapMs ?? null)
                                                : (queries.leaderboardQuery.data?.fastestLapMs ??
                                                  null)
                                        }
                                        trackLaps={track().laps}
                                        isFlap={mode() === "flap"}
                                        onDownloadGhost={handlers.handleDownloadGhost}
                                    />
                                </Show>

                                {/* Pagination */}
                                <Show when={(queries.leaderboardQuery.data?.totalPages ?? 1) > 1}>
                                    <InlinePagination
                                        currentPage={pagination.currentPage()}
                                        totalPages={queries.leaderboardQuery.data!.totalPages}
                                        pageSize={pagination.pageSize()}
                                        totalItems={queries.leaderboardQuery.data!.totalSubmissions}
                                        onPageChange={pagination.setCurrentPage}
                                        itemLabel="times"
                                    />
                                </Show>
                            </Show>
                        </div>

                        <TTWRHistory
                            history={computed.filteredWRHistory()}
                            isLoading={queries.activeWrHistoryQuery().isLoading}
                            isError={queries.activeWrHistoryQuery().isError}
                            onDownloadGhost={handlers.handleDownloadGhost}
                            title={wrHistoryTitle()}
                            subtitle={wrHistorySubtitle()}
                            isFlap={mode() === "flap"}
                        />
                    </div>
                )}
            </Show>
        </div>
    );
}
