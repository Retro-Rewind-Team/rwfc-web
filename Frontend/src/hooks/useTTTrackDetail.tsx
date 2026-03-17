import { createEffect, createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { timeTrialApi } from "../services/api/timeTrial";
import { GhostSubmission, DriftFilter, DriftCategoryFilter, ShroomlessFilter, VehicleFilter } from "../types/timeTrial";

export function useTTTrackDetail(
    trackId: () => number,
    cc: () => 150 | 200,
    glitchAllowed: () => boolean
) {
    // Category filters — sent to server, affect BKT/WR/FLAP
    const [shroomlessFilter, setShroomlessFilter] = createSignal<ShroomlessFilter>("all");
    const [vehicleFilter, setVehicleFilter] = createSignal<VehicleFilter>("all");

    // Display-only filters — applied client-side, do not affect BKT
    const [driftFilter, setDriftFilter] = createSignal<DriftFilter>("all");
    const [driftCategoryFilter, setDriftCategoryFilter] = createSignal<DriftCategoryFilter>("all");

    // Pagination
    const [currentPage, setCurrentPage] = createSignal(1);
    const [pageSize, setPageSize] = createSignal(10);

    // Reset page when any server-side filter or CC changes
    createEffect(() => {
        cc();
        glitchAllowed();
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

    // Fetch leaderboard — server applies category filters
    const leaderboardQuery = useQuery(() => ({
        queryKey: [
            "tt-leaderboard",
            trackId(),
            cc(),
            glitchAllowed(),
            shroomlessFilter(),
            vehicleFilter(),
            currentPage(),
            pageSize(),
        ],
        queryFn: () => timeTrialApi.getLeaderboard(
            trackId(),
            cc(),
            glitchAllowed(),
            shroomlessFilter(),
            vehicleFilter(),
            currentPage(),
            pageSize()
        ),
    }));

    // Fetch FLAP separately so it reflects the full category, not just the current page
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
            trackId(),
            cc(),
            glitchAllowed(),
            shroomlessFilter(),
            vehicleFilter()
        ),
    }));

    // Fetch WR history — server applies category filters
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
            trackId(),
            cc(),
            glitchAllowed(),
            shroomlessFilter(),
            vehicleFilter()
        ),
    }));

    // Apply display-only filters (drift type/category) client-side
    // These do not affect BKT, WR, or FLAP — purely cosmetic table filtering
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

    // Apply display-only filters to WR history as well
    const filteredWRHistory = () => {
        const history = wrHistoryQuery.data ?? [];
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

    // Reset page when display filters change too, since filtered count may change
    createEffect(() => {
        driftFilter();
        driftCategoryFilter();
        setCurrentPage(1);
    });

    const handleShroomlessFilterChange = (filter: ShroomlessFilter) => {
        setShroomlessFilter(filter);
    };

    const handleVehicleFilterChange = (filter: VehicleFilter) => {
        setVehicleFilter(filter);
    };

    const handleDriftFilterChange = (filter: DriftFilter) => {
        setDriftFilter(filter);
    };

    const handleDriftCategoryFilterChange = (filter: DriftCategoryFilter) => {
        setDriftCategoryFilter(filter);
    };

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
        flapQuery.refetch();
        wrHistoryQuery.refetch();
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
        trackQuery,
        leaderboardQuery,
        flapQuery,
        wrHistoryQuery,

        // Handlers
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
