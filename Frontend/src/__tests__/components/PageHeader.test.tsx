import { render, screen } from "@solidjs/testing-library";
import { createMemoryHistory, MemoryRouter, Route } from "@solidjs/router";
import { describe, expect, it } from "vitest";
import type { JSX } from "solid-js";
import PageHeader from "../../components/common/PageHeader";
import { PAGE_HEADERS } from "../../constants/pageHeaders";

// Breadcrumbs render router links, so the header needs a router around it.
function renderInRouter(view: () => JSX.Element) {
    const history = createMemoryHistory();
    history.set({ value: "/" });
    return render(() => (
        <MemoryRouter history={history}>
            <Route path="/" component={view} />
        </MemoryRouter>
    ));
}

describe("PageHeader", () => {
    it("renders the page title as the only h1, with its description", async () => {
        renderInRouter(() => (
            <PageHeader page="races" title="Races" description="Recorded online races." />
        ));
        const h1 = await screen.findByRole("heading", { level: 1 });
        expect(h1).toHaveTextContent("Races");
        expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
        expect(screen.getByText("Recorded online races.")).toBeInTheDocument();
    });

    it("renders breadcrumbs as a labelled navigation trail", async () => {
        renderInRouter(() => (
            <PageHeader
                page="ttTrack"
                compact
                crumbs={[{ label: "Time trials", href: "/tt" }]}
                title="SNES Mario Circuit 1"
            />
        ));
        const nav = await screen.findByRole("navigation", { name: "Breadcrumb" });
        expect(nav).toContainElement(screen.getByRole("link", { name: "Time trials" }));
    });

    it("uses a page-supplied visual instead of the registry art", async () => {
        renderInRouter(() => (
            <PageHeader page="tools" title="Tools" visual={<p>Custom visual</p>} />
        ));
        expect(await screen.findByText("Custom visual")).toBeInTheDocument();
    });

    it("shows the registry image with its alt text when real art exists", async () => {
        renderInRouter(() => <PageHeader page="downloads" title="Downloads" />);
        const img = await screen.findByRole("img");
        expect(img).toHaveAttribute("alt", PAGE_HEADERS.downloads.art!.alt);
        expect(img).toHaveAttribute("width", String(PAGE_HEADERS.downloads.art!.width));
    });
});

describe("PAGE_HEADERS", () => {
    it("describes the asset still needed for every page without art", () => {
        for (const [key, asset] of Object.entries(PAGE_HEADERS)) {
            expect(asset.needed.length, key).toBeGreaterThan(0);
        }
    });
});
