import { createMemo } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { timeTrialApi } from "../services/api/timeTrial";
import { ShroomlessFilter, TrackCategoryFilter, VehicleFilter } from "../types/timeTrial";
import { queryKeys } from "../constants/queryKeys";
import { readEnum, useUrlPagination, useUrlState } from "./useUrlState";

export const TT_RANKINGS_PAGE_SIZE = 25;

/**
 * Filter state and data fetching for the time trial player rankings page. Filters and page live in
 * the URL (`cc`, `glitch=off`, `shroomless`, `vehicle`, `category`, `page`), so a filtered view is
 * shareable. Rankings are fetched server-side with every filter in the query key.
 */
export function useTTRankings() {
    const state = useUrlState();
    const { currentPage, setCurrentPage, clampTo } = useUrlPagination(
        state,
        TT_RANKINGS_PAGE_SIZE,
        [TT_RANKINGS_PAGE_SIZE],
    );
    const pageSize = () => TT_RANKINGS_PAGE_SIZE;

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
    const trackCategoryFilter = createMemo(
        (): TrackCategoryFilter =>
            readEnum(state.get("category"), ["all", "retro", "custom"] as const) ?? "all",
    );

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

    clampTo(() => rankingsQuery.data?.totalPages);

    // Each filter change also clears the page, in the same navigation.
    const handleCCChange = (cc: 150 | 200) =>
        state.update({ cc: cc === 150 ? undefined : cc }, { resetPage: true });
    const handleGlitchAllowedChange = (allowed: boolean) =>
        state.update({ glitch: allowed ? undefined : "off" }, { resetPage: true });
    const handleShroomlessFilterChange = (filter: ShroomlessFilter) =>
        state.update({ shroomless: filter === "all" ? undefined : filter }, { resetPage: true });
    const handleVehicleFilterChange = (filter: VehicleFilter) =>
        state.update({ vehicle: filter === "all" ? undefined : filter }, { resetPage: true });
    const handleTrackCategoryFilterChange = (filter: TrackCategoryFilter) =>
        state.update({ category: filter === "all" ? undefined : filter }, { resetPage: true });

    const hasFilters = createMemo(
        () =>
            selectedCC() !== 150 ||
            !glitchAllowed() ||
            shroomlessFilter() !== "all" ||
            vehicleFilter() !== "all" ||
            trackCategoryFilter() !== "all",
    );
    const clearFilters = () =>
        state.update(
            {
                cc: undefined,
                glitch: undefined,
                shroomless: undefined,
                vehicle: undefined,
                category: undefined,
            },
            { resetPage: true },
        );

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
        hasFilters,
        clearFilters,
        handleCCChange,
        handleGlitchAllowedChange,
        handleShroomlessFilterChange,
        handleVehicleFilterChange,
        handleTrackCategoryFilterChange,
    };
}
