import { For, Show } from "solid-js";
import { ChevronLeft, ChevronRight } from "lucide-solid";
import { buttonClass } from "./Button";

interface InlinePaginationProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    /** Label for the item count display, e.g. "times" or "submissions". Defaults to "items". */
    itemLabel?: string;
}

/**
 * The page numbers to show: first, last, the current page and its neighbours, with `null` where a
 * gap collapses into an ellipsis. Seven slots at most, so the control keeps one width as you page.
 */
export function pageWindow(current: number, total: number): (number | null)[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, null, total];
    if (current >= total - 3) return [1, null, total - 4, total - 3, total - 2, total - 1, total];
    return [1, null, current - 1, current, current + 1, null, total];
}

/** Prev/Next, page numbers, a jump-to-page box and the "26–50 of 1,240" count, for table footers. */
export default function InlinePagination(props: InlinePaginationProps) {
    const itemLabel = () => props.itemLabel ?? "items";
    const rangeStart = () =>
        props.totalItems === 0 ? 0 : (props.currentPage - 1) * props.pageSize + 1;
    const rangeEnd = () => Math.min(props.currentPage * props.pageSize, props.totalItems);

    const trySetPage = (raw: string) => {
        const val = parseInt(raw);
        if (!isNaN(val) && val >= 1 && val <= props.totalPages) {
            if (val !== props.currentPage) props.onPageChange(val);
            return true;
        }
        return false;
    };

    return (
        <nav
            aria-label="Pagination"
            class="flex flex-col gap-3 border-t border-line bg-surface px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
        >
            <div class="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <button
                    type="button"
                    onClick={() => props.onPageChange(Math.max(1, props.currentPage - 1))}
                    disabled={props.currentPage <= 1}
                    class={buttonClass("secondary", "md")}
                >
                    <ChevronLeft size={16} aria-hidden="true" />
                    Previous
                </button>

                {/* Numbers need the room; phones keep Previous, Next and the jump box. */}
                <ol class="hidden items-center gap-1 md:flex">
                    <For each={pageWindow(props.currentPage, props.totalPages)}>
                        {(page) => (
                            <li>
                                <Show
                                    when={page !== null}
                                    fallback={
                                        <span class="px-1 text-fg-subtle" aria-hidden="true">
                                            …
                                        </span>
                                    }
                                >
                                    <button
                                        type="button"
                                        onClick={() => props.onPageChange(page!)}
                                        aria-label={`Page ${page}`}
                                        aria-current={
                                            page === props.currentPage ? "page" : undefined
                                        }
                                        class={`h-10 min-w-10 rounded-md border px-2 text-sm font-medium tabular-nums transition-colors ${
                                            page === props.currentPage
                                                ? "border-accent bg-accent-soft text-accent-text"
                                                : "border-line bg-canvas text-fg-muted hover:bg-surface hover:text-fg"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                </Show>
                            </li>
                        )}
                    </For>
                </ol>

                <button
                    type="button"
                    onClick={() =>
                        props.onPageChange(Math.min(props.totalPages, props.currentPage + 1))
                    }
                    disabled={props.currentPage >= props.totalPages}
                    class={buttonClass("secondary", "md")}
                >
                    Next
                    <ChevronRight size={16} aria-hidden="true" />
                </button>
            </div>

            <div class="flex flex-col items-center gap-2 sm:flex-row sm:justify-between lg:justify-end lg:gap-6">
                <label class="flex items-center gap-2 text-sm font-medium whitespace-nowrap text-fg-muted">
                    Go to page
                    <input
                        type="number"
                        inputmode="numeric"
                        aria-label="Page number"
                        min={1}
                        max={props.totalPages}
                        value={props.currentPage}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                const input = e.currentTarget;
                                if (!trySetPage(input.value)) {
                                    input.value = String(props.currentPage);
                                }
                            }
                        }}
                        onBlur={(e) => {
                            if (!trySetPage(e.currentTarget.value)) {
                                e.currentTarget.value = String(props.currentPage);
                            }
                        }}
                        class="h-10 w-20 [appearance:textfield] rounded-md border border-line-strong bg-canvas px-2 text-center text-fg tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span>of {props.totalPages.toLocaleString()}</span>
                </label>

                {/* polite: a page change is announced without interrupting whatever is being read. */}
                <p
                    aria-live="polite"
                    class="text-center text-sm font-medium text-fg-muted tabular-nums sm:text-right"
                >
                    {rangeStart().toLocaleString()}–{rangeEnd().toLocaleString()} of{" "}
                    {props.totalItems.toLocaleString()} {itemLabel()}
                </p>
            </div>
        </nav>
    );
}
