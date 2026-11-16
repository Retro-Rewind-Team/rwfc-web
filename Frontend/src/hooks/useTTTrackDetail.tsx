import { createMemo } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { timeTrialApi } from "../services/api/timeTrial";
import {
    DriftCategoryFilter,
    DriftFilter,
    GhostSubmission,
    LeaderboardMode,
    ShroomlessFilter,
    VehicleFilter,
} from "../types/timeTrial";
import { ghostFilename, triggerBlobDownload } from "../utils/downloadHelpers";
import { queryKeys } from "../constants/queryKeys";
import { readEnum, useUrlPagination, useUrlState } from "./useUrlState";

/** Returns true if a submission passes the given drift type and drift category filters. */
function matchesDriftFilters(
    submission: GhostSubmission,
    drift: DriftFilter,
    driftCat: DriftCategoryFilter,
): boolean {
    if (drift === "manual" && submission.driftType !== 0) return false;
    if (drift === "hybrid" && submission.driftType !== 1) return false;
    if (driftCat === "inside" && submission.driftCategory !== 1) return false;
    if (driftCat === "outside" && submission.driftCategory !== 0) return false;
    return true;
}

export const TT_DETAIL_PAGE_SIZES = [10, 25, 50] as const;

/**
 * Manages filter state, pagination, and data fetching for a single time trial
 * track detail page (leaderboard, WR history, and flap records). The filters and page are URL params
 * (`shroomless`, `vehicle`, `drift`, `driftcat`, `page`, `size`); cc, glitch and mode are the route.
 */
export function useTTTrackDetail(
    trackId: () => number,
    cc: () => 150 | 200,
    glitchAllowed: () => boolean,
    mode: () => LeaderboardMode,
) {
    const state = useUrlState();
    const { currentPage, setCurrentPage, pageSize, handlePageSizeChange, clampTo } =
        useUrlPagination(state, 10, TT_DETAIL_PAGE_SIZES);

    // cc, glitch and mode come from the route. Switching them navigates to a new path, which starts
    // on page 1 by itself, so there is no effect resetting the page here: one that ran on mount
    // would wipe the page out of a shared link.
    const shroomlessFilter = createMemo(
        (): ShroomlessFilter =>
            readEnum(state.get("shroomless"), ["all", "only", "exclude"] as const) ?? "all",
    );
    const vehicleFilter = createMemo(
        (): VehicleFilter =>
            readEnum(state.get("vehicle"), ["all", "karts", "bikes"] as const) ?? "all",
    );
    const driftFilter = createMemo(
        (): DriftFilter =>
            readEnum(state.get("drift"), ["all", "manual", "hybrid"] as const) ?? "all",
    );
    const driftCategoryFilter = createMemo(
        (): DriftCategoryFilter =>
            readEnum(state.get("driftcat"), ["all", "inside", "outside"] as const) ?? "all",
    );

    // Fetch track info
    const trackQuery = useQuery(() => ({
        queryKey: queryKeys.ttTrack(trackId()),
        queryFn: () => timeTrialApi.getTrack(trackId()),
        staleTime: 1000 * 60 * 60,
    }));

    // Fetch leaderboard - switches between regular and flap based on mode
    const leaderboardQuery = useQuery(() => ({
        queryKey: queryKeys.ttLeaderboard(
            trackId(),
            cc(),
            glitchAllowed(),
            mode(),
            shroomlessFilter(),
            vehicleFilter(),
            currentPage(),
            pageSize(),
        ),
        queryFn: () =>
            mode() === "flap"
                ? timeTrialApi.getFlapLeaderboard(
                      trackId(),
                      cc(),
                      glitchAllowed(),
                      shroomlessFilter(),
                      vehicleFilter(),
                      currentPage(),
                      pageSize(),
                  )
                : timeTrialApi.getLeaderboard(
                      trackId(),
                      cc(),
                      glitchAllowed(),
                      shroomlessFilter(),
                      vehicleFilter(),
                      currentPage(),
                      pageSize(),
                  ),
    }));

    clampTo(() => leaderboardQuery.data?.totalPages);

    // FLAP stat - only in regular mode
    const flapQuery = useQuery(() => ({
        queryKey: queryKeys.ttFlap(
            trackId(),
            cc(),
            glitchAllowed(),
            shroomlessFilter(),
            vehicleFilter(),
        ),
        queryFn: () =>
            timeTrialApi.getFastestLap(
                trackId(),
                cc(),
                glitchAllowed(),
                shroomlessFilter(),
                vehicleFilter(),
            ),
        enabled: mode() === "regular",
    }));

    // Regular WR history - only in regular mode
    const wrHistoryQuery = useQuery(() => ({
        queryKey: queryKeys.ttWrHistory(
            trackId(),
            cc(),
            glitchAllowed(),
            shroomlessFilter(),
            vehicleFilter(),
        ),
        queryFn: () =>
            timeTrialApi.getWorldRecordHistory(
                trackId(),
                cc(),
                glitchAllowed(),
                shroomlessFilter(),
                vehicleFilter(),
            ),
        enabled: mode() === "regular",
    }));

    // Flap WR history - only in flap mode
    const flapWrHistoryQuery = useQuery(() => ({
        queryKey: queryKeys.ttFlapWrHistory(
            trackId(),
            cc(),
            glitchAllowed(),
            shroomlessFilter(),
            vehicleFilter(),
        ),
        queryFn: () =>
            timeTrialApi.getFlapWorldRecordHistory(
                trackId(),
                cc(),
                glitchAllowed(),
                shroomlessFilter(),
                vehicleFilter(),
            ),
        enabled: mode() === "flap",
    }));

    // Apply display-only drift filters client-side
    const filteredSubmissions = () => {
        const drift = driftFilter();
        const driftCat = driftCategoryFilter();
        return (leaderboardQuery.data?.submissions ?? []).filter((s) =>
            matchesDriftFilters(s, drift, driftCat),
        );
    };

    // Active WR history - whichever mode is current
    const filteredWRHistory = () => {
        const history =
            mode() === "flap" ? (flapWrHistoryQuery.data ?? []) : (wrHistoryQuery.data ?? []);
        const drift = driftFilter();
        const driftCat = driftCategoryFilter();
        return history.filter((s) => matchesDriftFilters(s, drift, driftCat));
    };

    // Active WR history query state - for loading/error display
    const activeWrHistoryQuery = () => (mode() === "flap" ? flapWrHistoryQuery : wrHistoryQuery);

    const handleShroomlessFilterChange = (filter: ShroomlessFilter) =>
        state.update({ shroomless: filter === "all" ? undefined : filter }, { resetPage: true });
    const handleVehicleFilterChange = (filter: VehicleFilter) =>
        state.update({ vehicle: filter === "all" ? undefined : filter }, { resetPage: true });
    const handleDriftFilterChange = (filter: DriftFilter) =>
        state.update({ drift: filter === "all" ? undefined : filter }, { resetPage: true });
    const handleDriftCategoryFilterChange = (filter: DriftCategoryFilter) =>
        state.update({ driftcat: filter === "all" ? undefined : filter }, { resetPage: true });

    const hasFilters = createMemo(
        () =>
            shroomlessFilter() !== "all" ||
            vehicleFilter() !== "all" ||
            driftFilter() !== "all" ||
            driftCategoryFilter() !== "all",
    );
    const clearFilters = () =>
        state.update(
            { shroomless: undefined, vehicle: undefined, drift: undefined, driftcat: undefined },
            { resetPage: true },
        );

    const handleDownloadGhost = async (submission: GhostSubmission) => {
        try {
            const blob = await timeTrialApi.downloadGhost(submission.id);
            triggerBlobDownload(blob, ghostFilename(submission.finishTimeDisplay));
        } catch (error) {
            console.error("Failed to download ghost:", error);
        }
    };

    const refreshAll = () => {
        trackQuery.refetch();
        leaderboardQuery.refetch();
        if (mode() === "regular") {
            flapQuery.refetch();
            wrHistoryQuery.refetch();
        } else {
            flapWrHistoryQuery.refetch();
        }
    };

    return {
        filters: {
            shroomlessFilter,
            vehicleFilter,
            driftFilter,
            driftCategoryFilter,
            hasFilters,
            clearFilters,
        },
        pagination: {
            currentPage,
            pageSize,
            setCurrentPage,
            handlePageSizeChange,
        },
        computed: {
            filteredSubmissions,
            filteredWRHistory,
        },
        queries: {
            trackQuery,
            leaderboardQuery,
            flapQuery,
            wrHistoryQuery,
            flapWrHistoryQuery,
            activeWrHistoryQuery,
        },
        handlers: {
            handleShroomlessFilterChange,
            handleVehicleFilterChange,
            handleDriftFilterChange,
            handleDriftCategoryFilterChange,
            handleDownloadGhost,
            refreshAll,
        },
    };
}
