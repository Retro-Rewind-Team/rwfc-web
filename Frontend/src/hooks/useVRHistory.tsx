import { createEffect, createSignal } from "solid-js";
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

// Aggregate history by day, keeping only the highest VR per day
function aggregateByDay(history: ProcessedVRHistory[]): ProcessedVRHistory[] {
    if (history.length === 0) return [];
    
    // Check if first entry is the initial VR (vrChange = 0)
    const hasInitialEntry = history[0].vrChange === 0;
    const initialEntry = hasInitialEntry ? history[0] : null;
    const dataToAggregate = hasInitialEntry ? history.slice(1) : history;
    
    if (dataToAggregate.length === 0) {
        return history; // Only initial entry exists
    }
    
    // Check if all entries (including initial) are from the same day
    const firstDate = new Date(history[0].date);
    const allSameDay = history.every(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getFullYear() === firstDate.getFullYear() &&
               entryDate.getMonth() === firstDate.getMonth() &&
               entryDate.getDate() === firstDate.getDate();
    });
    
    // If all entries are from the same day, don't aggregate - return all points
    if (allSameDay) {
        return history;
    }
    
    // Get the day of the initial entry to exclude other entries from that same day
    const initialDayKey = initialEntry ? (() => {
        const date = new Date(initialEntry.date);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    })() : null;
    
    // Aggregate by day, but skip entries from the same day as initial entry
    const dayMap = new Map<string, ProcessedVRHistory>();
    
    for (const entry of dataToAggregate) {
        const date = new Date(entry.date);
        const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        
        // Skip entries from the same day as initial entry
        if (dayKey === initialDayKey) {
            continue;
        }
        
        const existing = dayMap.get(dayKey);
        if (!existing || entry.totalVR > existing.totalVR) {
            dayMap.set(dayKey, entry);
        }
    }
    
    const aggregated = Array.from(dayMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Re-add initial entry at the beginning if it existed
    const finalData = initialEntry ? [initialEntry, ...aggregated] : aggregated;
    
    // Recalculate vrChange values based on aggregated data
    // The vrChange should be the difference from the previous aggregated point
    for (let i = 0; i < finalData.length; i++) {
        if (i === 0) {
            // First point keeps its original vrChange (should be 0 for initial entry)
            continue;
        }
        
        // Calculate change from previous aggregated point
        finalData[i].vrChange = finalData[i].totalVR - finalData[i - 1].totalVR;
    }
    
    return finalData;
}

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

            // Process all data
            let processedData: ProcessedVRHistory[] = response.history.map(
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

            // For non-24h periods, aggregate by day (keep highest VR per day)
            if (days !== 1) {
                processedData = aggregateByDay(processedData);
            }

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

    const changePeriod = (days: number | null) => {
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