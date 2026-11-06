import { Show } from "solid-js";

interface PositionBadgeProps {
    pos: number | null;
    size?: "md" | "lg";
}

function positionClass(pos: number): string {
    if (pos === 1) return "text-yellow-500 dark:text-yellow-400 font-semibold";
    if (pos === 2) return "text-gray-400 dark:text-gray-300 font-semibold";
    if (pos === 3) return "text-amber-600 dark:text-amber-500 font-semibold";
    return "text-fg-subtle font-medium";
}

export default function PositionBadge(props: PositionBadgeProps) {
    const textSize = () => (props.size === "lg" ? "text-sm" : "text-xs");

    return (
        <Show
            when={props.pos !== null}
            fallback={<span class={`${textSize()} text-fg-subtle italic`}>DNF</span>}
        >
            <span class={`${textSize()} ${positionClass(props.pos!)} tabular-nums`}>
                {props.pos}
            </span>
        </Show>
    );
}
