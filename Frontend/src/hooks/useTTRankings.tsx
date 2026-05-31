import { createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { timeTrialApi } from "../services/api/timeTrial";
import { ShroomlessFilter, TrackCategoryFilter, VehicleFilter } from "../types/timeTrial";
import { queryKeys } from "../constants/queryKeys";

/**
 * Manages filter state and data fetching for the time trial player rankings
 * page. Rankings are fetched server-side with full filter and pagination
 * parameters included in the query key.
 */
export function useTTRankings() {
    const [selectedCC, setSelectedCC] = createSignal<150 | 200>(150);
    const [glitchAllowed, setGlitchAllowed] = createSignal<boolean>(true);
    const [shroomlessFilter, setShroomlessFilter] = createSignal<ShroomlessFilter>("all");
    const [vehicleFilter, setVehicleFilter] = createSignal<VehicleFilter>("all");
    const [trackCategoryFilter, setTrackCategoryFilter] =
        createSignal<TrackCategoryFilter>("all");
    const [currentPage, setCurrentPage] = createSignal(1);
    const pageSize = () => 25;

    const resetPage = () => setCurrentPage(1);

    const rankingsQuery = useQuery(() => ({
        queryKey: queryKeys.ttRankings(
            selectedCC(),
            glitchAllowed(),
            shroomlessFilter(),
            vehicleFilter(),
            trackCategoryFilter(),
            currentPage(),
            pageSize(),
        ),
        queryFn: () =>
            timeTrialApi.getRankings(
                selectedCC(),
                glitchAllowed(),
                shroomlessFilter(),
                vehicleFilter(),
                trackCategoryFilter(),
                currentPage(),
                pageSize(),
            ),
        staleTime: 1000 * 60 * 5,
    }));

    const handleCCChange = (cc: 150 | 200) => {
        setSelectedCC(cc);
        resetPage();
    };
    const handleGlitchAllowedChange = (allowed: boolean) => {
        setGlitchAllowed(allowed);
        resetPage();
    };
    const handleShroomlessFilterChange = (filter: ShroomlessFilter) => {
        setShroomlessFilter(filter);
        resetPage();
    };
    const handleVehicleFilterChange = (filter: VehicleFilter) => {
        setVehicleFilter(filter);
        resetPage();
    };
    const handleTrackCategoryFilterChange = (filter: TrackCategoryFilter) => {
        setTrackCategoryFilter(filter);
        resetPage();
    };

    return {
        selectedCC,
        glitchAllowed,
        shroomlessFilter,
        vehicleFilter,
        trackCategoryFilter,
        currentPage,
        setCurrentPage,
        pageSize,
        rankingsQuery,
        handleCCChange,
        handleGlitchAllowedChange,
        handleShroomlessFilterChange,
        handleVehicleFilterChange,
        handleTrackCategoryFilterChange,
    };
}
