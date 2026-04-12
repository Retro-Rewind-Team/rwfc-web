import { createSignal, onMount } from "solid-js";
import { leaderboardApi } from "../services/api/leaderboard";
import { VRHistoryEntry } from "../types";

/** Aggregate statistics derived from a player's fetched VR history window. */
export interface VRHistoryStats {
    totalChange: number;
    startingVR: number;
    endingVR: number;
    highestVR: number;
    lowestVR: number;
    changesCount: number;
}

/** A `VRHistoryEntry` enriched with a pre-formatted date string for display. */
export interface ProcessedVRHistory extends VRHistoryEntry {
    formattedDate: string;
}

/**
 * Fetches and processes a player's VR change history. All data points are
 * returned as-is - the chart handles display density via nearest-point hover snap.
 */
export function useVRHistory(friendCode: string, initialDays = 30) {
    const [historyData, setHistoryData] = createSignal<ProcessedVRHistory[]>([]);
    const [stats, setStats] = createSignal<VRHistoryStats | null>(null);
    const [isLoading, setIsLoading] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    const [selectedDays, setSelectedDays] = createSignal<number | null>(initialDays);

    const fetchHistory = async (days: number | null) => {
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

            const processedData: ProcessedVRHistory[] = response.history.map((entry) => ({
                ...entry,
                formattedDate: new Date(entry.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                }),
            }));

            const vrValues = processedData.map((d) => d.totalVR);

            setHistoryData(processedData);
            setStats({
                totalChange: response.totalVRChange,
                startingVR: response.startingVR,
                endingVR: response.endingVR,
                highestVR: Math.max(...vrValues),
                lowestVR: Math.min(...vrValues),
                changesCount: processedData.length - 1, // Exclude the synthetic anchor point
            });
        } catch (err) {
            console.error("Error fetching VR history:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch VR history");
        } finally {
            setIsLoading(false);
        }
    };

    const changePeriod = (days: number | null) => {
        setSelectedDays(days);
        fetchHistory(days);
    };

    const refresh = () => {
        fetchHistory(selectedDays());
    };

    onMount(() => {
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
