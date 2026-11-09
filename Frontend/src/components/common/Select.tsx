import { createEffect, createSignal, JSX, onCleanup, Show, splitProps } from "solid-js";
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
        "value",
    ]);

    const [select, setSelect] = createSignal<HTMLSelectElement>();
    // A select shows its first option when `value` is set before the options exist, which is the
    // order a spread attribute runs in, and again whenever the options arrive later (a track list
    // that is still loading). So the value is applied after render, on change, and when the option
    // list changes. Without it a shared link such as ?size=25 filters correctly and shows the wrong
    // choice.
    const applyValue = () => {
        const element = select();
        if (element && local.value !== undefined) element.value = String(local.value);
    };
    createEffect(applyValue);
    createEffect(() => {
        const element = select();
        if (!element) return;
        const observer = new MutationObserver(applyValue);
        observer.observe(element, { childList: true });
        onCleanup(() => observer.disconnect());
    });

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
                    ref={setSelect}
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
