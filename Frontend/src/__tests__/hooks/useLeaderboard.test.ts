import { createComponent, createRoot } from "solid-js";
import { describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { useLeaderboard } from "../../hooks/useLeaderboard";

function withQueryClient<T>(fn: () => T): T {
    let result!: T;
    createRoot((dispose) => {
        const client = new QueryClient();
        createComponent(QueryClientProvider, {
            client,
            get children() {
                result = fn();
                return undefined;
            },
        });
        dispose();
    });
    return result;
}

describe("useLeaderboard vehicle filter", () => {
    it("defaults vehicleFilter to undefined", () => {
        const leaderboard = withQueryClient(() => useLeaderboard());
        expect(leaderboard.vehicleFilter()).toBeUndefined();
    });

    it("handleVehicleFilterChange sets the filter and resets to page 1", () => {
        const leaderboard = withQueryClient(() => useLeaderboard());
        leaderboard.setCurrentPage(3);

        leaderboard.handleVehicleFilterChange("kart");

        expect(leaderboard.vehicleFilter()).toBe("kart");
        expect(leaderboard.currentPage()).toBe(1);
    });

    it("handleVehicleFilterChange back to undefined clears the filter", () => {
        const leaderboard = withQueryClient(() => useLeaderboard());
        leaderboard.handleVehicleFilterChange("bike");

        leaderboard.handleVehicleFilterChange(undefined);

        expect(leaderboard.vehicleFilter()).toBeUndefined();
    });
});
