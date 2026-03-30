import { JSX, Show } from "solid-js";

interface StatCardProps {
  value: string | number;
  label: string;
  colorScheme: "emerald" | "blue" | "purple" | "cyan" | "orange";
  icon?: JSX.Element;
  subtitle?: string;
}

const colorClasses = {
    emerald: {
        border: "border-emerald-200 dark:border-emerald-800",
        text: "text-emerald-600 dark:text-emerald-400",
        label: "text-gray-600 dark:text-gray-400",
        subtitle: "text-gray-400 dark:text-gray-500",
        icon: "text-emerald-500 dark:text-emerald-400",
    },
    blue: {
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-600 dark:text-blue-400",
        label: "text-gray-600 dark:text-gray-400",
        subtitle: "text-gray-400 dark:text-gray-500",
        icon: "text-blue-500 dark:text-blue-400",
    },
    purple: {
        border: "border-purple-200 dark:border-purple-800",
        text: "text-purple-600 dark:text-purple-400",
        label: "text-gray-600 dark:text-gray-400",
        subtitle: "text-gray-400 dark:text-gray-500",
        icon: "text-purple-500 dark:text-purple-400",
    },
    cyan: {
        border: "border-cyan-200 dark:border-cyan-800",
        text: "text-cyan-600 dark:text-cyan-400",
        label: "text-gray-600 dark:text-gray-400",
        subtitle: "text-gray-400 dark:text-gray-500",
        icon: "text-cyan-500 dark:text-cyan-400",
    },
    orange: {
        border: "border-orange-200 dark:border-orange-800",
        text: "text-orange-600 dark:text-orange-400",
        label: "text-gray-600 dark:text-gray-400",
        subtitle: "text-gray-400 dark:text-gray-500",
        icon: "text-orange-500 dark:text-orange-400",
    },
};

export default function StatCard(props: StatCardProps) {
    const colors = colorClasses[props.colorScheme];

    return (
        <div
            class={`bg-white dark:bg-gray-800 rounded-xl border-2 ${colors.border} p-6 flex flex-col items-center justify-center`}
        >
            <Show when={props.icon}>
                <div class={`mb-3 ${colors.icon}`}>{props.icon}</div>
            </Show>
            <div class={`text-4xl font-bold ${colors.text} mb-1`}>
                {typeof props.value === "number"
                    ? props.value.toLocaleString()
                    : props.value}
            </div>
            <div class={`text-sm font-semibold ${colors.label}`}>{props.label}</div>
            <Show when={props.subtitle}>
                <div class={`mt-1 text-xs ${colors.subtitle}`}>{props.subtitle}</div>
            </Show>
        </div>
    );
}
