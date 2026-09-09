import { useQuery } from "@tanstack/solid-query";
import { api } from "../services/api";
import { createMemo } from "solid-js";
import { queryKeys } from "../constants/queryKeys";

/**
 * Fetches the current and legacy leaderboard profiles for a given friend code.
 * Legacy data is only requested once the current player query succeeds.
 *
 * @param friendCode Accessor, not a value. The router reuses this component when only the route
 * parameter changes, so reading the code once left both queries pinned to the first player viewed:
 * navigating between two profiles showed the previous one's data.
 */
export function usePlayer(friendCode: () => string) {
    const playerQuery = useQuery(() => ({
        queryKey: queryKeys.player(friendCode()),
        queryFn: () => api.getPlayer(friendCode()),
        refetchInterval: 60000,
    }));

    // Query for legacy player data
    const legacyPlayerQuery = useQuery(() => ({
        queryKey: queryKeys.legacyPlayer(friendCode()),
        queryFn: () => api.getLegacyPlayer(friendCode()),
        retry: false, // Don't retry on failure
        refetchInterval: false, // Legacy data never changes
        enabled: playerQuery.isSuccess, // Only fetch if current player exists
    }));

    const isPlayerNotFound = () => {
        return (
            playerQuery.isError &&
            playerQuery.error instanceof Error &&
            (playerQuery.error.message.includes("404") ||
                playerQuery.error.message.includes("not found"))
        );
    };

    // CreateMemo to make reactive
    const legacyPlayer = createMemo(() => legacyPlayerQuery.data);
    const hasLegacyData = createMemo(() => legacyPlayerQuery.isSuccess);

    return {
        playerQuery,
        // Accessors, not snapshots. Reading the query's fields here captured their value at setup,
        // so a consumer using them never saw the data arrive.
        player: () => playerQuery.data,
        isLoading: () => playerQuery.isLoading,
        isError: () => playerQuery.isError,
        error: () => playerQuery.error,
        refetch: () => playerQuery.refetch(),

        isPlayerNotFound,

        // Legacy data
        legacyPlayerQuery,
        legacyPlayer,
        hasLegacyData,
    };
}
