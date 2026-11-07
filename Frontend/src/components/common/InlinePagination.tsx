import { ChevronLeft, ChevronRight } from "lucide-solid";

interface InlinePaginationProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    /** Label for the item count display, e.g. "times" or "submissions". Defaults to "items". */
    itemLabel?: string;
}

/** Prev/Next + page number input + item count display used inside table footers. */
export default function InlinePagination(props: InlinePaginationProps) {
    const itemLabel = () => props.itemLabel ?? "items";
    const rangeStart = () => (props.currentPage - 1) * props.pageSize + 1;
    const rangeEnd = () => Math.min(props.currentPage * props.pageSize, props.totalItems);

    const trySetPage = (raw: string) => {
        const val = parseInt(raw);
        if (!isNaN(val) && val >= 1 && val <= props.totalPages) {
            props.onPageChange(val);
            return true;
        }
        return false;
    };

    return (
        <div class="bg-surface px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-line gap-2 sm:gap-0">
            <div class="flex items-center justify-center sm:justify-start gap-2">
                <button
                    type="button"
                    onClick={() => props.onPageChange(Math.max(1, props.currentPage - 1))}
                    disabled={props.currentPage === 1}
                    class="inline-flex items-center gap-1 px-4 py-2 bg-accent hover:bg-accent-hover disabled:bg-gray-300 dark:disabled:bg-gray-600 text-accent-fg rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={16} />
                    Previous
                </button>

                <span class="flex items-center gap-2 text-sm text-gray-600 dark:text-white/70 font-medium whitespace-nowrap">
                    Page
                    <input
                        type="number"
                        aria-label="Page number"
                        min={1}
                        max={props.totalPages}
                        value={props.currentPage}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                const input = e.target as HTMLInputElement;
                                if (!trySetPage(input.value)) {
                                    input.value = String(props.currentPage);
                                }
                            }
                        }}
                        onBlur={(e) => {
                            if (!trySetPage(e.target.value)) {
                                e.target.value = String(props.currentPage);
                            }
                        }}
                        class="w-16 px-2 py-1 text-center border border-line-strong rounded-lg bg-canvas text-fg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    of {props.totalPages}
                </span>

                <button
                    type="button"
                    onClick={() =>
                        props.onPageChange(Math.min(props.totalPages, props.currentPage + 1))
                    }
                    disabled={props.currentPage >= props.totalPages}
                    class="inline-flex items-center gap-1 px-4 py-2 bg-accent hover:bg-accent-hover disabled:bg-gray-300 dark:disabled:bg-gray-600 text-accent-fg rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Next
                    <ChevronRight size={16} />
                </button>
            </div>

            <div class="text-sm text-fg-muted font-medium text-center sm:text-right">
                Showing {rangeStart()}–{rangeEnd()} of {props.totalItems} {itemLabel()}
            </div>
        </div>
    );
}
