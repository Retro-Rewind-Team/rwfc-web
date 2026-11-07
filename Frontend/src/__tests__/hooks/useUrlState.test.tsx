import { waitFor } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import {
    readEnum,
    readInt,
    readString,
    useUrlPagination,
    useUrlSearch,
    useUrlState,
} from "../../hooks/useUrlState";
import { expectUrl, renderHook } from "./routerHarness";

describe("param readers", () => {
    it("readString takes the first of a repeated param and ignores empties", () => {
        expect(readString("a")).toBe("a");
        expect(readString(["a", "b"])).toBe("a");
        expect(readString("")).toBeUndefined();
        expect(readString(undefined)).toBeUndefined();
    });

    it("readInt accepts whole positive numbers only", () => {
        expect(readInt("12")).toBe(12);
        for (const bad of ["0", "-1", "2.5", "abc", "1e3", "", undefined, "99999999999999999999"]) {
            expect(readInt(bad)).toBeUndefined();
        }
        // A caller that allows zero says so.
        expect(readInt("0", 0)).toBe(0);
    });

    it("readEnum rejects anything outside the allowed list", () => {
        expect(readEnum("kart", ["kart", "bike"] as const)).toBe("kart");
        expect(readEnum("truck", ["kart", "bike"] as const)).toBeUndefined();
    });
});

describe("useUrlState", () => {
    it("update writes params, drops empty ones and turns true into 1", async () => {
        const { result: url, history } = await renderHook(() => useUrlState(), "/?old=1");

        url.update({ a: "x", b: undefined, c: 3, old: false, d: true, e: "" });

        await expectUrl(history, "/?a=x&c=3&d=1");
    });

    it("resetPage removes page in the same navigation", async () => {
        const { result: url, history } = await renderHook(() => useUrlState(), "/?page=4&x=1");

        url.update({ x: 2 }, { resetPage: true });

        await expectUrl(history, "/?x=2");
    });

    it("an explicit page wins over resetPage", async () => {
        const { result: url, history } = await renderHook(() => useUrlState(), "/");

        url.update({ page: 7 }, { resetPage: true });

        await expectUrl(history, "/?page=7");
    });
});

describe("useUrlPagination", () => {
    const setup = (startAt: string) =>
        renderHook(() => {
            const state = useUrlState();
            return { state, ...useUrlPagination(state, 25, [10, 25, 50]) };
        }, startAt);

    it("page 1 is the bare URL", async () => {
        const { result: p, history } = await setup("/?page=3");

        p.setCurrentPage(1);

        await expectUrl(history, "/");
    });

    it("changing page size returns to page 1", async () => {
        const { result: p, history } = await setup("/?page=3");

        p.handlePageSizeChange(50);

        await expectUrl(history, "/?size=50");
        expect(p.pageSize()).toBe(50);
        expect(p.currentPage()).toBe(1);
    });

    it("the default page size is not written to the URL", async () => {
        const { result: p, history } = await setup("/?size=50");

        p.handlePageSizeChange(25);

        await expectUrl(history, "/");
    });

    it("ignores a page size that is not on the list", async () => {
        const { result: p } = await setup("/?size=7");

        expect(p.pageSize()).toBe(25);
    });
});

describe("useUrlSearch", () => {
    const setup = (startAt = "/") =>
        renderHook(() => {
            const state = useUrlState();
            return useUrlSearch(state, "q", 0);
        }, startAt);

    it("shows typing at once and writes the URL after the pause, dropping the page", async () => {
        const { result: s, history } = await setup("/?page=4");

        s.handleSearchInput("abc");

        expect(s.searchQuery()).toBe("abc");
        await expectUrl(history, "/?q=abc");
        expect(s.search()).toBe("abc");
    });

    it("the first search adds one history entry, so Back returns to the unfiltered list", async () => {
        const { result: s, history } = await setup("/");

        s.handleSearchInput("a");
        await expectUrl(history, "/?q=a");
        s.handleSearchInput("ab");
        await expectUrl(history, "/?q=ab");

        // Both edits were one typing session: one Back undoes all of it.
        history.back();
        await expectUrl(history, "/");
        await waitFor(() => expect(s.searchQuery()).toBe(""));
    });

    it("follows the URL when it changes from outside, like Back", async () => {
        const { result: s, history } = await setup("/?q=mario");
        expect(s.searchQuery()).toBe("mario");

        history.set({ value: "/?q=luigi" });

        await waitFor(() => expect(s.searchQuery()).toBe("luigi"));
    });

    it("clear empties the box and the URL together", async () => {
        const { result: s, history } = await setup("/?q=abc&page=2&keep=1");

        s.clear();

        await expectUrl(history, "/?keep=1");
        expect(s.searchQuery()).toBe("");
    });
});
