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

    // Fetch world records for all filtered tracks
    const worldRecordsQuery = useQuery(() => ({
        queryKey: ["tt-world-records-overview", selectedCategory(), selectedCC()],
        queryFn: async () => {
            const tracks = filteredTracks();
            if (tracks.length === 0) return [];

            // Fetch world record for each track
            const records = await Promise.all(
                tracks.map(async (track) => {
                    try {
                        const wr = await timeTrialApi.getWorldRecord(track.id, selectedCC());
                        return { trackId: track.id, record: wr };
                    } catch {
                        return { trackId: track.id, record: null };
                    }
                })
            );

            return records;
        },
        enabled: () => filteredTracks().length > 0,
    }));

    // Get world record for a specific track
    const getWorldRecordForTrack = (trackId: number) => {
        const records = worldRecordsQuery.data || [];
        return records.find((r) => r.trackId === trackId)?.record || null;
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