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
    /** Active background colour applied to all options unless overridden per-option. Defaults to "bg-blue-600". */
    activeClass?: string;
    /** Text size: "xs" (default) or "sm". */
    size?: "xs" | "sm";
}

/** Segmented toggle button group. Each option can carry its own active colour via `activeClass`. */
export default function ToggleGroup<T extends string>(props: ToggleGroupProps<T>) {
    const textSize = () => (props.size === "sm" ? "text-sm" : "text-xs");

    return (
        <div class="bg-white dark:bg-gray-800 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
            <For each={props.options}>
                {(opt) => {
                    const activeClass = opt.activeClass ?? props.activeClass ?? "bg-blue-600";
                    return (
                        <button
                            type="button"
                            onClick={() => props.onChange(opt.value)}
                            class={`flex-1 px-2 py-2 rounded-md font-medium transition-all ${textSize()} ${
                                props.value === opt.value
                                    ? `${activeClass} text-white shadow-sm`
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
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
