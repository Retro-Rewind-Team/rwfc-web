import { batch, createSignal } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { useQuery } from "@tanstack/solid-query";
import { raceStatsApi } from "../services/api/raceStats";
import { queryKeys } from "../constants/queryKeys";
import { usePagination } from "./usePagination";
import { useDebouncedSearch } from "./useDebouncedSearch";

export const RACES_PAGE_SIZE = 20;

export function useRaces() {
    const [searchParams] = useSearchParams();

    // Deep-link params -- read once from URL on mount, not reactive
    const initialRoomId = searchParams.roomId as string | undefined;
    const initialRaceNumber = searchParams.raceNumber
        ? parseInt(searchParams.raceNumber as string)
        : undefined;

    const { currentPage, setCurrentPage } = usePagination(RACES_PAGE_SIZE);
    const [courseId, setCourseId] = createSignal<number | undefined>(undefined);
    const [engineClassId, setEngineClassId] = createSignal<number | undefined>(undefined);
    const [from, setFrom] = createSignal<string | undefined>(undefined);
    const [to, setTo] = createSignal<string | undefined>(undefined);
    const { searchQuery: fcQuery, search: fc, handleSearchInput: handleFcInput } =
        useDebouncedSearch(500);

    const hasFilters = () =>
        !!courseId() || !!engineClassId() || !!fc() || !!from() || !!to();

    const clearFilters = () => {
        batch(() => {
            setCourseId(undefined);
            setEngineClassId(undefined);
            setFrom(undefined);
            setTo(undefined);
            handleFcInput("");
            setCurrentPage(1);
        });
    };

    const racesQuery = useQuery(() => ({
        queryKey: queryKeys.races(
            initialRoomId,
            initialRaceNumber,
            courseId(),
            engineClassId(),
            fc(),
            from(),
            to(),
            currentPage(),
        ),
        queryFn: () =>
            raceStatsApi.getRaces({
                roomId: initialRoomId,
                raceNumber: initialRaceNumber,
                courseId: courseId(),
                engineClassId: engineClassId(),
                friendCode: fc() || undefined,
                from: from(),
                to: to(),
                page: currentPage(),
                pageSize: RACES_PAGE_SIZE,
            }),
    }));

    return {
        racesQuery,
        courseId,
        setCourseId,
        engineClassId,
        setEngineClassId,
        from,
        setFrom,
        to,
        setTo,
        fcQuery,
        handleFcInput,
        currentPage,
        setCurrentPage,
        hasFilters,
        clearFilters,
        isDeepLinked: () => !!initialRoomId,
    };
}
