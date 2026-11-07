import { JSX, Show, splitProps } from "solid-js";
import { ChevronDown } from "lucide-solid";
import { INPUT_CLASS } from "./Input";

type SelectProps = JSX.SelectHTMLAttributes<HTMLSelectElement> & {
    id: string;
    label: string;
    /** Visually hide the label when the context already makes it obvious. It stays for screen readers. */
    hideLabel?: boolean;
    hint?: string;
};

/** Native select (best mobile and keyboard behaviour) with the shared input look. */
export default function Select(props: SelectProps) {
    const [local, rest] = splitProps(props, [
        "id",
        "label",
        "hideLabel",
        "hint",
        "class",
        "children",
    ]);
    return (
        <div class={local.class}>
            <label
                for={local.id}
                class={local.hideLabel ? "sr-only" : "mb-1.5 block text-sm font-medium text-fg"}
            >
                {local.label}
            </label>
            <div class="relative">
                <select
                    id={local.id}
                    class={`${INPUT_CLASS} min-w-0 appearance-none pr-9`}
                    aria-describedby={local.hint ? `${local.id}-hint` : undefined}
                    {...rest}
                >
                    {local.children}
                </select>
                <ChevronDown
                    size={16}
                    class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-fg-subtle"
                    aria-hidden="true"
                />
            </div>
            <Show when={local.hint}>
                <p id={`${local.id}-hint`} class="mt-1.5 text-xs text-fg-subtle">
                    {local.hint}
                </p>
            </Show>
        </div>
    );
}
