import { Show } from "solid-js";

interface PositionBadgeProps {
    pos: number | null;
    size?: "md" | "lg";
}

function positionBadgeClass(pos: number): string {
    if (pos === 1) return "bg-yellow-400 text-yellow-900 font-bold";
    if (pos === 2) return "bg-gray-300 text-gray-800 font-bold";
    if (pos === 3) return "bg-amber-600 text-white font-bold";
    return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
}

export default function PositionBadge(props: PositionBadgeProps) {
    const dim = () => (props.size === "lg" ? "w-7 h-7" : "w-6 h-6");

    return (
        <Show
            when={props.pos !== null}
            fallback={
                <span
                    class={`inline-flex items-center justify-center ${dim()} rounded-full text-xs bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 font-medium`}
                >
                    DNF
                </span>
            }
        >
            <span
                class={`inline-flex items-center justify-center ${dim()} rounded-full text-xs ${positionBadgeClass(props.pos!)}`}
            >
                {props.pos}
            </span>
        </Show>
    );
}
