import { createSignal, createEffect } from "solid-js";
import { leaderboardApi, VRHistoryEntry } from "../services/api/leaderboard";

export interface VRHistoryStats {
  totalChange: number;
  startingVR: number;
  endingVR: number;
  highestVR: number;
  lowestVR: number;
  changesCount: number;
}

export interface ProcessedVRHistory extends VRHistoryEntry {
  formattedDate: string;
}

export function useVRHistory(friendCode: string, initialDays = 30) {
  const [historyData, setHistoryData] = createSignal<ProcessedVRHistory[]>([]);
  const [stats, setStats] = createSignal<VRHistoryStats | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [selectedDays, setSelectedDays] = createSignal(initialDays);

  const fetchHistory = async (days: number) => {
    if (!friendCode) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await leaderboardApi.getPlayerHistory(friendCode, days);

      if (response.history.length === 0) {
        setHistoryData([]);
        setStats(null);
        return;
      }

      const processedData: ProcessedVRHistory[] = response.history.map(
        (entry) => ({
          ...entry,
          formattedDate: new Date(entry.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
        })
      );

      const vrValues = processedData.map((d) => d.totalVR);
      const highestVR = Math.max(...vrValues);
      const lowestVR = Math.min(...vrValues);

      setHistoryData(processedData);
      setStats({
        totalChange: response.totalVRChange,
        startingVR: response.startingVR,
        endingVR: response.endingVR,
        highestVR,
        lowestVR,
        changesCount: processedData.length,
      });
    } catch (err) {
      console.error("Error fetching VR history:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch VR history"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const changePeriod = (days: number) => {
    setSelectedDays(days);
    fetchHistory(days);
  };

  const refresh = () => {
    fetchHistory(selectedDays());
  };

  createEffect(() => {
    if (friendCode) {
      fetchHistory(selectedDays());
    }
  });

  return {
    // Data
    historyData,
    stats,
    selectedDays,

    // State
    isLoading,
    error,

    // Actions
    changePeriod,
    refresh,
  };
}
