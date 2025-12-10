import { createEffect, createMemo, createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { legacyLeaderboardApi } from "../services/api/leaderboard";
import { LeaderboardRequest } from "../types";
import { useMiiLoader } from "./useMiiLoader";

export function useLegacyLeaderboard() {
    const [currentPage, setCurrentPage] = createSignal(1);
    const [pageSize, setPageSize] = createSignal(50);
    const [search, setSearch] = createSignal("");
    const [sortBy, setSortBy] = createSignal("rank");
    const [ascending, setAscending] = createSignal(true);
    const [searchQuery, setSearchQuery] = createSignal("");

    const miiLoader = useMiiLoader();

    // Check if legacy is available
    const availabilityQuery = useQuery(() => ({
        queryKey: ["legacyAvailable"],
        queryFn: () => legacyLeaderboardApi.isAvailable(),
        staleTime: 5 * 60 * 1000,
    }));

    // Debounced search
    let searchTimeout: ReturnType<typeof setTimeout>;
    const handleSearchInput = (value: string) => {
        setSearchQuery(value);
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            setSearch(value);
            setCurrentPage(1);
        }, 300);
    };

    const leaderboardRequest = createMemo(
        (): LeaderboardRequest => ({
            page: currentPage(),
            pageSize: pageSize(),
            search: search() || undefined,
            activeOnly: false, // Not relevant for legacy
            sortBy: sortBy(),
            ascending: ascending(),
        })
    );

    const leaderboardQuery = useQuery(() => ({
        queryKey: ["legacyLeaderboard", leaderboardRequest()],
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

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
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
        // Legacy doesn't need these but keep for compatibility
        activeOnly: () => false,
        timePeriod: () => "24",
        handleActiveOnlyChange: () => {},
        handleTimePeriodChange: () => {},
        getVRGain: () => 0,
        refreshLeaderboard: () => leaderboardQuery.refetch(),
    };
}