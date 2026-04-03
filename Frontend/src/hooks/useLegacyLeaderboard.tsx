import { createEffect, createMemo, createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { legacyLeaderboardApi } from "../services/api/leaderboard";
import { LeaderboardRequest } from "../types";
import { queryKeys } from "../constants/queryKeys";
import { useMiiLoader } from "./useMiiLoader";
import { usePagination } from "./usePagination";
import { useDebouncedSearch } from "./useDebouncedSearch";

/**
 * Mirrors `useLeaderboard` for the pre-cap legacy leaderboard snapshot.
 * Returns the same shape so both hooks can be used interchangeably.
 */
export function useLegacyLeaderboard() {
    const { currentPage, setCurrentPage, pageSize, handlePageSizeChange } =
        usePagination(50);
    const { searchQuery, search, handleSearchInput } = useDebouncedSearch();

    const [sortBy, setSortBy] = createSignal("rank");
    const [ascending, setAscending] = createSignal(true);

    const miiLoader = useMiiLoader();

    // Check if legacy is available
    const availabilityQuery = useQuery(() => ({
        queryKey: queryKeys.legacyAvailable,
        queryFn: () => legacyLeaderboardApi.isAvailable(),
        staleTime: 5 * 60 * 1000,
    }));

    // Reset to page 1 when the debounced search value changes
    createEffect(() => { search(); setCurrentPage(1); });

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
        enabled: availabilityQuery.data === true,
    }));

    createEffect(() => {
        const players = leaderboardQuery.data?.players;
        if (players && players.length > 0) {
            const friendCodes = players.map((player) => player.friendCode);
            setTimeout(() => {
                miiLoader.loadMiisBatch(friendCodes);
            }, 100);
        }
    });

    const handleSort = (field: string) => {
        if (sortBy() === field) {
            setAscending(!ascending());
        } else {
            setSortBy(field);
            setAscending(field === "rank");
        }
        setCurrentPage(1);
    };

    return {
        isAvailable: () => availabilityQuery.data === true,
        isCheckingAvailability: () => availabilityQuery.isLoading,
        currentPage,
        pageSize,
        sortBy,
        ascending,
        searchQuery,
        leaderboardQuery,
        statsQuery: leaderboardQuery, // Stats are embedded in response
        handleSearchInput,
        handleSort,
        handlePageSizeChange,
        setCurrentPage,
        miiLoader,
        timePeriod: () => "24",
        getVRGain: () => 0,
        refreshLeaderboard: () => leaderboardQuery.refetch(),
    };
}
