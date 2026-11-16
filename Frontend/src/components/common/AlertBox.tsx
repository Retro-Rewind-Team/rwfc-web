import { JSX, Show } from "solid-js";
import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-solid";

interface AlertBoxProps {
    type: "info" | "warning" | "success" | "error";
    icon?: JSX.Element;
    title?: string;
    children: JSX.Element;
}

const defaultIcons = {
    info: () => <Info size={18} />,
    warning: () => <TriangleAlert size={18} />,
    success: () => <CircleCheck size={18} />,
    error: () => <CircleX size={18} />,
};

/*
 * Callouts stay neutral so they do not compete with the accent. Only warnings and errors get a
 * tinted treatment, because those are the ones people must not skim past. Errors use the warning
 * colours too: the palette deliberately has no red, and the icon and title carry the meaning.
 */
const tones = {
    info: { box: "border-line bg-surface", icon: "text-fg-subtle" },
    success: { box: "border-line bg-surface", icon: "text-accent-text" },
    warning: { box: "border-warn-line bg-warn-bg", icon: "text-warn-fg" },
    error: { box: "border-warn-line bg-warn-bg", icon: "text-warn-fg" },
};

export default function AlertBox(props: AlertBoxProps) {
    const tone = () => tones[props.type];
    const icon = () => props.icon ?? defaultIcons[props.type]();

    return (
        <div
            class={`rounded-lg border p-4 sm:p-5 ${tone().box}`}
            role={props.type === "error" ? "alert" : undefined}
        >
            <div class="flex items-start gap-3">
                <div class={`mt-0.5 shrink-0 ${tone().icon}`} aria-hidden="true">
                    {icon()}
                </div>
                <div class="min-w-0 flex-1 text-sm text-fg-muted">
                    <Show when={props.title}>
                        <p class="type-heading mb-1 text-fg">{props.title}</p>
                    </Show>
                    <div>{props.children}</div>
                </div>
            </div>
        </div>
    );
}
