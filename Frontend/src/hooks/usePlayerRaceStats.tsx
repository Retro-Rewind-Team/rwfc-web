import { createEffect, createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { raceStatsApi } from "../services/api/raceStats";
import { queryKeys } from "../constants/queryKeys";
import { usePagination } from "./usePagination";

const PAGE_SIZE = 20;

/**
 * Fetches race statistics for a single player with optional time window and
 * track filters, plus client-side pagination of the recent races list.
 */
export function usePlayerRaceStats(pid: string | undefined) {
    const { currentPage, setCurrentPage } = usePagination(PAGE_SIZE);

    const [days, setDays] = createSignal<number | undefined>(undefined);
    const [courseId, setCourseId] = createSignal<number | undefined>(undefined);
    const [activeTrackName, setActiveTrackName] = createSignal<string | undefined>(undefined);

    // Reset to page 1 when filters change
    createEffect(() => {
        days();
        courseId();
        setCurrentPage(1);
    });

    const raceStatsQuery = useQuery(() => ({
        queryKey: queryKeys.playerRaceStats(pid, days(), courseId(), currentPage()),
        queryFn: () =>
            raceStatsApi.getPlayerRaceStats(pid!, {
                days: days(),
                courseId: courseId(),
                page: currentPage(),
                pageSize: PAGE_SIZE,
            }),
        enabled: !!pid,
        retry: 1,
    }));

    const hasRaceStats = () => raceStatsQuery.isSuccess && !!raceStatsQuery.data;

    const handleDaysChange = (value: number | undefined) => setDays(value);

    const handleCourseIdChange = (value: number | undefined, name?: string) => {
        setCourseId(value);
        setActiveTrackName(name);
    };

    return {
        raceStatsQuery,
        hasRaceStats,
        days,
        courseId,
        activeTrackName,
        currentPage,
        setCurrentPage,
        handleDaysChange,
        handleCourseIdChange,
    };
}
