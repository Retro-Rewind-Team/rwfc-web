import { batch, createSignal } from "solid-js";
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
    const [engineClassId, setEngineClassId] = createSignal<number | undefined>(undefined);
    const [activeTrackName, setActiveTrackName] = createSignal<string | undefined>(undefined);

    const raceStatsQuery = useQuery(() => ({
        queryKey: queryKeys.playerRaceStats(
            pid,
            days(),
            courseId(),
            engineClassId(),
            currentPage(),
        ),
        queryFn: () =>
            raceStatsApi.getPlayerRaceStats(pid!, {
                days: days(),
                courseId: courseId(),
                engineClassId: engineClassId(),
                page: currentPage(),
                pageSize: PAGE_SIZE,
            }),
        enabled: !!pid,
        retry: 1,
    }));

    const hasRaceStats = () => raceStatsQuery.isSuccess && !!raceStatsQuery.data;

    const handleDaysChange = (value: number | undefined) => {
        batch(() => {
            setDays(value);
            setCurrentPage(1);
        });
    };

    const handleCourseIdChange = (value: number | undefined, name?: string) => {
        batch(() => {
            setCourseId(value);
            setActiveTrackName(name);
            setCurrentPage(1);
        });
    };

    const handleEngineClassChange = (value: number | undefined) => {
        batch(() => {
            setEngineClassId(value);
            setCurrentPage(1);
        });
    };

    return {
        raceStatsQuery,
        hasRaceStats,
        days,
        courseId,
        engineClassId,
        activeTrackName,
        currentPage,
        setCurrentPage,
        handleDaysChange,
        handleCourseIdChange,
        handleEngineClassChange,
    };
}
