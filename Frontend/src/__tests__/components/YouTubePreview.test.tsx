import { fireEvent, render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import YouTubePreview, { youtubeId } from "../../components/common/YouTubePreview";

describe("youtubeId", () => {
    it.each([
        ["https://www.youtube.com/watch?v=8AHuddFN2wk", "8AHuddFN2wk"],
        ["https://youtu.be/iuczt1o2kEo?si=pEEvZNiYbxF8tWp0", "iuczt1o2kEo"],
        ["https://gist.github.com/weirdrock/92bcb0dbd4a2c3d56844bf0a5fe18677", null],
        ["not a url", null],
    ])("reads %s as %s", (url, expected) => {
        expect(youtubeId(url)).toBe(expected);
    });
});

describe("YouTubePreview", () => {
    it("loads no player until play is pressed, then embeds the privacy-enhanced player", () => {
        const { container } = render(() => (
            <YouTubePreview url="https://www.youtube.com/watch?v=8AHuddFN2wk" title="Wii guide" />
        ));
        // Before: only YouTube's thumbnail, no iframe (no YouTube scripts or cookies).
        expect(container.querySelector("iframe")).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Play video: Wii guide" }));

        const frame = container.querySelector("iframe");
        expect(frame?.getAttribute("src")).toContain("youtube-nocookie.com/embed/8AHuddFN2wk");
        expect(frame).toHaveAttribute("title", "YouTube video: Wii guide");
    });
});
