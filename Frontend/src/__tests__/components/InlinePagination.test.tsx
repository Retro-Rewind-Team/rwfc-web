import { fireEvent, render, screen } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import InlinePagination, { pageWindow } from "../../components/common/InlinePagination";

/**
 * First component test in the suite. Until the Vitest environment moved to jsdom and the include
 * glob accepted .tsx, nothing in components/ could be tested at all.
 */
describe("InlinePagination", () => {
    const buttons = () => ({
        prev: screen.getByRole("button", { name: /prev/i }),
        next: screen.getByRole("button", { name: /next/i }),
    });

    it("disables Next when there are no pages", () => {
        // currentPage 1 with totalPages 0 is the empty-result case. Comparing the two for equality
        // left Next enabled, offering to page past the end of nothing.
        render(() => (
            <InlinePagination
                currentPage={1}
                totalPages={0}
                pageSize={10}
                totalItems={0}
                onPageChange={() => {}}
            />
        ));

        expect(buttons().next).toBeDisabled();
        expect(buttons().prev).toBeDisabled();
    });

    it("disables Next on the final page and Prev on the first", () => {
        render(() => (
            <InlinePagination
                currentPage={3}
                totalPages={3}
                pageSize={10}
                totalItems={25}
                onPageChange={() => {}}
            />
        ));

        expect(buttons().next).toBeDisabled();
        expect(buttons().prev).not.toBeDisabled();
    });

    it("enables both in the middle of the range", () => {
        render(() => (
            <InlinePagination
                currentPage={2}
                totalPages={3}
                pageSize={10}
                totalItems={25}
                onPageChange={() => {}}
            />
        ));

        expect(buttons().next).not.toBeDisabled();
        expect(buttons().prev).not.toBeDisabled();
    });

    it("reports the item range for the current page", () => {
        render(() => (
            <InlinePagination
                currentPage={2}
                totalPages={3}
                pageSize={10}
                totalItems={25}
                onPageChange={() => {}}
                itemLabel="times"
            />
        ));

        // Second page of 25 items, ten per page.
        expect(screen.getByText(/11/)).toBeInTheDocument();
        expect(screen.getByText(/times/)).toBeInTheDocument();
    });

    it("clamps the final page's range to the item count", () => {
        render(() => (
            <InlinePagination
                currentPage={3}
                totalPages={3}
                pageSize={10}
                totalItems={25}
                onPageChange={() => {}}
            />
        ));

        // 21 to 25, not 21 to 30.
        expect(screen.getByText(/25/)).toBeInTheDocument();
        expect(screen.queryByText(/30/)).not.toBeInTheDocument();
    });

    it("asks for the next page when Next is pressed", () => {
        const onPageChange = vi.fn();
        render(() => (
            <InlinePagination
                currentPage={1}
                totalPages={3}
                pageSize={10}
                totalItems={25}
                onPageChange={onPageChange}
            />
        ));

        buttons().next.click();

        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("re-evaluates its disabled state when the page changes", () => {
        const [page, setPage] = createSignal(1);
        render(() => (
            <InlinePagination
                currentPage={page()}
                totalPages={2}
                pageSize={10}
                totalItems={15}
                onPageChange={setPage}
            />
        ));

        expect(buttons().prev).toBeDisabled();

        setPage(2);

        // Props are reactive getters; reading them once would freeze this in its initial state.
        expect(buttons().prev).not.toBeDisabled();
        expect(buttons().next).toBeDisabled();
    });

    it("shows the range and total with thousands separators", () => {
        render(() => (
            <InlinePagination
                currentPage={2}
                totalPages={50}
                pageSize={25}
                totalItems={1240}
                onPageChange={() => {}}
                itemLabel="racers"
            />
        ));

        // 26 to 50 of 1,240, the form the page promises.
        expect(screen.getByText("26–50 of 1,240 racers")).toBeInTheDocument();
    });

    it("jumps to a page when one is typed and Enter is pressed", () => {
        const onPageChange = vi.fn();
        render(() => (
            <InlinePagination
                currentPage={1}
                totalPages={50}
                pageSize={25}
                totalItems={1240}
                onPageChange={onPageChange}
            />
        ));
        const input = screen.getByRole("spinbutton", { name: /page number/i });

        fireEvent.input(input, { target: { value: "30" } });
        fireEvent.keyDown(input, { key: "Enter" });

        expect(onPageChange).toHaveBeenCalledWith(30);
    });

    it("rejects a page past the end and restores the current one", () => {
        const onPageChange = vi.fn();
        render(() => (
            <InlinePagination
                currentPage={2}
                totalPages={5}
                pageSize={10}
                totalItems={50}
                onPageChange={onPageChange}
            />
        ));
        const input = screen.getByRole("spinbutton", { name: /page number/i }) as HTMLInputElement;

        fireEvent.input(input, { target: { value: "99" } });
        fireEvent.keyDown(input, { key: "Enter" });

        expect(onPageChange).not.toHaveBeenCalled();
        expect(input.value).toBe("2");
    });

    it("marks the current page and goes to a numbered page when it is pressed", () => {
        const onPageChange = vi.fn();
        render(() => (
            <InlinePagination
                currentPage={2}
                totalPages={5}
                pageSize={10}
                totalItems={50}
                onPageChange={onPageChange}
            />
        ));

        expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute(
            "aria-current",
            "page",
        );
        screen.getByRole("button", { name: "Page 4" }).click();

        expect(onPageChange).toHaveBeenCalledWith(4);
    });
});

describe("pageWindow", () => {
    it("lists every page when there are few", () => {
        expect(pageWindow(2, 5)).toEqual([1, 2, 3, 4, 5]);
    });

    it("collapses the far end near the start", () => {
        expect(pageWindow(1, 50)).toEqual([1, 2, 3, 4, 5, null, 50]);
    });

    it("collapses both ends in the middle and keeps neighbours", () => {
        expect(pageWindow(25, 50)).toEqual([1, null, 24, 25, 26, null, 50]);
    });

    it("collapses the near end at the finish", () => {
        expect(pageWindow(50, 50)).toEqual([1, null, 46, 47, 48, 49, 50]);
    });

    it("always has the same number of slots once it collapses, so the control keeps its width", () => {
        const lengths = new Set([1, 4, 5, 25, 46, 50].map((p) => pageWindow(p, 50).length));
        expect(lengths).toEqual(new Set([7]));
    });
});
