import { createSignal } from "solid-js";

/**
 * Provides two signals for search: `searchQuery` (updated immediately, for the
 * input display) and `search` (debounced, for API queries). Use `search` in query
 * keys so requests only fire after the user stops typing.
 */
export function useDebouncedSearch(delay = 300) {
    const [searchQuery, setSearchQuery] = createSignal("");
    const [search, setSearch] = createSignal("");

    let timeout: ReturnType<typeof setTimeout>;
    const handleSearchInput = (value: string) => {
        setSearchQuery(value);
        clearTimeout(timeout);
        timeout = setTimeout(() => setSearch(value), delay);
    };

    return { searchQuery, search, handleSearchInput };
}
