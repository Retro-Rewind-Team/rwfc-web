/*
 * Shared motion helpers. The visual side (durations, easing, keyframes) lives in index.css; this
 * file only decides when things start. Everything degrades to "content is simply there": no
 * IntersectionObserver, reduced motion, or a JS error all leave content visible.
 */

/** Longest stagger in a group. Past this, items arrive together so long lists never lag. */
const MAX_STAGGER_INDEX = 6;

export function prefersReducedMotion(): boolean {
    return (
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

/**
 * Attributes for an element that should fade and rise into view once. Spread onto the element:
 * `<div {...reveal(i)}>`. The index staggers items within a group.
 */
export function reveal(index = 0) {
    return {
        "data-reveal": "",
        style: { "--reveal-index": String(Math.min(index, MAX_STAGGER_INDEX)) },
    };
}

/**
 * Style for one step of the hero's entrance sequence. Pair it with the "hero-enter" class; it is
 * a style only so it never overrides the element's own classes.
 */
export function enterOrder(index: number) {
    return { "--enter-index": String(index) };
}

let started = false;

/**
 * Starts one observer for the whole app. It watches every [data-reveal] element, including ones
 * added later by route changes or loaded data, and marks each revealed the first time it is seen.
 * Call once from the layout.
 */
export function startScrollReveals(): () => void {
    if (started || prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
        return () => {};
    }
    started = true;

    const io = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-revealed");
                    io.unobserve(entry.target);
                }
            }
        },
        // Trigger a little before the element is fully in view so it never feels late.
        { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    const observeWithin = (root: ParentNode) => {
        root.querySelectorAll("[data-reveal]:not(.is-revealed)").forEach((el) => io.observe(el));
    };

    const mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
            m.addedNodes.forEach((node) => {
                if (!(node instanceof Element)) return;
                if (node.matches("[data-reveal]")) io.observe(node);
                observeWithin(node);
            });
        }
    });

    // Hiding starts only now that the observer exists, so content can never get stuck hidden.
    document.documentElement.classList.add("reveal-ready");
    observeWithin(document);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
        io.disconnect();
        mo.disconnect();
        document.documentElement.classList.remove("reveal-ready");
        started = false;
    };
}
