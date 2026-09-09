import { createSignal, onCleanup } from "solid-js";

/**
 * Provides two signals for search: `searchQuery` (updated immediately, for the
 * input display) and `search` (debounced, for API queries). Use `search` in query
 * keys so requests only fire after the user stops typing.
 */
export function useDebouncedSearch(delay = 300) {
    const [searchQuery, setSearchQuery] = createSignal("");
    const [search, setSearch] = createSignal("");

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const handleSearchInput = (value: string) => {
        setSearchQuery(value);
        clearTimeout(timeout);
        timeout = setTimeout(() => setSearch(value), delay);
    };

    // Without this a pending debounce fires after the component is gone, writing to a disposed
    // signal and triggering a query for a page the user has already left.
    onCleanup(() => clearTimeout(timeout));

    return { searchQuery, search, handleSearchInput };
}
