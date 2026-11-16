import { Show } from "solid-js";
import { Search, X } from "lucide-solid";
import { INPUT_CLASS } from "./Input";

interface SearchInputProps {
    id: string;
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    hideLabel?: boolean;
    hint?: string;
    /** Friend codes: monospace, numeric keypad on phones. */
    friendCode?: boolean;
    maxLength?: number;
    class?: string;
}

/** Search field with a leading icon and a clear button once there is text. */
export default function SearchInput(props: SearchInputProps) {
    return (
        <div class={props.class}>
            <label
                for={props.id}
                class={props.hideLabel ? "sr-only" : "mb-1.5 block text-sm font-medium text-fg"}
            >
                {props.label}
            </label>
            <div class="relative">
                <Search
                    size={16}
                    class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-subtle"
                    aria-hidden="true"
                />
                <input
                    id={props.id}
                    type="search"
                    value={props.value}
                    onInput={(e) => props.onValueChange(e.currentTarget.value)}
                    placeholder={props.placeholder}
                    maxLength={props.maxLength}
                    autocomplete="off"
                    spellcheck={false}
                    inputmode={props.friendCode ? "numeric" : "search"}
                    aria-describedby={props.hint ? `${props.id}-hint` : undefined}
                    class={`${INPUT_CLASS} pr-9 pl-9 ${props.friendCode ? "font-mono" : ""} search-plain`}
                />
                <Show when={props.value}>
                    <button
                        type="button"
                        onClick={() => props.onValueChange("")}
                        aria-label={`Clear ${props.label.toLowerCase()}`}
                        class="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-fg-subtle transition-colors hover:text-fg"
                    >
                        <X size={14} aria-hidden="true" />
                    </button>
                </Show>
            </div>
            <Show when={props.hint}>
                <p id={`${props.id}-hint`} class="mt-1.5 text-xs text-fg-subtle">
                    {props.hint}
                </p>
            </Show>
        </div>
    );
}
