import { createMemo } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { timeTrialApi } from "../services/api/timeTrial";
import { ShroomlessFilter, VehicleFilter } from "../types/timeTrial";
import { queryKeys } from "../constants/queryKeys";
import { readEnum, useUrlSearch, useUrlState } from "./useUrlState";

/**
 * Manages filter state and data fetching for the time trial track browser.
 * Track list and world records are fetched once and filtered locally. Category, CC, filters and the
 * search text are URL params (`category`, `cc`, `glitch=off`, `shroomless`, `vehicle`, `q`), so a
 * view can be shared.
 */
export function useTTTrackBrowser() {
    const state = useUrlState();
    const { searchQuery, search, handleSearchInput, clear } = useUrlSearch(state);

    const selectedCategory = createMemo((): "retro" | "custom" =>
        state.get("category") === "custom" ? "custom" : "retro",
    );
    const selectedCC = createMemo((): 150 | 200 => (state.get("cc") === "200" ? 200 : 150));
    const glitchAllowed = createMemo(() => state.get("glitch") !== "off");
    const shroomlessFilter = createMemo(
        (): ShroomlessFilter =>
            readEnum(state.get("shroomless"), ["all", "only", "exclude"] as const) ?? "all",
    );
    const vehicleFilter = createMemo(
        (): VehicleFilter =>
            readEnum(state.get("vehicle"), ["all", "karts", "bikes"] as const) ?? "all",
    );

    // Fetch all tracks - static, cached for 1 hour
    const tracksQuery = useQuery(() => ({
        queryKey: queryKeys.ttTracks,
        queryFn: () => timeTrialApi.getAllTracks(),
        staleTime: 1000 * 60 * 60,
    }));

    // Fetch world records for the current category combination
    // All filter dimensions are part of the query key so cache entries are per-category
    const worldRecordsQuery = useQuery(() => ({
        queryKey: queryKeys.ttWorldRecordsAll(
            selectedCC(),
            glitchAllowed(),
            shroomlessFilter(),
            vehicleFilter(),
        ),
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
        const needle = search().toLowerCase();

        return tracks
            .filter((track) => track.category === category)
            .filter((track) => needle === "" || track.name.toLowerCase().includes(needle))
            .sort((a, b) => a.sortOrder - b.sortOrder);
    });

    // Switching category drops the search: a name from one list rarely means anything in the other.
    const handleCategoryChange = (category: "retro" | "custom") =>
        clear({ category: category === "retro" ? undefined : category });

    const handleCCChange = (cc: 150 | 200) => state.update({ cc: cc === 150 ? undefined : cc });
    const handleGlitchAllowedChange = (allowed: boolean) =>
        state.update({ glitch: allowed ? undefined : "off" });
    const handleShroomlessFilterChange = (filter: ShroomlessFilter) =>
        state.update({ shroomless: filter === "all" ? undefined : filter });
    const handleVehicleFilterChange = (filter: VehicleFilter) =>
        state.update({ vehicle: filter === "all" ? undefined : filter });

    const clearSearch = () => clear();

    return {
        // State
        selectedCategory,
        selectedCC,
        glitchAllowed,
        shroomlessFilter,
        vehicleFilter,
        searchQuery,
        search,

        // Computed
        filteredTracks,

        // Queries
        tracksQuery,
        worldRecordsQuery,

        // Handlers
        handleSearchInput,
        handleCategoryChange,
        clearSearch,
        handleCCChange,
        handleGlitchAllowedChange,
        handleShroomlessFilterChange,
        handleVehicleFilterChange,
    };
}
