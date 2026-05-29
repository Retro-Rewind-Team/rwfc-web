import { createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { raceStatsApi } from "../services/api/raceStats";
import { queryKeys } from "../constants/queryKeys";

export function usePlayerAnalytics(pid: string | undefined) {
    const [enabled, setEnabled] = createSignal(false);
    const [days, setDays] = createSignal<number | undefined>(undefined);
    const [engineClassId, setEngineClassId] = createSignal<number | undefined>(undefined);

    const analyticsQuery = useQuery(() => ({
        queryKey: queryKeys.playerAnalytics(pid, days(), engineClassId()),
        queryFn: () =>
            raceStatsApi.getPlayerAnalytics(pid!, {
                days: days(),
                engineClassId: engineClassId(),
            }),
        enabled: !!pid && enabled(),
    }));

    const handleExpand = () => setEnabled(true);

    const handleDaysChange = (value: number | undefined) => setDays(value);
    const handleEngineClassChange = (value: number | undefined) => setEngineClassId(value);

    return {
        analyticsQuery,
        enabled,
        handleExpand,
        days,
        engineClassId,
        handleDaysChange,
        handleEngineClassChange,
    };
}
