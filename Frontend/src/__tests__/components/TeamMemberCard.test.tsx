import { fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import TeamMemberCard from "../../components/ui/team/TeamMemberCard";
import { TeamMember } from "../../types/team";

const member = new TeamMember({
    name: "yauvi",
    discord: "yauvi",
    image: "/profiles/yauvi.webp",
    animatedImage: "/profiles/yauvi.anim.webp",
});

function mockReducedMotion(reduce: boolean) {
    vi.stubGlobal(
        "matchMedia",
        vi.fn().mockImplementation((query: string) => ({
            matches: reduce && query.includes("reduce"),
            media: query,
        })),
    );
}

function renderCard() {
    const { container } = render(() => (
        <TeamMemberCard member={member} roleColor={undefined} onCopy={() => {}} />
    ));
    // The hover handlers sit on the card's root; mouseenter does not bubble, so fire it there.
    return { img: screen.getByRole("img", { name: "yauvi" }), card: container.firstElementChild! };
}

describe("TeamMemberCard", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("shows the still avatar, sized and lazy, so the animation is not downloaded up front", () => {
        mockReducedMotion(false);
        const { img } = renderCard();
        expect(img).toHaveAttribute("src", "/profiles/yauvi.webp");
        expect(img).toHaveAttribute("loading", "lazy");
        expect(img).toHaveAttribute("width", "96");
        expect(img).toHaveAttribute("height", "96");
    });

    it("plays the animation on hover and stops on leave", () => {
        mockReducedMotion(false);
        const { img, card } = renderCard();
        fireEvent.mouseEnter(card);
        expect(img).toHaveAttribute("src", "/profiles/yauvi.anim.webp");
        fireEvent.mouseLeave(card);
        expect(img).toHaveAttribute("src", "/profiles/yauvi.webp");
    });

    it("plays the animation when a control in the card gets keyboard focus", () => {
        mockReducedMotion(false);
        const { img } = renderCard();
        fireEvent.focusIn(screen.getByTitle("Click to copy Discord username"));
        expect(img).toHaveAttribute("src", "/profiles/yauvi.anim.webp");
    });

    it("never animates under reduced motion", () => {
        mockReducedMotion(true);
        const { img, card } = renderCard();
        fireEvent.mouseEnter(card);
        expect(img).toHaveAttribute("src", "/profiles/yauvi.webp");
    });
});
