import { createMemo, createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { timeTrialApi } from "../services/api/timeTrial";
import { ShroomlessFilter, VehicleFilter } from "../types/timeTrial";

export function useTTTrackBrowser() {
    const [selectedCategory, setSelectedCategory] = createSignal<
    "retro" | "custom"
  >("retro");
    const [selectedCC, setSelectedCC] = createSignal<150 | 200>(150);
    const [glitchAllowed, setGlitchAllowed] = createSignal<boolean>(true);
    const [shroomlessFilter, setShroomlessFilter] =
    createSignal<ShroomlessFilter>("all");
    const [vehicleFilter, setVehicleFilter] = createSignal<VehicleFilter>("all");
    const [searchQuery, setSearchQuery] = createSignal("");

    // Fetch all tracks - static, cached for 1 hour
    const tracksQuery = useQuery(() => ({
        queryKey: ["tt-tracks"],
        queryFn: () => timeTrialApi.getAllTracks(),
        staleTime: 1000 * 60 * 60,
    }));

    // Fetch world records for the current category combination
    // All filter dimensions are part of the query key so cache entries are per-category
    const worldRecordsQuery = useQuery(() => ({
        queryKey: [
            "tt-world-records-all",
            selectedCC(),
            glitchAllowed(),
            shroomlessFilter(),
            vehicleFilter(),
        ],
        queryFn: () =>
            timeTrialApi.getAllWorldRecords(
                selectedCC(),
                glitchAllowed(),
                shroomlessFilter(),
                vehicleFilter(),
            ),
        staleTime: 1000 * 60 * 5,
    }));

    // Filter and sort tracks by category and search - purely local
    const filteredTracks = createMemo(() => {
        const tracks = tracksQuery.data ?? [];
        const category = selectedCategory();
        const search = searchQuery().toLowerCase();

        return tracks
            .filter((track) => track.category === category)
            .filter(
                (track) => search === "" || track.name.toLowerCase().includes(search),
            )
            .sort((a, b) => a.sortOrder - b.sortOrder);
    });

    // Look up the active WR for a given track from the already-fetched world records
    const getWorldRecordForTrack = (trackId: number) => {
        return createMemo(() => {
            const records = worldRecordsQuery.data ?? [];
            return (
                records.find((r) => r.trackId === trackId)?.activeWorldRecord ?? null
            );
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

    const handleGlitchAllowedChange = (allowed: boolean) => {
        setGlitchAllowed(allowed);
    };

    const handleShroomlessFilterChange = (filter: ShroomlessFilter) => {
        setShroomlessFilter(filter);
    };

    const handleVehicleFilterChange = (filter: VehicleFilter) => {
        setVehicleFilter(filter);
    };

    return {
    // State
        selectedCategory,
        selectedCC,
        glitchAllowed,
        shroomlessFilter,
        vehicleFilter,
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
        handleGlitchAllowedChange,
        handleShroomlessFilterChange,
        handleVehicleFilterChange,
    };
}
