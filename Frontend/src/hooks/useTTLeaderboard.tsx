import { createEffect, createMemo, createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { timeTrialApi } from "../services/api/timeTrial";
import { GhostSubmission, Track } from "../types/timeTrial";

export function useTTLeaderboard() {
    // Track selection state
    const [selectedCategory, setSelectedCategory] = createSignal<"retro" | "custom">("retro");
    const [selectedTrack, setSelectedTrack] = createSignal<Track | null>(null);
    const [searchQuery, setSearchQuery] = createSignal("");
  
    // Race configuration
    const [selectedCC, setSelectedCC] = createSignal<150 | 200>(150);
  
    // Filters
    const [vehicleFilter, setVehicleFilter] = createSignal<"all" | "bikes" | "karts">("all");
    const [driftFilter, setDriftFilter] = createSignal<"all" | "manual" | "hybrid">("all");
    const [categoryFilter, setCategoryFilter] = createSignal<"all" | "glitch" | "shroomless" | "normal">("all");
  
    // Pagination
    const [currentPage, setCurrentPage] = createSignal(1);
    const [pageSize, setPageSize] = createSignal(50);

    // Fetch all tracks
    const tracksQuery = useQuery(() => ({
        queryKey: ["tt-tracks"],
        queryFn: () => timeTrialApi.getAllTracks(),
        staleTime: 1000 * 60 * 60, // 1 hour
    }));

    // Filter tracks by category and search
    const filteredTracks = createMemo(() => {
        const tracks = tracksQuery.data || [];
        const category = selectedCategory();
        const search = searchQuery().toLowerCase();

        return tracks
            .filter((track) => track.category === category)
            .filter((track) => 
                search === "" || track.name.toLowerCase().includes(search)
            )
            .sort((a, b) => a.name.localeCompare(b.name));
    });

    // Fetch leaderboard for selected track with pagination
    const leaderboardQuery = useQuery(() => ({
        queryKey: ["tt-leaderboard", selectedTrack()?.id, selectedCC(), currentPage(), pageSize()],
        queryFn: () => {
            const track = selectedTrack();
            if (!track) return null;
            return timeTrialApi.getLeaderboard(
                track.id,
                selectedCC(),
                currentPage(),
                pageSize()
            );
        },
        enabled: !!selectedTrack(),
    }));

    // Fetch world record
    const worldRecordQuery = useQuery(() => ({
        queryKey: ["tt-world-record", selectedTrack()?.id, selectedCC()],
        queryFn: () => {
            const track = selectedTrack();
            if (!track) return null;
            return timeTrialApi.getWorldRecord(track.id, selectedCC());
        },
        enabled: !!selectedTrack(),
    }));

    // Fetch world record history
    const wrHistoryQuery = useQuery(() => ({
        queryKey: ["tt-wr-history", selectedTrack()?.id, selectedCC()],
        queryFn: () => {
            const track = selectedTrack();
            if (!track) return null;
            return timeTrialApi.getWorldRecordHistory(track.id, selectedCC());
        },
        enabled: !!selectedTrack(),
    }));

    // Apply filters to submissions
    const filteredSubmissions = createMemo(() => {
        const submissions = leaderboardQuery.data?.submissions || [];
        const vehicleFilterValue = vehicleFilter();
        const driftFilterValue = driftFilter();
        const categoryFilterValue = categoryFilter();

        return submissions.filter((submission) => {
            // Vehicle filter (bikes/karts)
            if (vehicleFilterValue === "bikes" && submission.vehicleId < 18) return false;
            if (vehicleFilterValue === "karts" && submission.vehicleId >= 18) return false;

            // Drift filter
            if (driftFilterValue === "manual" && submission.driftType !== 0) return false;
            if (driftFilterValue === "hybrid" && submission.driftType !== 1) return false;

            // Category filter (glitch/shroomless/normal)
            if (categoryFilterValue === "glitch" && !submission.glitch) return false;
            if (categoryFilterValue === "shroomless" && !submission.shroomless) return false;
            if (categoryFilterValue === "normal" && (submission.glitch || submission.shroomless)) return false;

            return true;
        });
    });

    // Auto-select first track when category changes
    createEffect(() => {
        const tracks = filteredTracks();
        if (tracks.length > 0 && !selectedTrack()) {
            setSelectedTrack(tracks[0]);
        }
    });

    // Reset to page 1 when filters change
    createEffect(() => {
        vehicleFilter();
        driftFilter();
        categoryFilter();
        setCurrentPage(1);
    });

    const handleSearchInput = (value: string) => {
        setSearchQuery(value);
    };

    const handleCategoryChange = (category: "retro" | "custom") => {
        setSelectedCategory(category);
        setSelectedTrack(null);
        setSearchQuery("");
        setCurrentPage(1);
    };

    const handleTrackSelect = (track: Track) => {
        setSelectedTrack(track);
        setCurrentPage(1);
    };

    const handleCCChange = (cc: 150 | 200) => {
        setSelectedCC(cc);
        setCurrentPage(1);
    };

    const handleVehicleFilterChange = (filter: "all" | "bikes" | "karts") => {
        setVehicleFilter(filter);
    };

    const handleDriftFilterChange = (filter: "all" | "manual" | "hybrid") => {
        setDriftFilter(filter);
    };

    const handleCategoryFilterChange = (filter: "all" | "glitch" | "shroomless" | "normal") => {
        setCategoryFilter(filter);
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

    const refreshLeaderboard = () => {
        leaderboardQuery.refetch();
        worldRecordQuery.refetch();
        wrHistoryQuery.refetch();
    };

    return {
    // State
        selectedCategory,
        selectedTrack,
        searchQuery,
        selectedCC,
        vehicleFilter,
        driftFilter,
        categoryFilter,
        currentPage,
        pageSize,

        // Computed
        filteredTracks,
        filteredSubmissions,

        // Queries
        tracksQuery,
        leaderboardQuery,
        worldRecordQuery,
        wrHistoryQuery,

        // Handlers
        handleSearchInput,
        handleCategoryChange,
        handleTrackSelect,
        handleCCChange,
        handleVehicleFilterChange,
        handleDriftFilterChange,
        handleCategoryFilterChange,
        handlePageSizeChange,
        handleDownloadGhost,
        refreshLeaderboard,

        // Setters
        setCurrentPage,
    };
}