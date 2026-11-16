import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import CountUp from "../../components/common/CountUp";
import { reveal } from "../../utils/motion";

describe("CountUp", () => {
    it("shows the final value when it cannot animate", () => {
        // jsdom has no IntersectionObserver, the same path as a browser without one: the number
        // must simply be there, never stuck at zero.
        render(() => <CountUp value={1234} />);
        expect(screen.getAllByText("1,234")).toHaveLength(2);
    });
});

describe("reveal", () => {
    it("caps the stagger so long lists never lag", () => {
        expect(reveal(2).style["--reveal-index"]).toBe("2");
        expect(reveal(40).style["--reveal-index"]).toBe("6");
    });
});
