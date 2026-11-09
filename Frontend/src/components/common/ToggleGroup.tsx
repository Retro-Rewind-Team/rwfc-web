import { For } from "solid-js";

interface ToggleOption<T extends string> {
    value: T;
    label: string;
    /** Override the active background colour for this specific option. Falls back to the group-level activeClass. */
    activeClass?: string;
}

interface ToggleGroupProps<T extends string> {
    options: ToggleOption<T>[];
    value: T;
    onChange: (value: T) => void;
    /** Active background colour applied to all options unless overridden per-option. Defaults to "bg-accent". */
    activeClass?: string;
    /** Text size: "xs" (default) or "sm". */
    size?: "xs" | "sm";
    /** Names the group for screen readers, e.g. "Engine class". Match the visible label. */
    label?: string;
}

/**
 * Segmented toggle button group. Each option can carry its own active colour via `activeClass`.
 * The selected option is exposed with `aria-pressed`; `label` names the group around it.
 */
export default function ToggleGroup<T extends string>(props: ToggleGroupProps<T>) {
    const textSize = () => (props.size === "sm" ? "text-sm" : "text-xs");

    return (
        <div
            class="flex rounded-lg border border-line bg-canvas p-1"
            role={props.label ? "group" : undefined}
            aria-label={props.label}
        >
            <For each={props.options}>
                {(opt) => {
                    const activeClass = opt.activeClass ?? props.activeClass ?? "bg-accent";
                    // Text on the accent uses its paired token: dark on lime in dark mode.
                    const activeText = activeClass.includes("bg-accent")
                        ? "text-accent-fg"
                        : "text-white";
                    return (
                        <button
                            type="button"
                            aria-pressed={props.value === opt.value}
                            onClick={() => props.onChange(opt.value)}
                            class={`flex-1 px-2 py-2 rounded-md font-medium transition-colors ${textSize()} ${
                                props.value === opt.value
                                    ? `${activeClass} ${activeText}`
                                    : "text-fg-muted hover:bg-surface hover:text-fg"
                            }`}
                        >
                            {opt.label}
                        </button>
                    );
                }}
            </For>
        </div>
    );
}
