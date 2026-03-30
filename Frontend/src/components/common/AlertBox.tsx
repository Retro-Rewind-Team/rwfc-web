import { JSX, Show } from "solid-js";
import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-solid";

interface AlertBoxProps {
  type: "info" | "warning" | "success" | "error";
  icon?: JSX.Element;
  title?: string;
  children: JSX.Element;
}

const defaultIcons = {
    info: () => <Info size={20} />,
    warning: () => <TriangleAlert size={20} />,
    success: () => <CircleCheck size={20} />,
    error: () => <CircleX size={20} />,
};

const colorClasses = {
    info: {
        bg: "bg-blue-50 dark:bg-blue-950/30",
        border: "border-blue-500",
        icon: "text-blue-500 dark:text-blue-400",
        titleText: "text-blue-900 dark:text-blue-100",
        bodyText: "text-blue-800 dark:text-blue-200",
    },
    warning: {
        bg: "bg-yellow-50 dark:bg-yellow-950/30",
        border: "border-yellow-500",
        icon: "text-yellow-500 dark:text-yellow-400",
        titleText: "text-yellow-900 dark:text-yellow-100",
        bodyText: "text-yellow-800 dark:text-yellow-200",
    },
    success: {
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        border: "border-emerald-500",
        icon: "text-emerald-500 dark:text-emerald-400",
        titleText: "text-emerald-900 dark:text-emerald-100",
        bodyText: "text-emerald-800 dark:text-emerald-200",
    },
    error: {
        bg: "bg-red-50 dark:bg-red-950/30",
        border: "border-red-500",
        icon: "text-red-500 dark:text-red-400",
        titleText: "text-red-900 dark:text-red-100",
        bodyText: "text-red-800 dark:text-red-200",
    },
};

export default function AlertBox(props: AlertBoxProps) {
    const colors = colorClasses[props.type];
    const icon = () => props.icon ?? defaultIcons[props.type]();

    return (
        <div class={`${colors.bg} border-l-4 ${colors.border} rounded-r-lg p-6`}>
            <div class="flex items-start space-x-3">
                <div class={`shrink-0 mt-0.5 ${colors.icon}`}>{icon()}</div>
                <div class="flex-1">
                    <Show when={props.title}>
                        <h3 class={`text-lg font-semibold ${colors.titleText} mb-2`}>
                            {props.title}
                        </h3>
                    </Show>
                    <div class={colors.bodyText}>{props.children}</div>
                </div>
            </div>
        </div>
    );
}
