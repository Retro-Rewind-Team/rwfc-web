import { render, screen } from "@solidjs/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { describe, expect, it, vi } from "vitest";
import HeroStats from "../../components/ui/home/HeroStats";

vi.mock("../../services/api/room", () => ({
    roomStatusApi: { getPlayerCount: () => Promise.resolve({ count: 154153 }) },
}));
// Discord answers null when it is unreachable; the strip must say so rather than show zero.
vi.mock("../../services/api/leaderboard", () => ({
    leaderboardApi: { getDiscordMemberCount: () => Promise.resolve(null) },
}));
vi.mock("../../services/api/timeTrial", () => ({
    timeTrialApi: {
        getAllTracks: () =>
            Promise.resolve([
                { id: 1, name: "SNES Mario Circuit 1", category: "retro", isHidden: false },
                { id: 2, name: "Phendrana Frostbite", category: "custom", isHidden: false },
                { id: 3, name: "Hidden", category: "retro", isHidden: true },
            ]),
    },
}));

describe("HeroStats", () => {
    it("shows total players, Discord members and tracks from their sources", async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        render(() => (
            <QueryClientProvider client={client}>
                <HeroStats />
            </QueryClientProvider>
        ));

        expect(screen.getByText("Total players")).toBeInTheDocument();
        expect(screen.getByText("Discord members")).toBeInTheDocument();
        expect(screen.getByText("Tracks available")).toBeInTheDocument();

        // jsdom has no IntersectionObserver, so CountUp shows final values straight away.
        expect((await screen.findAllByText("154,153")).length).toBeGreaterThan(0);
        expect((await screen.findAllByText("2")).length).toBeGreaterThan(0); // hidden track excluded
        expect(await screen.findByText("Not available")).toBeInTheDocument();
    });
});
