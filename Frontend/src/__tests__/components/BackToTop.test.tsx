import { fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import BackToTop from "../../components/layout/BackToTop";

/** Runs the button's rAF-throttled scroll handler synchronously. */
function scrollTo(y: number) {
    Object.defineProperty(window, "scrollY", { value: y, configurable: true });
    window.dispatchEvent(new Event("scroll"));
}

describe("BackToTop", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        scrollTo(0);
    });

    it("is hidden and out of the tab order at the top of the page", () => {
        const { container } = render(() => <BackToTop />);
        // While hidden it has no accessible name (aria-hidden), so find it by its title instead.
        const button = container.querySelector('button[title="Back to top"]');
        expect(screen.queryByRole("button", { name: "Back to top" })).toBeNull();
        expect(button).toHaveAttribute("aria-hidden", "true");
        expect(button).toHaveAttribute("tabindex", "-1");
    });

    it("appears after scrolling down, then scrolls to the top and moves focus to the content", () => {
        vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
            cb(0);
            return 0;
        });
        const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
        const main = document.createElement("main");
        main.id = "main-content";
        main.tabIndex = -1;
        document.body.appendChild(main);

        render(() => <BackToTop />);
        scrollTo(window.innerHeight * 2);

        const button = screen.getByRole("button", { name: "Back to top" });
        expect(button).toHaveAttribute("tabindex", "0");

        fireEvent.click(button);
        expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
        expect(document.activeElement).toBe(main);
        main.remove();
    });
});
