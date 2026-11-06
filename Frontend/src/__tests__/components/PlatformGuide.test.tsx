import { fireEvent, render, screen } from "@solidjs/testing-library";
import { createMemoryHistory, MemoryRouter, Route } from "@solidjs/router";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { describe, expect, it, vi } from "vitest";
import PlatformGuide from "../../components/ui/home/PlatformGuide";
import { bitmapToPath } from "../../components/common/PixelIcon";

vi.mock("../../services/api/leaderboard", () => ({
    leaderboardApi: {
        getChannelDownloadUrl: () => Promise.resolve("https://example.test/channel"),
    },
}));

function renderGuide() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // The panel links to /privacy through the router, so it needs one. The testing library's own
    // `location` option fails to start this router version, hence an explicit MemoryRouter.
    const history = createMemoryHistory();
    history.set({ value: "/" });
    return render(() => (
        <MemoryRouter history={history}>
            <Route
                path="/"
                component={() => (
                    <QueryClientProvider client={client}>
                        <PlatformGuide />
                    </QueryClientProvider>
                )}
            />
        </MemoryRouter>
    ));
}

describe("PlatformGuide", () => {
    it("renders one tab per platform and exactly one selected tab", async () => {
        renderGuide();
        // The router wrapper mounts asynchronously, so wait for the tabs before querying.
        await screen.findAllByRole("tab");
        const tabs = screen.getAllByRole("tab");
        expect(tabs).toHaveLength(8);
        expect(tabs.filter((t) => t.getAttribute("aria-selected") === "true")).toHaveLength(1);
    });

    it("moves selection and focus with the arrow keys, wrapping at the ends", async () => {
        renderGuide();
        // The router wrapper mounts asynchronously, so wait for the tabs before querying.
        await screen.findAllByRole("tab");
        const wii = screen.getByRole("tab", { name: "Wii" });
        fireEvent.click(wii);
        fireEvent.keyDown(wii, { key: "ArrowLeft" });

        const ios = screen.getByRole("tab", { name: "iOS" });
        expect(ios).toHaveAttribute("aria-selected", "true");
        expect(ios).toHaveFocus();
        expect(screen.getByRole("tabpanel")).toHaveTextContent("iPhone and iPad");
    });

    it("keeps only the selected tab in the tab order", async () => {
        renderGuide();
        // The router wrapper mounts asynchronously, so wait for the tabs before querying.
        await screen.findAllByRole("tab");
        fireEvent.click(screen.getByRole("tab", { name: "Dolphin" }));
        const inOrder = screen.getAllByRole("tab").filter((t) => t.tabIndex === 0);
        expect(inOrder.map((t) => t.textContent)).toEqual(["Dolphin"]);
    });
});

describe("bitmapToPath", () => {
    it("merges horizontal runs into one rectangle each", () => {
        expect(bitmapToPath(["##.#"])).toBe("M0 0h2v1h-2zM3 0h1v1h-1z");
    });
});
