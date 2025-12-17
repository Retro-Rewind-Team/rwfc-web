import { JSX } from "solid-js";

interface StatCardProps {
    value: string | number;
    label: string;
    colorScheme: "emerald" | "blue" | "purple" | "cyan" | "orange";
    icon?: string | JSX.Element;
}

export default function StatCard(props: StatCardProps) {
    const colorClasses = {
        emerald: {
            bg: "from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30",
            border: "border-emerald-200 dark:border-emerald-800",
            text: "text-emerald-600 dark:text-emerald-400",
            label: "text-emerald-700 dark:text-emerald-300"
        },
        blue: {
            bg: "from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30",
            border: "border-blue-200 dark:border-blue-800",
            text: "text-blue-600 dark:text-blue-400",
            label: "text-blue-700 dark:text-blue-300"
        },
        purple: {
            bg: "from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30",
            border: "border-purple-200 dark:border-purple-800",
            text: "text-purple-600 dark:text-purple-400",
            label: "text-purple-700 dark:text-purple-300"
        },
        cyan: {
            bg: "from-cyan-50 to-cyan-100 dark:from-cyan-950/30 dark:to-cyan-900/30",
            border: "border-cyan-200 dark:border-cyan-800",
            text: "text-cyan-600 dark:text-cyan-400",
            label: "text-cyan-700 dark:text-cyan-300"
        },
        orange: {
            bg: "from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30",
            border: "border-orange-200 dark:border-orange-800",
            text: "text-orange-600 dark:text-orange-400",
            label: "text-orange-700 dark:text-orange-300"
        }
    };

    const colors = colorClasses[props.colorScheme];

    return (
        <div class={`bg-gradient-to-br ${colors.bg} rounded-xl border-2 ${colors.border} p-6 transition-all hover:shadow-lg hover:scale-105`}>
            <div class="flex items-center justify-center gap-3 mb-2">
                {props.icon && (
                    <span class="text-3xl">{props.icon}</span>
                )}
                <div class={`text-4xl font-bold ${colors.text}`}>
                    {typeof props.value === "number" ? props.value.toLocaleString() : props.value}
                </div>
            </div>
            <div class={`text-sm font-semibold ${colors.label}`}>
                {props.label}
            </div>
        </div>
    );
}