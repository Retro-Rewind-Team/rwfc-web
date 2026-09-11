import { createEffect, createSignal, JSX, onCleanup, onMount, Show } from "solid-js";
import { Portal } from "solid-js/web";

interface TooltipProps {
    text: string;
    children: JSX.Element;
    class?: string;
}

let tooltipCounter = 0;

/** Gap between the trigger and the tooltip, and the minimum clearance from a viewport edge. */
const MARGIN = 8;

/** How far a finger may travel between touchstart and touchend and still count as a tap. */
const TAP_SLOP_PX = 10;

const FOCUSABLE_SELECTOR =
    'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])';

export default function Tooltip(props: TooltipProps) {
    const [visible, setVisible] = createSignal(false);
    const [position, setPosition] = createSignal<{
        left: number;
        top: number;
        below: boolean;
    } | null>(null);
    const [needsOwnFocus, setNeedsOwnFocus] = createSignal(false);

    // eslint-disable-next-line prefer-const
    let ref: HTMLSpanElement = undefined!;
    // eslint-disable-next-line prefer-const
    let tipRef: HTMLDivElement = undefined!;
    let touchStart: { x: number; y: number } | null = null;
    let touchMoved = false;

    const tooltipId = `tooltip-${++tooltipCounter}`;

    /**
     * Measures the trigger and the tooltip and keeps the tooltip on screen: clamped horizontally so
     * a trigger near an edge does not push it off, and flipped below the trigger when there is not
     * enough room above. Re-run on resize, because the position used to be snapshotted once when
     * the tooltip opened and never revisited.
     */
    const reposition = () => {
        if (!ref) return;

        const trigger = ref.getBoundingClientRect();
        const width = tipRef?.offsetWidth ?? 0;
        const height = tipRef?.offsetHeight ?? 0;

        let left = trigger.left + trigger.width / 2;
        if (width > 0) {
            const half = width / 2;
            const min = MARGIN + half;
            const max = window.innerWidth - MARGIN - half;
            // max < min means the tooltip is wider than the viewport; centring is the least bad
            // answer rather than clamping to a nonsensical range.
            left = max < min ? window.innerWidth / 2 : Math.min(Math.max(left, min), max);
        }

        const below = height > 0 && trigger.top - MARGIN - height < 0;

        setPosition({
            left,
            top: below ? trigger.bottom + MARGIN : trigger.top - MARGIN,
            below,
        });
    };

    const show = () => {
        setPosition(null);
        setVisible(true);
    };

    const hide = () => {
        setVisible(false);
        setPosition(null);
    };

    const onTouchStart = (e: TouchEvent) => {
        const touch = e.touches[0];
        touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
        touchMoved = false;
    };

    const onTouchMove = (e: TouchEvent) => {
        if (!touchStart) return;
        const touch = e.touches[0];
        if (!touch) return;

        if (
            Math.abs(touch.clientX - touchStart.x) > TAP_SLOP_PX ||
            Math.abs(touch.clientY - touchStart.y) > TAP_SLOP_PX
        ) {
            touchMoved = true;
        }
    };

    const onTouchEnd = (e: TouchEvent) => {
        // A drag-scroll ends with a touchend on whatever was under the finger, which used to open
        // a tooltip every time the user scrolled past one.
        if (touchMoved) {
            touchStart = null;
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        if (visible()) hide();
        else show();

        touchStart = null;
    };

    onMount(() => {
        // Only take a tab stop when the wrapped content cannot receive focus itself. Wrapping a
        // button and adding tabindex here would put two stops on one control.
        setNeedsOwnFocus(!ref.querySelector(FOCUSABLE_SELECTOR));
    });

    // Measure once the tooltip is in the DOM, then whenever the viewport changes size.
    createEffect(() => {
        if (!visible()) return;

        reposition();
        window.addEventListener("resize", reposition);
        onCleanup(() => window.removeEventListener("resize", reposition));
    });

    createEffect(() => {
        if (!visible()) return;

        // pointerdown rather than touchstart alone: on a hybrid device a tooltip opened by touch
        // was not dismissed by a mouse click anywhere else on the page.
        const onOutsidePointer = (e: Event) => {
            if (!ref.contains(e.target as Node)) hide();
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") hide();
        };

        document.addEventListener("pointerdown", onOutsidePointer);
        document.addEventListener("keydown", onKeyDown);
        onCleanup(() => {
            document.removeEventListener("pointerdown", onOutsidePointer);
            document.removeEventListener("keydown", onKeyDown);
        });
    });

    createEffect(() => {
        if (!visible()) return;

        // capture: true so a scroll inside any nested scrollable container dismisses it too. Scroll
        // events from an element do not bubble to window, so the previous listener only fired for
        // page-level scrolling.
        const options = { capture: true, passive: true } as const;
        window.addEventListener("scroll", hide, options);
        onCleanup(() => window.removeEventListener("scroll", hide, options));
    });

    return (
        <span
            ref={ref}
            class={`inline-flex${props.class ? ` ${props.class}` : ""}`}
            tabindex={needsOwnFocus() ? 0 : undefined}
            aria-describedby={visible() ? tooltipId : undefined}
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocusIn={show}
            onFocusOut={hide}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {props.children}
            <Show when={visible()}>
                <Portal>
                    <div
                        ref={tipRef}
                        class="fixed z-[9999] pointer-events-none"
                        style={{
                            left: `${position()?.left ?? 0}px`,
                            top: `${position()?.top ?? 0}px`,
                            transform: position()?.below
                                ? "translate(-50%, 0)"
                                : "translate(-50%, -100%)",
                            // Hidden until measured, so it is never painted at an unclamped spot.
                            opacity: position() ? 1 : 0,
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
