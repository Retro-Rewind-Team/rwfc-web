import { createEffect, createMemo, createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { timeTrialApi } from "../services/api/timeTrial";
import { GhostSubmission } from "../types/timeTrial";

export function useTTTrackDetail(trackId: () => number, cc: () => 150 | 200, nonGlitchOnly: () => boolean) {
    const [shroomlessFilter, setShroomlessFilter] = createSignal<"all" | "only" | "exclude">("all");
    const [vehicleFilter, setVehicleFilter] = createSignal<"all" | "bikes" | "karts">("all");
    const [driftFilter, setDriftFilter] = createSignal<"all" | "manual" | "hybrid">("all");
    const [driftCategoryFilter, setDriftCategoryFilter] = createSignal<"all" | "inside" | "outside">("all"); // NEW
  
    // Pagination - default to 10
    const [currentPage, setCurrentPage] = createSignal(1);
    const [pageSize, setPageSize] = createSignal(10);

    // Reset page to 1 when CC or non-glitch filter changes
    createEffect(() => {
        cc();
        nonGlitchOnly();
        setCurrentPage(1);
    });

    // Fetch track info
    const trackQuery = useQuery(() => ({
        queryKey: ["tt-track", trackId()],
        queryFn: () => timeTrialApi.getTrack(trackId()),
        staleTime: 1000 * 60 * 60, // 1 hour
    }));

    // Fetch leaderboard for this track with pagination
    // Note: Backend repository will interpret glitch parameter as:
    // - glitch=true: "Unrestricted" - returns ALL submissions (no filter on Glitch column)
    // - glitch=false: "Non-glitch only" - returns only submissions WHERE Glitch = false
    // When nonGlitchOnly=false (unrestricted mode), we pass true to get all submissions
    // When nonGlitchOnly=true (non-glitch mode), we pass false to exclude glitch submissions
    const glitchParam = () => !nonGlitchOnly();
    
    const leaderboardQuery = useQuery(() => ({
        queryKey: ["tt-leaderboard", trackId(), cc(), glitchParam(), currentPage(), pageSize()],
        queryFn: () => timeTrialApi.getLeaderboard(
            trackId(),
            cc(),
            glitchParam(),
            currentPage(),
            pageSize()
        ),
    }));

    // Fetch world record
    const worldRecordQuery = useQuery(() => ({
        queryKey: ["tt-world-record", trackId(), cc(), glitchParam()],
        queryFn: () => timeTrialApi.getWorldRecord(trackId(), cc(), glitchParam()),
    }));

    // Fetch world record history
    const wrHistoryQuery = useQuery(() => ({
        queryKey: ["tt-wr-history", trackId(), cc(), glitchParam()],
        queryFn: () => timeTrialApi.getWorldRecordHistory(trackId(), cc(), glitchParam()),
    }));

    // Apply filters to submissions
    const filteredSubmissions = createMemo(() => {
        const submissions = leaderboardQuery.data?.submissions || [];
        const vehicleFilterValue = vehicleFilter();
        const driftFilterValue = driftFilter();
        const driftCategoryFilterValue = driftCategoryFilter(); // NEW
        const shroomlessFilterValue = shroomlessFilter();

        return submissions.filter((submission) => {
            // Vehicle filter (bikes/karts)
            if (vehicleFilterValue === "bikes" && submission.vehicleId < 18) return false;
            if (vehicleFilterValue === "karts" && submission.vehicleId >= 18) return false;

            // Drift filter
            if (driftFilterValue === "manual" && submission.driftType !== 0) return false;
            if (driftFilterValue === "hybrid" && submission.driftType !== 1) return false;

            // NEW: Drift category filter
            if (driftCategoryFilterValue === "inside" && submission.driftCategory !== 1) return false;
            if (driftCategoryFilterValue === "outside" && submission.driftCategory !== 0) return false;

            // Shroomless filter
            if (shroomlessFilterValue === "only" && !submission.shroomless) return false;
            if (shroomlessFilterValue === "exclude" && submission.shroomless) return false;

            return true;
        });
    });

    // Reset to page 1 when filters change
    createEffect(() => {
        vehicleFilter();
        driftFilter();
        driftCategoryFilter(); // NEW
        shroomlessFilter();
        setCurrentPage(1);
    });

    const handleShroomlessFilterChange = (filter: "all" | "only" | "exclude") => {
        setShroomlessFilter(filter);
    };

    const handleVehicleFilterChange = (filter: "all" | "bikes" | "karts") => {
        setVehicleFilter(filter);
    };

    const handleDriftFilterChange = (filter: "all" | "manual" | "hybrid") => {
        setDriftFilter(filter);
    };

    // NEW handler
    const handleDriftCategoryFilterChange = (filter: "all" | "inside" | "outside") => {
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
        worldRecordQuery.refetch();
        wrHistoryQuery.refetch();
    };

return {
    // State
    cc: cc(),
    nonGlitchOnly: nonGlitchOnly(),
    shroomlessFilter,
    vehicleFilter,
    driftFilter,
    driftCategoryFilter,
    currentPage,
    pageSize,

    // Computed
    filteredSubmissions,

    // Queries
    trackQuery,
    leaderboardQuery,
    worldRecordQuery,
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