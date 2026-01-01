import { createMemo, createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { timeTrialApi } from "../services/api/timeTrial";

export function useTTTrackBrowser() {
    const [selectedCategory, setSelectedCategory] = createSignal<"retro" | "custom">("retro");
    const [selectedCC, setSelectedCC] = createSignal<150 | 200>(150);
    const [searchQuery, setSearchQuery] = createSignal("");

    // Fetch all tracks
    const tracksQuery = useQuery(() => ({
        queryKey: ["tt-tracks"],
        queryFn: () => timeTrialApi.getAllTracks(),
        staleTime: 1000 * 60 * 60, // 1 hour
    }));

    // Fetch all world records in a single request
    const worldRecordsQuery = useQuery(() => ({
        queryKey: ["tt-world-records-all"],
        queryFn: () => timeTrialApi.getAllWorldRecords(),
        // Remove the enabled check since we always want to fetch all records
        staleTime: 1000 * 60 * 5, // 5 minutes
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
            .sort((a, b) => a.id - b.id);
    });

    // Get world record for a specific track (just filtering cached data)
    const getWorldRecordForTrack = (trackId: number) => {
        const records = worldRecordsQuery.data || [];
        const trackRecord = records.find((r) => r.trackId === trackId);
        
        if (!trackRecord) return null;
        
        return selectedCC() === 150 
            ? trackRecord.worldRecord150 
            : trackRecord.worldRecord200;
    };

    const handleSearchInput = (value: string) => {
        setSearchQuery(value);
    };

    const handleCategoryChange = (category: "retro" | "custom") => {
        setSelectedCategory(category);
        setSearchQuery("");
    };

    const handleCCChange = (cc: 150 | 200) => {
        setSelectedCC(cc);
    };

    return {
        // State
        selectedCategory,
        selectedCC,
        searchQuery,

        // Computed
        filteredTracks,

        // Queries
        tracksQuery,
        worldRecordsQuery,

        // Helpers
        getWorldRecordForTrack,

        // Handlers
        handleSearchInput,
        handleCategoryChange,
        handleCCChange,
    };
}