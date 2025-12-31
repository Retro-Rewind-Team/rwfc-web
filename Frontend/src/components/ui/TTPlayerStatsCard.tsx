import { Show } from "solid-js";

interface TTPlayerStatsCardProps {
  value: number | string;
  label: string;
  icon?: string;
  colorScheme?: "blue" | "green" | "purple" | "amber";
  subtitle?: string;
}

export default function TTPlayerStatsCard(props: TTPlayerStatsCardProps) {
    const getColorClasses = () => {
        switch (props.colorScheme) {
        case "green":
            return {
                bg: "bg-green-50 dark:bg-green-900/20",
                border: "border-green-200 dark:border-green-800",
                text: "text-green-600 dark:text-green-400",
                icon: "text-green-500",
            };
        case "purple":
            return {
                bg: "bg-purple-50 dark:bg-purple-900/20",
                border: "border-purple-200 dark:border-purple-800",
                text: "text-purple-600 dark:text-purple-400",
                icon: "text-purple-500",
            };
        case "amber":
            return {
                bg: "bg-amber-50 dark:bg-amber-900/20",
                border: "border-amber-200 dark:border-amber-800",
                text: "text-amber-600 dark:text-amber-400",
                icon: "text-amber-500",
            };
        default:
            return {
                bg: "bg-blue-50 dark:bg-blue-900/20",
                border: "border-blue-200 dark:border-blue-800",
                text: "text-blue-600 dark:text-blue-400",
                icon: "text-blue-500",
            };
        }
    };

    const colors = getColorClasses();

    return (
        <div class={`${colors.bg} rounded-lg border-2 ${colors.border} p-6 text-center`}>
            <Show when={props.icon}>
                <div class={`text-3xl mb-2 ${colors.icon}`}>{props.icon}</div>
            </Show>
            <div class={`text-4xl font-black ${colors.text} mb-2`}>
                {typeof props.value === "number" ? props.value.toLocaleString() : props.value}
            </div>
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {props.label}
            </div>
            <Show when={props.subtitle}>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {props.subtitle}
                </div>
            </Show>
        </div>
    );
}