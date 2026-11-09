import { createEffect, createMemo } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { legacyLeaderboardApi } from "../services/api/leaderboard";
import { LeaderboardRequest } from "../types";
import { queryKeys } from "../constants/queryKeys";
import { useMiiLoader } from "./useMiiLoader";
import { LEADERBOARD_DEFAULT_PAGE_SIZE, LEADERBOARD_PAGE_SIZES } from "./useLeaderboard";
import { useUrlPagination, useUrlSearch, useUrlSort, useUrlState } from "./useUrlState";

/** The legacy snapshot has no activity data, so rank and VR are its only sort columns. */
const LEGACY_SORT_FIELDS = ["rank", "vr"] as const;

/**
 * Mirrors `useLeaderboard` for the pre-cap legacy leaderboard snapshot, reading the same URL params
 * (`q`, `sort`, `dir`, `page`, `size`). Returns the same shape so both hooks can be used
 * interchangeably.
 *
 * @param options.enabled Turns the query off while the current board is on screen.
 */
export function useLegacyLeaderboard(options: { enabled?: () => boolean } = {}) {
    const state = useUrlState();
    const { currentPage, pageSize, setCurrentPage, handlePageSizeChange, clampTo } =
        useUrlPagination(state, LEADERBOARD_DEFAULT_PAGE_SIZE, LEADERBOARD_PAGE_SIZES);
    const { searchQuery, search, handleSearchInput, clear } = useUrlSearch(state);
    const { sortBy, ascending, handleSort } = useUrlSort(state, LEGACY_SORT_FIELDS);

    const miiLoader = useMiiLoader();

    // Check if legacy is available
    const availabilityQuery = useQuery(() => ({
        queryKey: queryKeys.legacyAvailable,
        queryFn: () => legacyLeaderboardApi.isAvailable(),
        staleTime: 5 * 60 * 1000,
    }));

    const leaderboardRequest = createMemo(
        (): LeaderboardRequest => ({
            page: currentPage(),
            pageSize: pageSize(),
            search: search() || undefined,
            sortBy: sortBy(),
            ascending: ascending(),
        }),
    );

    const leaderboardQuery = useQuery(() => ({
        queryKey: queryKeys.legacyLeaderboard(leaderboardRequest()),
        queryFn: () => legacyLeaderboardApi.getLeaderboard(leaderboardRequest()),
        enabled: availabilityQuery.data === true && (options.enabled?.() ?? true),
    }));

    // Only the board on screen may move the page: the other one can hold cached data with a
    // different page count.
    clampTo(() => ((options.enabled?.() ?? true) ? leaderboardQuery.data?.totalPages : undefined));

    createEffect(() => {
        const players = leaderboardQuery.data?.players;
        if (players && players.length > 0) {
            const friendCodes = players.map((player) => player.friendCode);
            setTimeout(() => {
                miiLoader.loadMiisBatch(friendCodes);
            }, 100);
        }
    });

    return {
        isAvailable: () => availabilityQuery.data === true,
        isCheckingAvailability: () => availabilityQuery.isLoading,
        currentPage,
        pageSize,
        sortBy,
        ascending,
        searchQuery,
        search,
        hasFilters: () => !!search(),
        leaderboardQuery,
        statsQuery: leaderboardQuery, // Stats are embedded in response
        handleSearchInput,
        handleSort,
        handlePageSizeChange,
        setCurrentPage,
        clearFilters: () => clear(),
        clearSearch: () => clear(),
        miiLoader,
        timePeriod: () => "24",
        getVRGain: () => 0,
        refreshLeaderboard: () => leaderboardQuery.refetch(),
    };
}
