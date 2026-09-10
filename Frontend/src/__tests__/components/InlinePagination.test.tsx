import { render, screen } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import InlinePagination from "../../components/common/InlinePagination";

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
});
