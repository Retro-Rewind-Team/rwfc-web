import { createMemo, createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { timeTrialApi } from "../services/api/timeTrial";

export function useTTTrackBrowser() {
    const [selectedCategory, setSelectedCategory] = createSignal<"retro" | "custom">("retro");
    const [selectedCC, setSelectedCC] = createSignal<150 | 200>(150);
    const [selectedNonGlitchOnly, setSelectedNonGlitchOnly] = createSignal<boolean>(false); // false = all times, true = non-glitch only
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

    // Get world record for a specific track (filtering cached data)
    // Returns a function that creates a memo for each track
    const getWorldRecordForTrack = (trackId: number) => {
        return createMemo(() => {
            const records = worldRecordsQuery.data || [];
            const trackRecord = records.find((r) => r.trackId === trackId);
            
            if (!trackRecord) return null;
            
            // Select correct WR based on CC and non-glitch filter
            const cc = selectedCC();
            const nonGlitchOnly = selectedNonGlitchOnly();
            
            // When nonGlitchOnly is true, show non-glitch WRs (glitch=false)
            // When false (unrestricted), show all times WRs (glitch=true), fallback to non-glitch if not available
            if (nonGlitchOnly) {
                return cc === 150 ? trackRecord.worldRecord150 : trackRecord.worldRecord200;
            } else {
                // For unrestricted, try glitch WR first, fallback to non-glitch WR
                const unrestrictedWR = cc === 150 ? trackRecord.worldRecord150Glitch : trackRecord.worldRecord200Glitch;
                const fallbackWR = cc === 150 ? trackRecord.worldRecord150 : trackRecord.worldRecord200;
                return unrestrictedWR || fallbackWR;
            }
        });
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

    const handleNonGlitchOnlyChange = (nonGlitchOnly: boolean) => {
        setSelectedNonGlitchOnly(nonGlitchOnly);
    };

    return {
        // State
        selectedCategory,
        selectedCC,
        selectedNonGlitchOnly,
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
        handleNonGlitchOnlyChange,
    };
}