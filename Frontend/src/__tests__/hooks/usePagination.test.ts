import { createRoot } from "solid-js";
import { describe, expect, it } from "vitest";
import { usePagination } from "../../hooks/usePagination";

describe("usePagination", () => {
    it("defaults to page 1 and provided page size", () => {
        createRoot((dispose) => {
            const { currentPage, pageSize } = usePagination(20);
            expect(currentPage()).toBe(1);
            expect(pageSize()).toBe(20);
            dispose();
        });
    });

    it("setCurrentPage updates the page directly", () => {
        createRoot((dispose) => {
            const { currentPage, setCurrentPage } = usePagination(10);
            setCurrentPage(5);
            expect(currentPage()).toBe(5);
            dispose();
        });
    });

    it("handlePageSizeChange updates page size and resets page to 1", () => {
        createRoot((dispose) => {
            const { currentPage, pageSize, setCurrentPage, handlePageSizeChange } =
                usePagination(10);
            setCurrentPage(4);
            handlePageSizeChange(25);
            expect(pageSize()).toBe(25);
            expect(currentPage()).toBe(1);
            dispose();
        });
    });

    it("setCurrentPage does not change page size", () => {
        createRoot((dispose) => {
            const { pageSize, setCurrentPage } = usePagination(10);
            setCurrentPage(3);
            expect(pageSize()).toBe(10);
            dispose();
        });
    });
});
