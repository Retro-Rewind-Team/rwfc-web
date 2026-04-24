import { batch, createSignal } from "solid-js";

/**
 * Encapsulates page/pageSize signals and the handlePageSizeChange handler that
 * resets to page 1 whenever the page size changes. Use `setCurrentPage` directly
 * to reset pagination when filters change.
 */
export function usePagination(defaultPageSize = 10) {
    const [currentPage, setCurrentPage] = createSignal(1);
    const [pageSize, setPageSize] = createSignal(defaultPageSize);

    const handlePageSizeChange = (size: number) => {
        batch(() => {
            setPageSize(size);
            setCurrentPage(1);
        });
    };

    return { currentPage, setCurrentPage, pageSize, setPageSize, handlePageSizeChange };
}
