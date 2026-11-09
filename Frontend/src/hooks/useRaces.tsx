import { createMemo } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { raceStatsApi } from "../services/api/raceStats";
import { queryKeys } from "../constants/queryKeys";
import { readInt, useUrlPagination, useUrlSearch, useUrlState } from "./useUrlState";

export const RACES_PAGE_SIZE = 20;

// An engine class is 2 for 150cc and 1 for 200cc, as the API has it. The URL says the cc instead.
const CC_TO_ENGINE_CLASS: Record<string, number> = { "150": 2, "200": 1 };
const ENGINE_CLASS_TO_CC: Record<number, string> = { 2: "150", 1: "200" };

/** `<input type="date">` values only. Anything else in a hand-edited URL is ignored. */
const readDate = (raw: string | undefined) =>
    raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : undefined;

/**
 * Filter state and data fetching for the race history browser. Everything is a URL param, so a
 * filtered view can be shared: `track`, `cc`, `fc` (friend code), `from`, `to`, `page`.
 * `roomId` and `raceNumber` deep-link into a specific race and are not filters; `isDeepLinked`
 * says when a URL-scoped view is active.
 */
export function useRaces() {
    const state = useUrlState();

    const roomId = createMemo(() => state.get("roomId"));
    const raceNumber = createMemo(() => readInt(state.get("raceNumber"), 0));

    const { currentPage, setCurrentPage, clampTo } = useUrlPagination(state, RACES_PAGE_SIZE, [
        RACES_PAGE_SIZE,
    ]);
    const {
        searchQuery: fcQuery,
        search: fc,
        handleSearchInput: handleFcInput,
        clear: clearFc,
    } = useUrlSearch(state, "fc", 500);

    const courseId = createMemo(() => readInt(state.get("track")));
    const engineClassId = createMemo(() => {
        const cc = state.get("cc");
        return cc ? CC_TO_ENGINE_CLASS[cc] : undefined;
    });
    const from = createMemo(() => readDate(state.get("from")));
    const to = createMemo(() => readDate(state.get("to")));

    // Each change also clears the page, in the same navigation.
    const setCourseId = (id: number | undefined) =>
        state.update({ track: id }, { resetPage: true });
    const setEngineClassId = (id: number | undefined) =>
        state.update(
            { cc: id === undefined ? undefined : ENGINE_CLASS_TO_CC[id] },
            { resetPage: true },
        );
    const setFrom = (value: string | undefined) =>
        state.update({ from: value }, { resetPage: true });
    const setTo = (value: string | undefined) => state.update({ to: value }, { resetPage: true });

    const hasFilters = () => !!courseId() || !!engineClassId() || !!fc() || !!from() || !!to();

    const clearFilters = () =>
        clearFc({ track: undefined, cc: undefined, from: undefined, to: undefined });

    const racesQuery = useQuery(() => ({
        queryKey: queryKeys.races(
            roomId(),
            raceNumber(),
            courseId(),
            engineClassId(),
            fc(),
            from(),
            to(),
            currentPage(),
        ),
        queryFn: () =>
            raceStatsApi.getRaces({
                roomId: roomId(),
                raceNumber: raceNumber(),
                courseId: courseId(),
                engineClassId: engineClassId(),
                friendCode: fc() || undefined,
                from: from(),
                to: to(),
                page: currentPage(),
                pageSize: RACES_PAGE_SIZE,
            }),
    }));

    clampTo(() => racesQuery.data?.totalPages);

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
        fc,
        fcQuery,
        handleFcInput,
        currentPage,
        setCurrentPage,
        hasFilters,
        clearFilters,
        isDeepLinked: () => !!roomId(),
    };
}
