import { useQuery } from "@tanstack/solid-query";
import { api } from "../services/api";
import { createMemo } from "solid-js";

export function usePlayer(friendCode: string) {
    const playerQuery = useQuery(() => ({
        queryKey: ["player", friendCode],
        queryFn: () => api.getPlayer(friendCode),
        refetchInterval: 60000,
    }));

    // Query for legacy player data
    const legacyPlayerQuery = useQuery(() => ({
        queryKey: ["legacyPlayer", friendCode],
        queryFn: () => api.getLegacyPlayer(friendCode),
        retry: false, // Don't retry on failure
        refetchInterval: false, // Legacy data never changes
        enabled: playerQuery.isSuccess, // Only fetch if current player exists
    }));

    const isPlayerNotFound = () => {
        return playerQuery.isError && 
               playerQuery.error instanceof Error && 
               (playerQuery.error.message.includes("404") || 
                playerQuery.error.message.includes("not found"));
    };

    // CreateMemo to make reactive
    const legacyPlayer = createMemo(() => legacyPlayerQuery.data);
    const hasLegacyData = createMemo(() => legacyPlayerQuery.isSuccess);

    return {
        playerQuery,
        player: playerQuery.data,
        isLoading: playerQuery.isLoading,
        isError: playerQuery.isError,
        error: playerQuery.error,
        refetch: playerQuery.refetch,
        
        isPlayerNotFound,
        
        // Legacy data
        legacyPlayerQuery,
        legacyPlayer,
        hasLegacyData,
    };
}