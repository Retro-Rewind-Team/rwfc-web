import { JSX, Show } from "solid-js";

interface EmptyStateProps {
    icon?: JSX.Element;
    /** What is missing, e.g. `No players match "abc"`. */
    title: string;
    /** What to try next. Say something specific; "try different filters" is not help. */
    children?: JSX.Element;
    /** The one-click fix, usually a `Button` that clears the search or filters. */
    action?: JSX.Element;
}

/** Shown when a query worked but returned nothing. Says why and offers the way out. */
export default function EmptyState(props: EmptyStateProps) {
    return (
        <div class="px-4 py-12 text-center sm:py-16">
            <Show when={props.icon}>
                <div class="mb-4 flex justify-center text-fg-subtle" aria-hidden="true">
                    {props.icon}
                </div>
            </Show>
            <h3 class="type-heading text-fg">{props.title}</h3>
            <Show when={props.children}>
                <p class="mx-auto mt-2 max-w-prose text-sm text-fg-muted">{props.children}</p>
            </Show>
            <Show when={props.action}>
                <div class="mt-5 flex justify-center">{props.action}</div>
            </Show>
        </div>
    );
}
