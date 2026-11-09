import { createEffect, createSignal, on, onCleanup, onMount } from "solid-js";
import { prefersReducedMotion } from "../../utils/motion";

interface CountUpProps {
    value: number;
    class?: string;
}

const DURATION_MS = 500; // --motion-slow

/*
 * Counts from zero to the value once, when the number first scrolls into view.
 * - Screen readers get the final value straight away; the moving digits are aria-hidden.
 * - The box is sized to the final value with tabular figures, so nothing shifts while counting.
 * - It is not right-aligned: ch is wider than a comma, so that would indent the final number.
 * - Reduced motion, no IntersectionObserver, or a value that changes later: show it as-is.
 */
export default function CountUp(props: CountUpProps) {
    const [shown, setShown] = createSignal(props.value);
    let el: HTMLSpanElement | undefined;
    let frame = 0;
    let animating = false;

    // A new value after the count has run (a refetch, say) is shown directly, never re-counted.
    createEffect(
        on(
            () => props.value,
            (value) => {
                if (!animating) setShown(value);
            },
            { defer: true },
        ),
    );

    onMount(() => {
        if (prefersReducedMotion() || typeof IntersectionObserver === "undefined" || !el) return;

        const target = props.value;
        animating = true;
        setShown(0);
        const io = new IntersectionObserver((entries) => {
            if (!entries.some((e) => e.isIntersecting)) return;
            io.disconnect();
            const start = performance.now();
            const tick = (now: number) => {
                const t = Math.min((now - start) / DURATION_MS, 1);
                // Ease-out cubic: fast start, gentle landing on the real number.
                setShown(Math.round(target * (1 - Math.pow(1 - t, 3))));
                if (t < 1) frame = requestAnimationFrame(tick);
                else {
                    animating = false;
                    setShown(props.value);
                }
            };
            frame = requestAnimationFrame(tick);
        });
        io.observe(el);
        onCleanup(() => {
            io.disconnect();
            cancelAnimationFrame(frame);
        });
    });

    const finalText = () => props.value.toLocaleString();

    return (
        <span
            ref={(node) => (el = node)}
            class={`inline-block tabular-nums ${props.class ?? ""}`}
            style={{ "min-width": `${finalText().length}ch` }}
        >
            <span aria-hidden="true">{shown().toLocaleString()}</span>
            <span class="sr-only">{finalText()}</span>
        </span>
    );
}
