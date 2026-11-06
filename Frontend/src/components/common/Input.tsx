import { JSX, Show, splitProps } from "solid-js";

/** Shared input styling, exported for inputs that need custom markup around them. */
export const INPUT_CLASS =
    "h-10 w-full rounded-md border border-line-strong bg-canvas px-3 text-sm text-fg " +
    "placeholder:text-fg-subtle transition-colors duration-150 hover:border-fg-subtle " +
    "disabled:cursor-not-allowed disabled:opacity-50";

type InputProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
    id: string;
    label: string;
    /** Visually hide the label when the context already makes it obvious. It stays for screen readers. */
    hideLabel?: boolean;
    hint?: string;
};

export default function Input(props: InputProps) {
    const [local, rest] = splitProps(props, ["id", "label", "hideLabel", "hint", "class"]);
    return (
        <div class={local.class}>
            <label
                for={local.id}
                class={local.hideLabel ? "sr-only" : "mb-1.5 block text-sm font-medium text-fg"}
            >
                {local.label}
            </label>
            <input
                id={local.id}
                class={INPUT_CLASS}
                aria-describedby={local.hint ? `${local.id}-hint` : undefined}
                {...rest}
            />
            <Show when={local.hint}>
                <p id={`${local.id}-hint`} class="mt-1.5 text-xs text-fg-subtle">
                    {local.hint}
                </p>
            </Show>
        </div>
    );
}
