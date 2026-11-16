import { createEffect, createMemo } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { leaderboardApi } from "../services/api/leaderboard";
import { LeaderboardRequest, Player } from "../types";
import { queryKeys } from "../constants/queryKeys";
import { useMiiLoader } from "./useMiiLoader";
import {
    readEnum,
    readInt,
    useUrlPagination,
    useUrlSearch,
    useUrlSort,
    useUrlState,
} from "./useUrlState";

export const LEADERBOARD_PAGE_SIZES = [10, 25, 50] as const;
export const LEADERBOARD_DEFAULT_PAGE_SIZE = 50;

export const VR_SORT_FIELDS = [
    "rank",
    "vr",
    "lastSeen",
    "vrgain24",
    "vrgain7",
    "vrgain30",
] as const;
export const TIME_PERIODS = ["24", "week", "month"] as const;
export const ACTIVE_DAY_OPTIONS = [7, 14, 30] as const;
export type VehicleFilter = "kart" | "bike";

/**
 * Search, sort, pagination, filters and Mii loading for the main VR leaderboard.
 *
 * All of it is in the query string (`q`, `sort`, `dir`, `page`, `size`, `period`, `active`,
 * `vehicle`), so a view can be shared and Back steps through it. Anything equal to its default is
 * left out of the URL.
 *
 * @param options.enabled Turns the query off while another board is on screen.
 */
export function useLeaderboard(options: { enabled?: () => boolean } = {}) {
    const state = useUrlState();
    const { currentPage, pageSize, setCurrentPage, handlePageSizeChange, clampTo } =
        useUrlPagination(state, LEADERBOARD_DEFAULT_PAGE_SIZE, LEADERBOARD_PAGE_SIZES);
    const { searchQuery, search, handleSearchInput, clear } = useUrlSearch(state);
    const { sortBy, ascending, handleSort } = useUrlSort(state, VR_SORT_FIELDS);

    const timePeriod = createMemo(() => readEnum(state.get("period"), TIME_PERIODS) ?? "24");
    const activeDays = createMemo((): number | null => {
        const days = readInt(state.get("active"));
        return days !== undefined && (ACTIVE_DAY_OPTIONS as readonly number[]).includes(days)
            ? days
            : null;
    });
    const vehicleFilter = createMemo(() =>
        readEnum(state.get("vehicle"), ["kart", "bike"] as const),
    );

    const miiLoader = useMiiLoader();

    const leaderboardRequest = createMemo(
        (): LeaderboardRequest => ({
            page: currentPage(),
            pageSize: pageSize(),
            search: search() || undefined,
            sortBy: sortBy(),
            ascending: ascending(),
            activeDays: activeDays() ?? undefined,
            vehicleFilter: vehicleFilter(),
        }),
    );

    // Queries
    const statsQuery = useQuery(() => ({
        queryKey: queryKeys.stats,
        queryFn: () => leaderboardApi.getStats(),
        refetchInterval: 60000,
        enabled: options.enabled?.() ?? true,
    }));

    const leaderboardQuery = useQuery(() => ({
        queryKey: queryKeys.leaderboard(leaderboardRequest()),
        queryFn: () => leaderboardApi.getLeaderboard(leaderboardRequest()),
        refetchInterval: 60000,
        enabled: options.enabled?.() ?? true,
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

    const handleTimePeriodChange = (period: string) => {
        // The VR change column follows the period. If it is the sort column, keep sorting by it.
        const gainField: Record<string, string> = {
            "24": "vrgain24",
            week: "vrgain7",
            month: "vrgain30",
        };
        const current = sortBy();
        const sorting = current.startsWith("vrgain") ? { sort: gainField[period] } : {};
        state.update(
            { period: period === "24" ? undefined : period, ...sorting },
            { resetPage: true },
        );
    };

    const handleActiveDaysChange = (days: number | null) =>
        state.update({ active: days }, { resetPage: true });

    const handleVehicleFilterChange = (filter: VehicleFilter | undefined) =>
        state.update({ vehicle: filter }, { resetPage: true });

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

    const hasFilters = createMemo(
        () => !!search() || activeDays() !== null || vehicleFilter() !== undefined,
    );
    /** Clears search and every filter, keeping sort and page size. */
    const clearFilters = () => clear({ active: undefined, vehicle: undefined });
    const clearSearch = () => clear();

    return {
        // State
        currentPage,
        pageSize,
        search,
        sortBy,
        ascending,
        searchQuery,
        timePeriod,
        activeDays,
        vehicleFilter,
        hasFilters,

        // Queries
        statsQuery,
        leaderboardQuery,

        // Handlers
        handleSearchInput,
        handleSort,
        handleTimePeriodChange,
        handleActiveDaysChange,
        handleVehicleFilterChange,
        handlePageSizeChange,
        getVRGain,
        refreshLeaderboard,
        clearFilters,
        clearSearch,

        // Setters for pagination
        setCurrentPage,

        // Mii loader
        miiLoader,
    };
}
