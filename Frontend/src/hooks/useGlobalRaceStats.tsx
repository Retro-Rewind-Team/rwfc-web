import { createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { raceStatsApi } from "../services/api/raceStats";
import { queryKeys } from "../constants/queryKeys";

/** Fetches site-wide race statistics with an optional time window filter (days). */
export function useGlobalRaceStats() {
    const [days, setDays] = createSignal<number | undefined>(undefined);

    const globalStatsQuery = useQuery(() => ({
        queryKey: queryKeys.globalRaceStats(days()),
        queryFn: () => raceStatsApi.getGlobalRaceStats(days()),
        staleTime: 1000 * 60 * 5,
    }));

    const handleDaysChange = (value: number | undefined) => setDays(value);

    return {
        globalStatsQuery,
        days,
        handleDaysChange,
    };
}
