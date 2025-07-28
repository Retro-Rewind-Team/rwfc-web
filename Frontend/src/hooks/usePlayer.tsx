import { useQuery } from "@tanstack/solid-query";
import { api } from "../services/api";

export function usePlayer(friendCode: string) {
  const playerQuery = useQuery(() => ({
    queryKey: ["player", friendCode],
    queryFn: () => api.getPlayer(friendCode),
    refetchInterval: 60000,
  }));

  return {
    playerQuery,
    player: playerQuery.data,
    isLoading: playerQuery.isLoading,
    isError: playerQuery.isError,
    error: playerQuery.error,
    refetch: playerQuery.refetch,
  };
}
