import { createEffect, createMemo, createSignal, on, onCleanup } from "solid-js";
import { useSearchParams } from "@solidjs/router";

/** A value that can be written to a query param. Empty, false and nullish values remove it. */
export type ParamValue = string | number | boolean | null | undefined;

/**
 * Router params can be a string or an array when a key is repeated (`?a=1&a=2`). Callers only ever
 * want one value, and a hand-edited URL must not be able to hand a filter an array.
 */
export function readString(raw: unknown): string | undefined {
    const value = Array.isArray(raw) ? raw[0] : raw;
    return typeof value === "string" && value !== "" ? value : undefined;
}

/** Parses a whole positive number. Anything else (`abc`, `2.5`, `-1`, `0`) is rejected. */
export function readInt(raw: unknown, min = 1): number | undefined {
    const value = readString(raw);
    if (value === undefined || !/^\d+$/.test(value)) return undefined;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed >= min ? parsed : undefined;
}

/** Accepts the value only if it is one of the allowed options, so a bad URL falls back to the default. */
export function readEnum<T extends string>(raw: unknown, allowed: readonly T[]): T | undefined {
    const value = readString(raw);
    return allowed.find((option) => option === value);
}

export interface UrlUpdateOptions {
    /** Replace the current history entry instead of adding one. Use for keystroke-level changes. */
    replace?: boolean;
    /** Also drop `page`, so a changed filter never leaves you on a page that no longer exists. */
    resetPage?: boolean;
}

export interface UrlState {
    get: (key: string) => string | undefined;
    update: (changes: Record<string, ParamValue>, options?: UrlUpdateOptions) => void;
}

/**
 * Filter, sort and page state that lives in the query string, so a filtered view can be shared,
 * bookmarked and stepped through with Back.
 *
 * Every change goes through one `update` call, which is one navigation. Setting a filter and
 * clearing the page as two writes would add two history entries and flash a request for the old
 * page with the new filter.
 *
 * Callers pass `undefined` for a value equal to its default, which keeps URLs short and means a
 * default view is the bare path.
 */
export function useUrlState(): UrlState {
    const [params, setParams] = useSearchParams();

    const get = (key: string) => readString(params[key]);

    const update = (changes: Record<string, ParamValue>, options: UrlUpdateOptions = {}) => {
        const next: Record<string, string | undefined> = {};
        for (const [key, value] of Object.entries(changes)) {
            if (value === undefined || value === null || value === false || value === "") {
                next[key] = undefined;
            } else {
                next[key] = value === true ? "1" : String(value);
            }
        }
        if (options.resetPage && !("page" in changes)) next.page = undefined;
        setParams(next, { replace: options.replace });
    };

    return { get, update };
}

/**
 * Page and page size from the URL. The page size is checked against `allowedSizes` so a hand-edited
 * `?size=100000` cannot ask the API for everything.
 */
export function useUrlPagination(
    state: UrlState,
    defaultPageSize: number,
    allowedSizes?: readonly number[],
) {
    const currentPage = createMemo(() => readInt(state.get("page")) ?? 1);

    const pageSize = createMemo(() => {
        const size = readInt(state.get("size"));
        if (size === undefined) return defaultPageSize;
        return !allowedSizes || allowedSizes.includes(size) ? size : defaultPageSize;
    });

    const setCurrentPage = (page: number) => state.update({ page: page <= 1 ? undefined : page });

    const handlePageSizeChange = (size: number) =>
        state.update({ size: size === defaultPageSize ? undefined : size, page: undefined });

    /**
     * Pulls the page back into range once the real page count is known. Without it a link to page 9
     * of a list that now has 3 pages (or a 60s refresh that shrank the list) shows an empty table
     * with working-looking pagination. Replaces the entry, so Back does not land on the bad page.
     */
    const clampTo = (totalPages: () => number | undefined) => {
        createEffect(() => {
            const total = totalPages();
            if (total !== undefined && total > 0 && currentPage() > total) {
                state.update({ page: total <= 1 ? undefined : total }, { replace: true });
            }
        });
    };

    return { currentPage, pageSize, setCurrentPage, handlePageSizeChange, clampTo };
}

/**
 * A search box backed by a URL param. The input shows what was typed immediately; the URL (and so
 * the query) only follows after the user pauses.
 *
 * History: the first character typed adds one entry, so Back returns to the unfiltered list; the
 * rest of that typing session replaces it, so Back is not forced through every intermediate word.
 * When the URL changes from outside (Back, a link) the input follows it.
 */
export function useUrlSearch(state: UrlState, key = "q", delay = 300) {
    const urlValue = createMemo(() => state.get(key) ?? "");
    const [searchQuery, setSearchQuery] = createSignal(urlValue());

    let timeout: ReturnType<typeof setTimeout> | undefined;
    let lastWritten = urlValue();

    const commit = (value: string) => {
        const startsSession = lastWritten === "" && value !== "";
        lastWritten = value;
        state.update({ [key]: value }, { resetPage: true, replace: !startsSession });
    };

    const handleSearchInput = (value: string) => {
        setSearchQuery(value);
        clearTimeout(timeout);
        timeout = setTimeout(() => commit(value), delay);
    };

    createEffect(
        on(
            urlValue,
            (value) => {
                if (value === lastWritten) return;
                // Changed by navigation, not by typing: drop any pending write so it cannot
                // overwrite where the user just went.
                clearTimeout(timeout);
                lastWritten = value;
                setSearchQuery(value);
            },
            { defer: true },
        ),
    );

    // A pending write after the page is gone would navigate away from wherever the user went next.
    onCleanup(() => clearTimeout(timeout));

    /** Empties the box and the URL together, with optional extra params, in one navigation. */
    const clear = (extra: Record<string, ParamValue> = {}) => {
        clearTimeout(timeout);
        lastWritten = "";
        setSearchQuery("");
        state.update({ ...extra, [key]: undefined }, { resetPage: true });
    };

    return { searchQuery, search: urlValue, handleSearchInput, clear };
}

/** Rank reads best ascending; every other column reads best with the biggest value first. */
const defaultAscending = (field: string) => field === "rank";

/**
 * Sort column and direction as `sort` and `dir`. Each is left out of the URL when it is the default
 * (rank, ascending for rank, descending for everything else), and an unknown `sort` is ignored.
 */
export function useUrlSort(state: UrlState, allowed: readonly string[]) {
    const sortBy = createMemo(() => readEnum(state.get("sort"), allowed) ?? "rank");
    const ascending = createMemo(() => {
        const dir = readEnum(state.get("dir"), ["asc", "desc"] as const);
        return dir ? dir === "asc" : defaultAscending(sortBy());
    });

    const handleSort = (field: string) => {
        const asc = sortBy() === field ? !ascending() : defaultAscending(field);
        state.update(
            {
                sort: field === "rank" ? undefined : field,
                dir: asc === defaultAscending(field) ? undefined : asc ? "asc" : "desc",
            },
            { resetPage: true },
        );
    };

    return { sortBy, ascending, handleSort };
}
