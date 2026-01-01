import { createEffect, createMemo, createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { timeTrialApi } from "../services/api/timeTrial";
import { GhostSubmission } from "../types/timeTrial";

export function useTTTrackDetail(trackId: number, initialCC: 150 | 200) {
    // Race configuration
    const [selectedCC, setSelectedCC] = createSignal<150 | 200>(initialCC);
  
    // Filters
    const [shroomlessFilter, setShroomlessFilter] = createSignal<"all" | "only" | "exclude">("all");
    const [glitchFilter, setGlitchFilter] = createSignal<"all" | "only" | "exclude">("all");
    const [vehicleFilter, setVehicleFilter] = createSignal<"all" | "bikes" | "karts">("all");
    const [driftFilter, setDriftFilter] = createSignal<"all" | "manual" | "hybrid">("all");
  
    // Pagination - default to 25
    const [currentPage, setCurrentPage] = createSignal(1);
    const [pageSize, setPageSize] = createSignal(25);

    // Fetch track info
    const trackQuery = useQuery(() => ({
        queryKey: ["tt-track", trackId],
        queryFn: () => timeTrialApi.getTrack(trackId),
        staleTime: 1000 * 60 * 60, // 1 hour
    }));

    // Fetch leaderboard for this track with pagination
    const leaderboardQuery = useQuery(() => ({
        queryKey: ["tt-leaderboard", trackId, selectedCC(), currentPage(), pageSize()],
        queryFn: () => timeTrialApi.getLeaderboard(
            trackId,
            selectedCC(),
            currentPage(),
            pageSize()
        ),
    }));

    // Fetch world record
    const worldRecordQuery = useQuery(() => ({
        queryKey: ["tt-world-record", trackId, selectedCC()],
        queryFn: () => timeTrialApi.getWorldRecord(trackId, selectedCC()),
    }));

    // Fetch world record history
    const wrHistoryQuery = useQuery(() => ({
        queryKey: ["tt-wr-history", trackId, selectedCC()],
        queryFn: () => timeTrialApi.getWorldRecordHistory(trackId, selectedCC()),
    }));

    // Apply filters to submissions
    const filteredSubmissions = createMemo(() => {
        const submissions = leaderboardQuery.data?.submissions || [];
        const vehicleFilterValue = vehicleFilter();
        const driftFilterValue = driftFilter();
        const shroomlessFilterValue = shroomlessFilter();
        const glitchFilterValue = glitchFilter();

        return submissions.filter((submission) => {
            // Vehicle filter (bikes/karts)
            if (vehicleFilterValue === "bikes" && submission.vehicleId < 18) return false;
            if (vehicleFilterValue === "karts" && submission.vehicleId >= 18) return false;

            // Drift filter
            if (driftFilterValue === "manual" && submission.driftType !== 0) return false;
            if (driftFilterValue === "hybrid" && submission.driftType !== 1) return false;

            // Shroomless filter
            if (shroomlessFilterValue === "only" && !submission.shroomless) return false;
            if (shroomlessFilterValue === "exclude" && submission.shroomless) return false;

            // Glitch filter
            if (glitchFilterValue === "only" && !submission.glitch) return false;
            if (glitchFilterValue === "exclude" && submission.glitch) return false;

            return true;
        });
    });

    // Reset to page 1 when filters change
    createEffect(() => {
        vehicleFilter();
        driftFilter();
        shroomlessFilter();
        glitchFilter();
        setCurrentPage(1);
    });

    // Reset to page 1 when CC changes
    createEffect(() => {
        selectedCC();
        setCurrentPage(1);
    });

    const handleCCChange = (cc: 150 | 200) => {
        setSelectedCC(cc);
    };

    const handleShroomlessFilterChange = (filter: "all" | "only" | "exclude") => {
        setShroomlessFilter(filter);
    };

    const handleGlitchFilterChange = (filter: "all" | "only" | "exclude") => {
        setGlitchFilter(filter);
    };

    const handleVehicleFilterChange = (filter: "all" | "bikes" | "karts") => {
        setVehicleFilter(filter);
    };

    const handleDriftFilterChange = (filter: "all" | "manual" | "hybrid") => {
        setDriftFilter(filter);
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
        selectedCC,
        shroomlessFilter,
        glitchFilter,
        vehicleFilter,
        driftFilter,
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
        handleCCChange,
        handleShroomlessFilterChange,
        handleGlitchFilterChange,
        handleVehicleFilterChange,
        handleDriftFilterChange,
        handlePageSizeChange,
        handleDownloadGhost,
        refreshAll,

        // Setters
        setCurrentPage,
    };
}