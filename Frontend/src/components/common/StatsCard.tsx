import { JSX, Show } from "solid-js";

interface StatCardProps {
    value: string | number;
    label: string;
    /**
     * Kept so existing call sites compile. Stat cards no longer colour-code: one accent, used
     * sparingly, reads calmer than five competing colours. Safe to remove from call sites.
     */
    colorScheme?: "emerald" | "blue" | "purple" | "cyan" | "orange";
    icon?: JSX.Element;
    subtitle?: string;
}

export default function StatCard(props: StatCardProps) {
    return (
        <div class="flex flex-col rounded-lg border border-line bg-canvas p-5">
            <Show when={props.icon}>
                <div class="mb-3 text-fg-subtle" aria-hidden="true">
                    {props.icon}
                </div>
            </Show>
            <div class="text-sm text-fg-muted">{props.label}</div>
            <div class="mt-1 text-3xl font-semibold tracking-tight text-fg tabular-nums">
                {typeof props.value === "number" ? props.value.toLocaleString() : props.value}
            </div>
            <Show when={props.subtitle}>
                <div class="mt-1 text-xs text-fg-subtle">{props.subtitle}</div>
            </Show>
        </div>
    );
}
