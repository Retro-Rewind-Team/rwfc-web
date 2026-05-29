import { createRoot } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedSearch } from "../../hooks/useDebouncedSearch";

describe("useDebouncedSearch", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("updates searchQuery immediately on input", () => {
        createRoot((dispose) => {
            const { searchQuery, handleSearchInput } = useDebouncedSearch(300);
            handleSearchInput("hello");
            expect(searchQuery()).toBe("hello");
            dispose();
        });
    });

    it("does not update debounced search before delay elapses", () => {
        createRoot((dispose) => {
            const { search, handleSearchInput } = useDebouncedSearch(300);
            handleSearchInput("hello");
            vi.advanceTimersByTime(299);
            expect(search()).toBe("");
            dispose();
        });
    });

    it("updates debounced search after delay elapses", () => {
        createRoot((dispose) => {
            const { search, handleSearchInput } = useDebouncedSearch(300);
            handleSearchInput("hello");
            vi.advanceTimersByTime(300);
            expect(search()).toBe("hello");
            dispose();
        });
    });

    it("resets timer on rapid input: only last value commits", () => {
        createRoot((dispose) => {
            const { search, handleSearchInput } = useDebouncedSearch(300);
            handleSearchInput("h");
            vi.advanceTimersByTime(200);
            handleSearchInput("he");
            vi.advanceTimersByTime(200);
            expect(search()).toBe(""); // timer reset, not yet elapsed
            vi.advanceTimersByTime(100);
            expect(search()).toBe("he");
            dispose();
        });
    });
});
