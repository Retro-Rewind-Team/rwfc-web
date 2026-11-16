import { JSX, Show } from "solid-js";
import SectionHeader from "./SectionHeader";
import { reveal } from "../../utils/motion";

interface SectionProps {
    /** Used for the heading id and the section's aria-labelledby, and as the in-page anchor. */
    id: string;
    title: string;
    description?: JSX.Element;
    /** Optional link or button shown beside the heading on wide screens. */
    action?: JSX.Element;
    /** First section on a page sits under the page header and does not need a top rule. */
    divider?: boolean;
    /**
     * Fade the whole body in as one block (default). Turn off when the children stagger their
     * own reveals, so nothing animates twice.
     */
    revealBody?: boolean;
    children: JSX.Element;
}

/**
 * Every page section uses this so spacing and the rule between sections stay identical on every
 * route. Sections are separated by a hairline rather than alternating backgrounds.
 */
export default function Section(props: SectionProps) {
    return (
        <section
            id={props.id}
            aria-labelledby={`${props.id}-title`}
            class={`py-14 sm:py-20 ${props.divider === false ? "" : "border-t border-line"}`}
        >
            <div {...reveal(0)}>
                <SectionHeader
                    id={`${props.id}-title`}
                    title={props.title}
                    description={props.description}
                    action={props.action}
                />
            </div>
            <Show when={props.children}>
                <Show
                    when={props.revealBody !== false}
                    fallback={<div class="mt-8 sm:mt-10">{props.children}</div>}
                >
                    <div class="mt-8 sm:mt-10" {...reveal(1)}>
                        {props.children}
                    </div>
                </Show>
            </Show>
        </section>
    );
}
