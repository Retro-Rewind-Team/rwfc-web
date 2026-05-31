import { createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { raceStatsApi } from "../services/api/raceStats";
import { queryKeys } from "../constants/queryKeys";

/**
 * Fetches detailed performance analytics for a single player. The query is
 * lazy -- it only fires after `handleExpand` is called, avoiding unnecessary
 * network requests until the analytics panel is opened.
 * @param pid - The player ID. Pass `undefined` to keep the query disabled.
 */
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
