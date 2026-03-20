import { createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { raceStatsApi } from "../services/api/raceStats";

export function useGlobalRaceStats() {
    const [days, setDays] = createSignal<number | undefined>(undefined);

    const globalStatsQuery = useQuery(() => ({
        queryKey: ["global-race-stats", days()],
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
