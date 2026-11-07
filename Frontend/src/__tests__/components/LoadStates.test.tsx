import { fireEvent, render, screen, waitFor } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import EmptyState from "../../components/common/EmptyState";
import QueryError from "../../components/common/QueryError";
import TableSkeleton from "../../components/common/TableSkeleton";

describe("TableSkeleton", () => {
    const columns = [
        { header: "Rank" },
        { header: "Player", avatar: true },
        { header: "VR", align: "right" as const, class: "hidden md:table-cell" },
    ];

    it("renders the requested number of placeholder rows under the real headers", () => {
        render(() => <TableSkeleton columns={columns} rows={4} />);

        // aria-hidden hides the table from the accessibility tree, so look the rows up directly.
        expect(document.querySelectorAll("tbody tr")).toHaveLength(4);
        expect(
            Array.from(document.querySelectorAll("thead th")).map((th) => th.textContent),
        ).toEqual(["Rank", "Player", "VR"]);
    });

    it("carries each column's responsive classes to its cells", () => {
        render(() => <TableSkeleton columns={columns} rows={1} />);

        const cells = document.querySelectorAll("tbody tr td");
        expect(cells[2]).toHaveClass("hidden", "md:table-cell");
    });

    it("announces loading once, and keeps the placeholder table out of the reading order", () => {
        render(() => <TableSkeleton columns={columns} label="Loading the leaderboard" />);

        const status = screen.getByRole("status");
        expect(status).toHaveAttribute("aria-busy", "true");
        expect(status).toHaveTextContent("Loading the leaderboard");
        expect(document.querySelector("table")).toHaveAttribute("aria-hidden", "true");
    });
});

describe("EmptyState", () => {
    it("says what is missing, what to try and offers the fix", () => {
        const onClear = vi.fn();
        render(() => (
            <EmptyState
                title='No players match "abc"'
                action={<button onClick={onClear}>Clear search</button>}
            >
                Check the spelling.
            </EmptyState>
        ));

        expect(screen.getByRole("heading", { name: 'No players match "abc"' })).toBeInTheDocument();
        expect(screen.getByText("Check the spelling.")).toBeInTheDocument();
        screen.getByRole("button", { name: "Clear search" }).click();
        expect(onClear).toHaveBeenCalledOnce();
    });

    it("omits the action when there is none", () => {
        render(() => <EmptyState title="Nothing here" />);

        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
});

describe("QueryError", () => {
    it("is announced as an alert with a Retry button", () => {
        render(() => <QueryError title="Couldn't load the leaderboard" onRetry={() => {}} />);

        expect(screen.getByRole("alert")).toHaveTextContent("Couldn't load the leaderboard");
        expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    });

    it("shows the error message when there is one", () => {
        render(() => (
            <QueryError
                title="Couldn't load"
                error={new Error("HTTP 503: Service Unavailable")}
                onRetry={() => {}}
            />
        ));

        expect(screen.getByText("HTTP 503: Service Unavailable")).toBeInTheDocument();
    });

    it("retries when pressed and disables the button while the retry runs", async () => {
        let finish!: () => void;
        const onRetry = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
        render(() => <QueryError title="Couldn't load" onRetry={onRetry} />);

        fireEvent.click(screen.getByRole("button", { name: "Retry" }));

        expect(onRetry).toHaveBeenCalledOnce();
        // No second click can start a second request while the first is in flight.
        const busy = await screen.findByRole("button", { name: /retrying/i });
        expect(busy).toBeDisabled();

        finish();
        await waitFor(() => expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled());
    });
});
