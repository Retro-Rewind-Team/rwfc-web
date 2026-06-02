import { createEffect, createSignal, JSX, onCleanup, Show } from "solid-js";
import { Portal } from "solid-js/web";

interface TooltipProps {
    text: string;
    children: JSX.Element;
    class?: string;
}

let tooltipCounter = 0;

export default function Tooltip(props: TooltipProps) {
    const [visible, setVisible] = createSignal(false);
    const [triggerRect, setTriggerRect] = createSignal<DOMRect | null>(null);
    // eslint-disable-next-line prefer-const
    let ref: HTMLSpanElement = undefined!;
    const tooltipId = `tooltip-${++tooltipCounter}`;

    const show = () => {
        setTriggerRect(ref.getBoundingClientRect());
        setVisible(true);
    };
    const hide = () => setVisible(false);
    const toggle = (e: TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (visible()) {
            hide();
        } else {
            show();
        }
    };

    createEffect(() => {
        if (!visible()) return;
        const onOutsideTouch = (e: TouchEvent) => {
            if (!ref.contains(e.target as Node)) hide();
        };
        document.addEventListener("touchstart", onOutsideTouch);
        onCleanup(() => document.removeEventListener("touchstart", onOutsideTouch));
    });

    createEffect(() => {
        if (!visible()) return;
        window.addEventListener("scroll", hide, { passive: true });
        onCleanup(() => window.removeEventListener("scroll", hide));
    });

    return (
        <span
            ref={ref}
            class={`inline-flex${props.class ? ` ${props.class}` : ""}`}
            aria-describedby={visible() ? tooltipId : undefined}
            onMouseEnter={show}
            onMouseLeave={hide}
            onTouchEnd={toggle}
        >
            {props.children}
            <Show when={visible() && triggerRect()}>
                <Portal>
                    <div
                        class="fixed z-[9999] pointer-events-none"
                        style={{
                            left: `${triggerRect()!.left + triggerRect()!.width / 2}px`,
                            top: `${triggerRect()!.top - 8}px`,
                            transform: "translate(-50%, -100%)",
                        }}
                    >
                        <div
                            id={tooltipId}
                            role="tooltip"
                            class="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap"
                        >
                            {props.text}
                        </div>
                    </div>
                </Portal>
            </Show>
        </span>
    );
}
