import { For } from "solid-js";

export interface SkeletonColumn {
    /** Real header text. Keeping it means the header row is already the right height and width. */
    header: string;
    /** Same responsive classes as the real column (`hidden md:table-cell`, widths, padding). */
    class?: string;
    align?: "left" | "right";
    /** Bar width inside the cell, as a Tailwind width class. */
    bar?: string;
    /** A round block before the bar, for a column that holds a Mii or flag. */
    avatar?: boolean;
}

interface TableSkeletonProps {
    columns: SkeletonColumn[];
    rows?: number;
    /** Height of a body row. Match the real rows or the table jumps when data arrives. */
    rowClass?: string;
    /** Announced to screen readers while the real table is on its way. */
    label?: string;
    /** Set when the real table sits inside a fixed-layout wrapper. */
    tableClass?: string;
}

/** A grey placeholder block. Pulses only for people who have not asked for reduced motion. */
export function SkeletonBar(props: { class?: string }) {
    return (
        <span
            class={`block rounded-sm bg-line motion-safe:animate-pulse ${props.class ?? "h-4 w-full"}`}
            aria-hidden="true"
        />
    );
}

/**
 * Placeholder rows in the shape of a data table. It replaces the spinner so the page keeps its
 * height while loading, instead of a short box that is replaced by a tall table.
 */
export default function TableSkeleton(props: TableSkeletonProps) {
    const rows = () => Array.from({ length: props.rows ?? 10 });

    return (
        <div class="relative overflow-x-auto" role="status" aria-busy="true">
            <span class="sr-only">{props.label ?? "Loading"}</span>
            <table class={`w-full ${props.tableClass ?? ""}`} aria-hidden="true">
                <thead class="border-b border-line bg-surface">
                    <tr>
                        <For each={props.columns}>
                            {(col) => (
                                <th
                                    scope="col"
                                    class={`px-2 py-3 text-xs font-medium text-fg-muted sm:px-4 ${
                                        col.align === "right" ? "text-right" : "text-left"
                                    } ${col.class ?? ""}`}
                                >
                                    {col.header}
                                </th>
                            )}
                        </For>
                    </tr>
                </thead>
                <tbody class="divide-y divide-line">
                    <For each={rows()}>
                        {() => (
                            <tr class={props.rowClass ?? "h-16"}>
                                <For each={props.columns}>
                                    {(col) => (
                                        <td class={`px-2 py-3 sm:px-4 ${col.class ?? ""}`}>
                                            <div
                                                class={`flex items-center gap-3 ${
                                                    col.align === "right" ? "justify-end" : ""
                                                }`}
                                            >
                                                {col.avatar && (
                                                    <SkeletonBar class="hidden size-12 shrink-0 rounded-full sm:block" />
                                                )}
                                                <SkeletonBar class={`h-4 ${col.bar ?? "w-24"}`} />
                                            </div>
                                        </td>
                                    )}
                                </For>
                            </tr>
                        )}
                    </For>
                </tbody>
            </table>
        </div>
    );
}
