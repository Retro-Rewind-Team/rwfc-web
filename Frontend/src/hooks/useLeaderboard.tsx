import { createEffect, createMemo, createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { leaderboardApi } from "../services/api/leaderboard";
import { LeaderboardRequest, Player } from "../types";
import { queryKeys } from "../constants/queryKeys";
import { useMiiLoader } from "./useMiiLoader";
import { usePagination } from "./usePagination";
import { useDebouncedSearch } from "./useDebouncedSearch";

/**
 * Manages search, sort, pagination, time-period selection, and Mii loading
 * for the main VR leaderboard.
 */
export function useLeaderboard() {
    const { currentPage, setCurrentPage, pageSize, handlePageSizeChange } =
        usePagination(50);
    const { searchQuery, search, handleSearchInput } = useDebouncedSearch();

    const [sortBy, setSortBy] = createSignal("rank");
    const [ascending, setAscending] = createSignal(true);
    const [timePeriod, setTimePeriod] = createSignal("24");

    const miiLoader = useMiiLoader();

    // Reset to page 1 when the debounced search value changes
    createEffect(() => { search(); setCurrentPage(1); });

    // Create the request object
    const leaderboardRequest = createMemo(
        (): LeaderboardRequest => ({
            page: currentPage(),
            pageSize: pageSize(),
            search: search() || undefined,
            sortBy: sortBy(),
            ascending: ascending(),
            timePeriod: timePeriod(),
        }),
    );

    // Queries
    const statsQuery = useQuery(() => ({
        queryKey: queryKeys.stats,
        queryFn: () => leaderboardApi.getStats(),
        refetchInterval: 60000,
    }));

    const leaderboardQuery = useQuery(() => ({
        queryKey: queryKeys.leaderboard(leaderboardRequest()),
        queryFn: () => leaderboardApi.getLeaderboard(leaderboardRequest()),
        refetchInterval: 60000,
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
            setAscending(false);
            if (field === "rank") {
                setAscending(true);
            }
        }
        setCurrentPage(1);
    };

    const handleTimePeriodChange = (period: string) => {
        setTimePeriod(period);

        // Update sort field if currently sorting by VR gain
        const currentSort = sortBy();
        if (
            currentSort === "vrgain24" ||
      currentSort === "vrgain7" ||
      currentSort === "vrgain30"
        ) {
            // Map the period to the correct VR gain field
            let newSortField;
            if (period === "24") {
                newSortField = "vrgain24";
            } else if (period === "week") {
                newSortField = "vrgain7";
            } else {
                newSortField = "vrgain30";
            }
            setSortBy(newSortField);
        }

        setCurrentPage(1);
    };

    const getVRGain = (player: Player) => {
        switch (timePeriod()) {
        case "week":
            return player.vrStats.lastWeek;
        case "month":
            return player.vrStats.lastMonth;
        default:
            return player.vrStats.last24Hours;
        }
    };

    const refreshLeaderboard = () => {
        leaderboardQuery.refetch();
        statsQuery.refetch();
    };

    return {
    // State
        currentPage,
        pageSize,
        search,
        sortBy,
        ascending,
        searchQuery,
        timePeriod,

        // Queries
        statsQuery,
        leaderboardQuery,

        // Handlers
        handleSearchInput,
        handleSort,
        handleTimePeriodChange,
        handlePageSizeChange,
        getVRGain,
        refreshLeaderboard,

        // Setters for pagination
        setCurrentPage,

        // Mii loader
        miiLoader,
    };
}
