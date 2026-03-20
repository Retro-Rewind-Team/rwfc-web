import { createEffect, createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { timeTrialApi } from "../services/api/timeTrial";
import { GhostSubmission, DriftFilter, DriftCategoryFilter, ShroomlessFilter, VehicleFilter, LeaderboardMode } from "../types/timeTrial";

export function useTTTrackDetail(
    trackId: () => number,
    cc: () => 150 | 200,
    glitchAllowed: () => boolean,
    mode: () => LeaderboardMode
) {
    const [shroomlessFilter, setShroomlessFilter] = createSignal<ShroomlessFilter>("all");
    const [vehicleFilter, setVehicleFilter] = createSignal<VehicleFilter>("all");
    const [driftFilter, setDriftFilter] = createSignal<DriftFilter>("all");
    const [driftCategoryFilter, setDriftCategoryFilter] = createSignal<DriftCategoryFilter>("all");
    const [currentPage, setCurrentPage] = createSignal(1);
    const [pageSize, setPageSize] = createSignal(10);

    // Reset page when any server-side filter, CC, glitch, or mode changes
    createEffect(() => {
        cc();
        glitchAllowed();
        mode();
        shroomlessFilter();
        vehicleFilter();
        setCurrentPage(1);
    });

    // Fetch track info
    const trackQuery = useQuery(() => ({
        queryKey: ["tt-track", trackId()],
        queryFn: () => timeTrialApi.getTrack(trackId()),
        staleTime: 1000 * 60 * 60,
    }));

    // Fetch leaderboard - switches between regular and flap based on mode
    const leaderboardQuery = useQuery(() => ({
        queryKey: [
            "tt-leaderboard",
            trackId(),
            cc(),
            glitchAllowed(),
            mode(),
            shroomlessFilter(),
            vehicleFilter(),
            currentPage(),
            pageSize(),
        ],
        queryFn: () => mode() === "flap"
            ? timeTrialApi.getFlapLeaderboard(
                trackId(), cc(), glitchAllowed(),
                shroomlessFilter(), vehicleFilter(),
                currentPage(), pageSize()
            )
            : timeTrialApi.getLeaderboard(
                trackId(), cc(), glitchAllowed(),
                shroomlessFilter(), vehicleFilter(),
                currentPage(), pageSize()
            ),
    }));

    // FLAP stat - only in regular mode
    const flapQuery = useQuery(() => ({
        queryKey: [
            "tt-flap",
            trackId(),
            cc(),
            glitchAllowed(),
            shroomlessFilter(),
            vehicleFilter(),
        ],
        queryFn: () => timeTrialApi.getFastestLap(
            trackId(), cc(), glitchAllowed(),
            shroomlessFilter(), vehicleFilter()
        ),
        enabled: mode() === "regular",
    }));

    // Regular WR history - only in regular mode
    const wrHistoryQuery = useQuery(() => ({
        queryKey: [
            "tt-wr-history",
            trackId(),
            cc(),
            glitchAllowed(),
            shroomlessFilter(),
            vehicleFilter(),
        ],
        queryFn: () => timeTrialApi.getWorldRecordHistory(
            trackId(), cc(), glitchAllowed(),
            shroomlessFilter(), vehicleFilter()
        ),
        enabled: mode() === "regular",
    }));

    // Flap WR history - only in flap mode
    const flapWrHistoryQuery = useQuery(() => ({
        queryKey: [
            "tt-flap-wr-history",
            trackId(),
            cc(),
            glitchAllowed(),
            shroomlessFilter(),
            vehicleFilter(),
        ],
        queryFn: () => timeTrialApi.getFlapWorldRecordHistory(
            trackId(), cc(), glitchAllowed(),
            shroomlessFilter(), vehicleFilter()
        ),
        enabled: mode() === "flap",
    }));

    // Apply display-only drift filters client-side
    const filteredSubmissions = () => {
        const submissions = leaderboardQuery.data?.submissions ?? [];
        const drift = driftFilter();
        const driftCat = driftCategoryFilter();
        return submissions.filter((submission) => {
            if (drift === "manual" && submission.driftType !== 0) return false;
            if (drift === "hybrid" && submission.driftType !== 1) return false;
            if (driftCat === "inside" && submission.driftCategory !== 1) return false;
            if (driftCat === "outside" && submission.driftCategory !== 0) return false;
            return true;
        });
    };

    // Active WR history - whichever mode is current
    const activeWrHistory = () =>
        mode() === "flap"
            ? (flapWrHistoryQuery.data ?? [])
            : (wrHistoryQuery.data ?? []);

    const filteredWRHistory = () => {
        const history = activeWrHistory();
        const drift = driftFilter();
        const driftCat = driftCategoryFilter();
        return history.filter((submission) => {
            if (drift === "manual" && submission.driftType !== 0) return false;
            if (drift === "hybrid" && submission.driftType !== 1) return false;
            if (driftCat === "inside" && submission.driftCategory !== 1) return false;
            if (driftCat === "outside" && submission.driftCategory !== 0) return false;
            return true;
        });
    };

    // Active WR history query state - for loading/error display
    const activeWrHistoryQuery = () =>
        mode() === "flap" ? flapWrHistoryQuery : wrHistoryQuery;

    // Reset page when display filters change
    createEffect(() => {
        driftFilter();
        driftCategoryFilter();
        setCurrentPage(1);
    });

    const handleShroomlessFilterChange = (filter: ShroomlessFilter) => setShroomlessFilter(filter);
    const handleVehicleFilterChange = (filter: VehicleFilter) => setVehicleFilter(filter);
    const handleDriftFilterChange = (filter: DriftFilter) => setDriftFilter(filter);
    const handleDriftCategoryFilterChange = (filter: DriftCategoryFilter) => setDriftCategoryFilter(filter);
    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    const handleDownloadGhost = async (submission: GhostSubmission) => {
        try {
            const blob = await timeTrialApi.downloadGhost(submission.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${submission.finishTimeDisplay.replace(":", "m").replace(".", "s")}.rkg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
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
        // State
        shroomlessFilter,
        vehicleFilter,
        driftFilter,
        driftCategoryFilter,
        currentPage,
        pageSize,

        // Computed
        filteredSubmissions,
        filteredWRHistory,

        // Queries
        activeWrHistoryQuery,
        trackQuery,
        leaderboardQuery,
        flapQuery,
        wrHistoryQuery,

        // Handlers
        flapWrHistoryQuery,
        handleShroomlessFilterChange,
        handleVehicleFilterChange,
        handleDriftFilterChange,
        handleDriftCategoryFilterChange,
        handlePageSizeChange,
        handleDownloadGhost,
        refreshAll,

        // Setters
        setCurrentPage,
    };
}
