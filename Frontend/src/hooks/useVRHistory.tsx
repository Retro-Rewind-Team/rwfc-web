import { createEffect, createSignal, on } from "solid-js";
import { leaderboardApi } from "../services/api/leaderboard";
import { VRHistoryEntry, VRHistoryResponse } from "../types";

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

/** A date range used for custom VR history queries. */
export interface CustomRange {
    from: Date;
    to: Date;
}

/**
 * Fetches and processes a player's VR change history for charts and stat
 * summaries. Supports preset day windows and custom date ranges. All data
 * points are returned as-is; the chart handles display density via
 * nearest-point hover snap.
 * @param friendCode - The player's friend code.
 * @param initialDays - Day window to load on mount. Defaults to 30.
 */
export function useVRHistory(friendCode: () => string, initialDays = 30) {
    const [historyData, setHistoryData] = createSignal<ProcessedVRHistory[]>([]);
    const [stats, setStats] = createSignal<VRHistoryStats | null>(null);
    const [isLoading, setIsLoading] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    const [selectedDays, setSelectedDays] = createSignal<number | null>(initialDays);
    const [customRange, setCustomRange] = createSignal<CustomRange | null>(null);

    // Guards against a slow response overwriting a newer one: switching period quickly used to
    // leave whichever request happened to land last on screen, not the one that was asked for.
    let latestRequest = 0;

    const load = async (fetcher: (fc: string) => Promise<VRHistoryResponse>) => {
        const fc = friendCode();
        if (!fc) return;

        const request = ++latestRequest;
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetcher(fc);
            if (request !== latestRequest) return;

            if (response.history.length === 0) {
                setHistoryData([]);
                setStats(null);
                return;
            }

            const processedData: ProcessedVRHistory[] = response.history.map((entry) => ({
                ...entry,
                formattedDate: new Date(entry.date).toLocaleDateString(undefined, {
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
            if (request !== latestRequest) return;
            console.error("Error fetching VR history:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch VR history");
        } finally {
            if (request === latestRequest) setIsLoading(false);
        }
    };

    const fetchHistory = (days: number | null) =>
        load((fc) => leaderboardApi.getPlayerHistory(fc, days));

    const fetchHistoryByRange = (from: Date, to: Date) =>
        load((fc) => leaderboardApi.getPlayerHistoryByRange(fc, from, to));
    const changePeriod = (days: number | null) => {
        setCustomRange(null);
        setSelectedDays(days);
        fetchHistory(days);
    };

    const changeRange = (from: Date, to: Date) => {
        setSelectedDays(null);
        setCustomRange({ from, to });
        fetchHistoryByRange(from, to);
    };

    const refresh = () => {
        const range = customRange();
        if (range) {
            fetchHistoryByRange(range.from, range.to);
        } else {
            fetchHistory(selectedDays());
        }
    };

    // createEffect, not onMount: the router reuses this component when only the friend code
    // changes, so mounting once left the chart showing the previously-viewed player.
    createEffect(
        on(friendCode, () => {
            setCustomRange(null);
            fetchHistory(selectedDays());
        }),
    );

    return {
        // Data
        historyData,
        stats,
        selectedDays,
        customRange,

        // State
        isLoading,
        error,

        // Actions
        changePeriod,
        changeRange,
        refresh,
    };
}
