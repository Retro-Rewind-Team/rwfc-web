import { For, Show } from "solid-js";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination(props: Readonly<PaginationProps>) {
    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (
            let i = Math.max(2, props.currentPage - delta);
            i <= Math.min(props.totalPages - 1, props.currentPage + delta);
            i++
        ) {
            range.push(i);
        }

        if (props.currentPage - delta > 2) {
            rangeWithDots.push(1, "...");
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (props.currentPage + delta < props.totalPages - 1) {
            rangeWithDots.push("...", props.totalPages);
        } else {
            rangeWithDots.push(props.totalPages);
        }

        return rangeWithDots;
    };

    return (
        <div class="flex justify-center items-center space-x-2">
            {/* Previous Button */}
            <button
                onClick={() => props.onPageChange(props.currentPage - 1)}
                disabled={props.currentPage === 1}
                class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
        Previous
            </button>

            {/* Page Numbers */}
            <div class="flex space-x-1">
                <For each={getVisiblePages()}>
                    {(page) => (
                        <Show
                            when={typeof page === "number"}
                            fallback={<span class="px-3 py-2 text-gray-500">...</span>}
                        >
                            <button
                                onClick={() => props.onPageChange(page as number)}
                                class={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    props.currentPage === page
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                {page}
                            </button>
                        </Show>
                    )}
                </For>
            </div>

            {/* Next Button */}
            <button
                onClick={() => props.onPageChange(props.currentPage + 1)}
                disabled={props.currentPage === props.totalPages}
                class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
        Next
            </button>
        </div>
    );
}
