import { createEffect, createSignal } from "solid-js";
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
import { usePagination } from "./usePagination";

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

/**
 * Manages filter state, pagination, and data fetching for a single time trial
 * track detail page (leaderboard, WR history, and flap records).
 */
export function useTTTrackDetail(
    trackId: () => number,
    cc: () => 150 | 200,
    glitchAllowed: () => boolean,
    mode: () => LeaderboardMode,
) {
    const { currentPage, setCurrentPage, pageSize, handlePageSizeChange } =
        usePagination(10);

    const [shroomlessFilter, setShroomlessFilter] =
        createSignal<ShroomlessFilter>("all");
    const [vehicleFilter, setVehicleFilter] = createSignal<VehicleFilter>("all");
    const [driftFilter, setDriftFilter] = createSignal<DriftFilter>("all");
    const [driftCategoryFilter, setDriftCategoryFilter] =
        createSignal<DriftCategoryFilter>("all");

    // Reset page when any server-side filter, CC, glitch, or mode changes
    createEffect(() => {
        cc();
        glitchAllowed();
        mode();
        shroomlessFilter();
        vehicleFilter();
        setCurrentPage(1);
    });

    // Reset page when display-only drift filters change
    createEffect(() => {
        driftFilter();
        driftCategoryFilter();
        setCurrentPage(1);
    });

    // Fetch track info
    const trackQuery = useQuery(() => ({
        queryKey: queryKeys.ttTrack(trackId()),
        queryFn: () => timeTrialApi.getTrack(trackId()),
        staleTime: 1000 * 60 * 60,
    }));

    // Fetch leaderboard - switches between regular and flap based on mode
    const leaderboardQuery = useQuery(() => ({
        queryKey: queryKeys.ttLeaderboard(trackId(), cc(), glitchAllowed(), mode(), shroomlessFilter(), vehicleFilter(), currentPage(), pageSize()),
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

    // FLAP stat - only in regular mode
    const flapQuery = useQuery(() => ({
        queryKey: queryKeys.ttFlap(trackId(), cc(), glitchAllowed(), shroomlessFilter(), vehicleFilter()),
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
        queryKey: queryKeys.ttWrHistory(trackId(), cc(), glitchAllowed(), shroomlessFilter(), vehicleFilter()),
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
        queryKey: queryKeys.ttFlapWrHistory(trackId(), cc(), glitchAllowed(), shroomlessFilter(), vehicleFilter()),
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
            mode() === "flap"
                ? (flapWrHistoryQuery.data ?? [])
                : (wrHistoryQuery.data ?? []);
        const drift = driftFilter();
        const driftCat = driftCategoryFilter();
        return history.filter((s) => matchesDriftFilters(s, drift, driftCat));
    };

    // Active WR history query state - for loading/error display
    const activeWrHistoryQuery = () =>
        mode() === "flap" ? flapWrHistoryQuery : wrHistoryQuery;

    const handleShroomlessFilterChange = (filter: ShroomlessFilter) =>
        setShroomlessFilter(filter);
    const handleVehicleFilterChange = (filter: VehicleFilter) =>
        setVehicleFilter(filter);
    const handleDriftFilterChange = (filter: DriftFilter) =>
        setDriftFilter(filter);
    const handleDriftCategoryFilterChange = (filter: DriftCategoryFilter) =>
        setDriftCategoryFilter(filter);

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
