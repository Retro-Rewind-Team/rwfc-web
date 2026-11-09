import { JSX, Show } from "solid-js";

interface SectionHeaderProps {
    id?: string;
    title: string;
    description?: JSX.Element;
    action?: JSX.Element;
}

/** The h2 treatment for every section: title, one short line of context, optional action. */
export default function SectionHeader(props: SectionHeaderProps) {
    return (
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div class="max-w-2xl">
                <h2 id={props.id} class="type-title text-fg">
                    {props.title}
                </h2>
                <Show when={props.description}>
                    <p class="mt-3 text-base text-fg-muted">{props.description}</p>
                </Show>
            </div>
            <Show when={props.action}>
                <div class="shrink-0">{props.action}</div>
            </Show>
        </div>
    );
}
