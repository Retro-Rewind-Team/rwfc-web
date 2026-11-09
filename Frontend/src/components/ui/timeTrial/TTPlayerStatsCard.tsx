import { JSX, Show } from "solid-js";

interface TTPlayerStatsCardProps {
    value: number | string;
    label: string;
    icon?: JSX.Element;
    colorScheme?: "blue" | "green" | "purple" | "amber";
    subtitle?: string;
}

const colorClasses = {
    blue: {
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-600 dark:text-blue-400",
        icon: "text-blue-500 dark:text-blue-400",
    },
    green: {
        border: "border-green-200 dark:border-green-800",
        text: "text-green-600 dark:text-green-400",
        icon: "text-green-500 dark:text-green-400",
    },
    purple: {
        border: "border-purple-200 dark:border-purple-800",
        text: "text-purple-600 dark:text-purple-400",
        icon: "text-purple-500 dark:text-purple-400",
    },
    amber: {
        border: "border-amber-200 dark:border-amber-800",
        text: "text-amber-600 dark:text-amber-400",
        icon: "text-amber-500 dark:text-amber-400",
    },
};

export default function TTPlayerStatsCard(props: TTPlayerStatsCardProps) {
    const colors = () => colorClasses[props.colorScheme ?? "blue"];

    return (
        <div class={`bg-canvas rounded-lg border ${colors().border} p-6 text-center`}>
            <Show when={props.icon}>
                <div class={`flex justify-center mb-3 ${colors().icon}`}>{props.icon}</div>
            </Show>
            <div class={`text-4xl font-black ${colors().text} mb-2`}>
                {typeof props.value === "number" ? props.value.toLocaleString() : props.value}
            </div>
            <div class="text-sm font-medium text-fg-muted">{props.label}</div>
            <Show when={props.subtitle}>
                <div class="text-xs text-fg-subtle mt-1">{props.subtitle}</div>
            </Show>
        </div>
    );
}
