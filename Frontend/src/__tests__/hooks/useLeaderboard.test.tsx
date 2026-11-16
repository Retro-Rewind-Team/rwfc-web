import { waitFor } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { useLeaderboard } from "../../hooks/useLeaderboard";
import { expectUrl, renderHook } from "./routerHarness";

// These tests exercise state, not the network. By default a request never settles, which keeps the
// query loading without touching fetch; a test that needs data sets its own answer.
const { getLeaderboard } = vi.hoisted(() => ({
    getLeaderboard: vi.fn((): Promise<unknown> => new Promise(() => {})),
}));
vi.mock("../../services/api/leaderboard", () => ({
    leaderboardApi: {
        getLeaderboard,
        getStats: () => new Promise(() => {}),
    },
}));

describe("useLeaderboard URL state", () => {
    it("starts from the defaults on a bare URL", async () => {
        const { result: lb } = await renderHook(() => useLeaderboard());

        expect(lb.vehicleFilter()).toBeUndefined();
        expect(lb.currentPage()).toBe(1);
        expect(lb.pageSize()).toBe(50);
        expect(lb.sortBy()).toBe("rank");
        expect(lb.ascending()).toBe(true);
        expect(lb.timePeriod()).toBe("24");
        expect(lb.activeDays()).toBeNull();
        expect(lb.search()).toBe("");
    });

    it("reads every control from the URL, so a shared link restores the view", async () => {
        const { result: lb } = await renderHook(
            () => useLeaderboard(),
            "/?q=mario&sort=vr&dir=asc&page=4&size=25&period=week&active=14&vehicle=bike",
        );

        expect(lb.search()).toBe("mario");
        expect(lb.searchQuery()).toBe("mario");
        expect(lb.sortBy()).toBe("vr");
        expect(lb.ascending()).toBe(true);
        expect(lb.currentPage()).toBe(4);
        expect(lb.pageSize()).toBe(25);
        expect(lb.timePeriod()).toBe("week");
        expect(lb.activeDays()).toBe(14);
        expect(lb.vehicleFilter()).toBe("bike");
    });

    it("falls back to defaults for values a hand-edited URL got wrong", async () => {
        const { result: lb } = await renderHook(
            () => useLeaderboard(),
            "/?page=-2&size=100000&sort=nonsense&vehicle=truck&active=3&period=decade",
        );

        expect(lb.currentPage()).toBe(1);
        // A huge size would ask the API for everything.
        expect(lb.pageSize()).toBe(50);
        expect(lb.sortBy()).toBe("rank");
        expect(lb.vehicleFilter()).toBeUndefined();
        expect(lb.activeDays()).toBeNull();
        expect(lb.timePeriod()).toBe("24");
    });

    it("a filter change writes the URL and drops the page in one step", async () => {
        const { result: lb, history } = await renderHook(() => useLeaderboard(), "/?page=3");

        lb.handleVehicleFilterChange("kart");

        // One navigation: page is gone and vehicle is set together, not page=3 first.
        await expectUrl(history, "/?vehicle=kart");
        expect(lb.vehicleFilter()).toBe("kart");
        expect(lb.currentPage()).toBe(1);
    });

    it("clearing a filter removes its param", async () => {
        const { result: lb, history } = await renderHook(() => useLeaderboard(), "/?vehicle=bike");

        lb.handleVehicleFilterChange(undefined);

        await expectUrl(history, "/");
        expect(lb.vehicleFilter()).toBeUndefined();
    });

    it("Back returns to the view before the filter", async () => {
        const { result: lb, history } = await renderHook(() => useLeaderboard(), "/?page=2");

        lb.handleActiveDaysChange(30);
        await expectUrl(history, "/?active=30");

        history.back();
        await expectUrl(history, "/?page=2");
        await waitFor(() => expect(lb.activeDays()).toBeNull());
        expect(lb.currentPage()).toBe(2);
    });

    it("sorting a new column starts at its natural direction and returns to page 1", async () => {
        const { result: lb, history } = await renderHook(() => useLeaderboard(), "/?page=5");

        lb.handleSort("vr");
        // VR reads best biggest first, which is the default for a non-rank column, so no dir param.
        await expectUrl(history, "/?sort=vr");
        expect(lb.ascending()).toBe(false);

        lb.handleSort("vr");
        await expectUrl(history, "/?sort=vr&dir=asc");
        expect(lb.ascending()).toBe(true);
    });

    it("changing the VR change period keeps a VR change sort pointed at the same column", async () => {
        const { result: lb, history } = await renderHook(
            () => useLeaderboard(),
            "/?sort=vrgain24&page=2",
        );

        lb.handleTimePeriodChange("week");

        await expectUrl(history, "/?sort=vrgain7&period=week");
        expect(lb.sortBy()).toBe("vrgain7");
    });

    it("leaves a deep page alone until the real page count is known", async () => {
        const { result: lb } = await renderHook(() => useLeaderboard(), "/?page=9");

        expect(lb.currentPage()).toBe(9);
    });

    it("pulls the page back into range once the API says there are fewer pages", async () => {
        getLeaderboard.mockResolvedValueOnce({
            players: [],
            totalCount: 120,
            totalPages: 3,
            currentPage: 9,
            pageSize: 50,
        });
        const { result: lb, history } = await renderHook(() => useLeaderboard(), "/?page=9");

        await expectUrl(history, "/?page=3");
        expect(lb.currentPage()).toBe(3);
    });

    it("clearFilters drops search and filters but keeps the sort", async () => {
        const { result: lb, history } = await renderHook(
            () => useLeaderboard(),
            "/?q=abc&vehicle=kart&active=7&sort=vr&page=3",
        );

        lb.clearFilters();

        await expectUrl(history, "/?sort=vr");
        expect(lb.hasFilters()).toBe(false);
        expect(lb.searchQuery()).toBe("");
    });
});
