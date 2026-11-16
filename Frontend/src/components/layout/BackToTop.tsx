import { createSignal, onCleanup } from "solid-js";
import { ArrowUp } from "lucide-solid";
import { prefersReducedMotion } from "../../utils/motion";

/*
 * A "back to top" button for every page. It appears once the visitor has scrolled about one
 * screen down, and is fully removed from the tab order and the accessibility tree while hidden,
 * so keyboard users never land on an invisible control. It fades and rises with the shared
 * motion tokens (opacity and transform only).
 *
 * On click it scrolls to the top (smoothly, or instantly under reduced motion) and moves focus to
 * the start of the page content, so keyboard and screen reader users end up where they can see.
 */
export default function BackToTop() {
    const [visible, setVisible] = createSignal(false);
    let ticking = false;

    const update = () => {
        ticking = false;
        setVisible(window.scrollY > window.innerHeight * 0.9);
    };
    const onScroll = () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onCleanup(() => window.removeEventListener("scroll", onScroll));

    const backToTop = () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
        // preventScroll: the scroll above is already handling the movement.
        document.getElementById("main-content")?.focus({ preventScroll: true });
    };

    return (
        <button
            type="button"
            onClick={backToTop}
            aria-label="Back to top"
            title="Back to top"
            aria-hidden={!visible()}
            tabindex={visible() ? 0 : -1}
            class={`fixed right-4 bottom-4 z-30 inline-flex h-11 w-11 items-center justify-center rounded-md border border-line-strong bg-canvas text-fg transition-[opacity,transform,background-color] duration-(--motion-base) hover:bg-surface sm:right-6 sm:bottom-6 ${
                visible()
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-2 opacity-0"
            }`}
        >
            <ArrowUp size={18} aria-hidden="true" />
        </button>
    );
}
