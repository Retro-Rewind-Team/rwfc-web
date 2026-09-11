import { fireEvent, render, screen } from "@solidjs/testing-library";
import { JSX } from "solid-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Tooltip from "../../components/common/Tooltip";

/**
 * The tooltip carried six separate defects: a drag-scroll opened it, its position was snapshotted
 * once and never revisited, it could render off screen, it was unreachable by keyboard, its scroll
 * listener missed nested containers, and a mouse click could not dismiss one opened by touch.
 */
describe("Tooltip", () => {
    const TEXT = "Flagged for suspicious VR activity";

    const tip = () => screen.queryByRole("tooltip");
    const trigger = () => screen.getByTestId("trigger").parentElement!;

    const renderTooltip = (children?: () => JSX.Element) =>
        render(() => (
            <Tooltip text={TEXT}>
                {children ? children() : <span data-testid="trigger">badge</span>}
            </Tooltip>
        ));

    const touch = (x: number, y: number) => ({ clientX: x, clientY: y });

    beforeEach(() => {
        vi.stubGlobal("innerWidth", 1024);
    });

    it("shows on mouse enter and hides on leave", () => {
        renderTooltip();

        fireEvent.mouseEnter(trigger());
        expect(tip()).toHaveTextContent(TEXT);

        fireEvent.mouseLeave(trigger());
        expect(tip()).toBeNull();
    });

    it("opens on a tap", () => {
        renderTooltip();
        const el = trigger();

        fireEvent.touchStart(el, { touches: [touch(100, 100)] });
        fireEvent.touchEnd(el, { touches: [] });

        expect(tip()).toHaveTextContent(TEXT);
    });

    it("does not open when the finger moved, so scrolling past it stays quiet", () => {
        renderTooltip();
        const el = trigger();

        fireEvent.touchStart(el, { touches: [touch(100, 100)] });
        fireEvent.touchMove(el, { touches: [touch(100, 160)] });
        fireEvent.touchEnd(el, { touches: [] });

        expect(tip()).toBeNull();
    });

    it("still opens when the finger wobbled within the tap threshold", () => {
        renderTooltip();
        const el = trigger();

        fireEvent.touchStart(el, { touches: [touch(100, 100)] });
        fireEvent.touchMove(el, { touches: [touch(103, 102)] });
        fireEvent.touchEnd(el, { touches: [] });

        expect(tip()).toHaveTextContent(TEXT);
    });

    it("opens on focus and closes on blur, so it is reachable by keyboard", () => {
        renderTooltip();
        const el = trigger();

        fireEvent.focusIn(el);
        expect(tip()).toHaveTextContent(TEXT);

        fireEvent.focusOut(el);
        expect(tip()).toBeNull();
    });

    it("closes on Escape", () => {
        renderTooltip();

        fireEvent.mouseEnter(trigger());
        expect(tip()).not.toBeNull();

        fireEvent.keyDown(document, { key: "Escape" });
        expect(tip()).toBeNull();
    });

    it("takes a tab stop when its content cannot receive focus", () => {
        renderTooltip();

        expect(trigger()).toHaveAttribute("tabindex", "0");
    });

    it("does not take a tab stop when it wraps something already focusable", () => {
        // Otherwise one button becomes two stops in the tab order.
        renderTooltip(() => (
            <button type="button" data-testid="trigger">
                Jump to latest
            </button>
        ));

        expect(trigger()).not.toHaveAttribute("tabindex");
    });

    it("is dismissed by a pointer press elsewhere, including a mouse on a hybrid device", () => {
        renderTooltip();

        fireEvent.mouseEnter(trigger());
        expect(tip()).not.toBeNull();

        fireEvent.pointerDown(document.body);
        expect(tip()).toBeNull();
    });

    it("survives a pointer press on itself", () => {
        renderTooltip();
        const el = trigger();

        fireEvent.mouseEnter(el);
        fireEvent.pointerDown(screen.getByTestId("trigger"));

        expect(tip()).not.toBeNull();
    });

    it("is dismissed by a scroll inside a nested container, not just the page", () => {
        // Scroll events do not bubble to window, so this only works with a capture listener.
        const { container } = renderTooltip();
        fireEvent.mouseEnter(trigger());
        expect(tip()).not.toBeNull();

        fireEvent.scroll(container);
        expect(tip()).toBeNull();
    });

    it("marks the trigger as described by the tooltip only while it is open", () => {
        renderTooltip();
        const el = trigger();

        expect(el).not.toHaveAttribute("aria-describedby");

        fireEvent.mouseEnter(el);
        expect(el.getAttribute("aria-describedby")).toBe(tip()!.id);

        fireEvent.mouseLeave(el);
        expect(el).not.toHaveAttribute("aria-describedby");
    });
});
