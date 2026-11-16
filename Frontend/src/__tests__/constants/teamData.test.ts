import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { teamData } from "../../constants/teamData";

const publicDir = path.resolve(__dirname, "../../../public");
const members = Object.values(teamData).flat();

/*
 * The Team page shows every avatar in a 96px circle. Before these limits, full-size uploads
 * (one a 31 MB GIF) made the page download about 40 MB. Resize new pictures to 192px WebP.
 */
const MAX_AVATAR_BYTES = 40 * 1024;
const MAX_ANIMATED_BYTES = 1.5 * 1024 * 1024;

describe("teamData avatars", () => {
    it("points every avatar at a file that exists", () => {
        for (const member of members) {
            for (const src of [member.image, member.animatedImage]) {
                if (src) expect(existsSync(path.join(publicDir, src)), src).toBe(true);
            }
        }
    });

    it("keeps still avatars small enough for a 96px circle", () => {
        for (const member of members.filter((m) => m.image)) {
            const size = statSync(path.join(publicDir, member.image!)).size;
            expect(size, member.image).toBeLessThanOrEqual(MAX_AVATAR_BYTES);
        }
    });

    it("keeps animated avatars, which load only on hover, within a cap", () => {
        for (const member of members.filter((m) => m.animatedImage)) {
            const size = statSync(path.join(publicDir, member.animatedImage!)).size;
            expect(size, member.animatedImage).toBeLessThanOrEqual(MAX_ANIMATED_BYTES);
        }
    });
});
