import { describe, expect, it } from "vitest";
import { parseRksys } from "../../utils/rksysParser";

const LIC_BASES = [0x08, 0x8cc8, 0x11988, 0x1a648];
const OFF = {
    MII_NAME: 0x14,
    VR: 0xb0,
    VS_WINS: 0x98,
    VS_LOSSES: 0x9c,
    FIRSTS: 0xdc,
    DIST: 0xc4,
    DIST1ST: 0xe0,
    DWC: 0x40,
    DWC_PROFILE_ID: 0x1c,
};
const REGION_ID_OFFSET = 0x26b0a;

/** Full-size save so every licence slot and the region byte are in range. */
const FILE_SIZE = 0x28000;

interface License {
    miiName?: string;
    profileId?: number;
    vrPoints?: number;
    vsWins?: number;
    vsLosses?: number;
    firsts?: number;
    dist?: number;
    dist1st?: number;
}

function buildRksys(licenses: (License | null)[], regionId = 0x2000): ArrayBuffer {
    const buffer = new ArrayBuffer(FILE_SIZE);
    const dv = new DataView(buffer);
    dv.setUint16(REGION_ID_OFFSET, regionId, false);

    licenses.forEach((license, index) => {
        if (!license) return;
        const base = LIC_BASES[index];

        // UTF-16 big-endian, up to 10 code units.
        const name = license.miiName ?? "";
        for (let i = 0; i < name.length && i < 10; i++) {
            dv.setUint16(base + OFF.MII_NAME + i * 2, name.charCodeAt(i), false);
        }

        dv.setUint32(base + OFF.DWC + OFF.DWC_PROFILE_ID, license.profileId ?? 0, false);
        dv.setUint16(base + OFF.VR, license.vrPoints ?? 0, false);
        dv.setInt32(base + OFF.VS_WINS, license.vsWins ?? 0, false);
        dv.setInt32(base + OFF.VS_LOSSES, license.vsLosses ?? 0, false);
        dv.setInt32(base + OFF.FIRSTS, license.firsts ?? 0, false);
        dv.setFloat32(base + OFF.DIST, license.dist ?? 0, false);
        dv.setFloat32(base + OFF.DIST1ST, license.dist1st ?? 0, false);
    });

    return buffer;
}

describe("parseRksys", () => {
    it("reads the region from the header", () => {
        expect(parseRksys(buildRksys([], 0x2000)).region).toBe("Europe");
        expect(parseRksys(buildRksys([], 0x1000)).region).toBe("Americas");
        expect(parseRksys(buildRksys([], 0x0000)).region).toBe("Japan");
    });

    it("labels an unrecognised region rather than failing", () => {
        expect(parseRksys(buildRksys([], 0x7000)).region).toContain("Unknown");
    });

    it("reads each licence slot independently", () => {
        const file = parseRksys(
            buildRksys([
                { miiName: "First", vrPoints: 5000, vsWins: 10 },
                null,
                { miiName: "Third", vrPoints: 9999, vsWins: 20 },
                null,
            ]),
        );

        expect(file.licenses[0]?.miiName).toBe("First");
        expect(file.licenses[0]?.vrPoints).toBe(5000);
        expect(file.licenses[2]?.miiName).toBe("Third");
        expect(file.licenses[2]?.vrPoints).toBe(9999);
    });

    it("reads a profile ID above the signed 32-bit range as positive", () => {
        // Profile IDs are unsigned. Read signed, anything at or above 2^31 comes back negative.
        const file = parseRksys(buildRksys([{ profileId: 3_000_000_000 }]));

        expect(file.licenses[0]?.profileId).toBe(3_000_000_000);
        expect(file.licenses[0]?.profileId).toBeGreaterThan(0);
    });

    it("keeps a surrogate pair intact in the Mii name", () => {
        // A name containing an emoji occupies two UTF-16 code units. Reading them one at a time is
        // only correct if the halves are reassembled into a single character on concatenation.
        const file = parseRksys(buildRksys([{ miiName: "a😀b" }]));

        expect(file.licenses[0]?.miiName).toBe("a😀b");
        expect([...(file.licenses[0]?.miiName ?? "")]).toHaveLength(3);
    });

    it("stops the Mii name at the first null terminator", () => {
        const buffer = buildRksys([{ miiName: "Noel" }]);
        // Overwrite the third character with a null; the name should truncate there.
        new DataView(buffer).setUint16(LIC_BASES[0] + OFF.MII_NAME + 4, 0, false);

        expect(parseRksys(buffer).licenses[0]?.miiName).toBe("No");
    });

    it("reads float distance fields", () => {
        // Needs an identity, or the slot is treated as unused (see the next test).
        const file = parseRksys(buildRksys([{ miiName: "Racer", dist: 1234.5, dist1st: 250.25 }]));

        expect(file.licenses[0]?.dist).toBeCloseTo(1234.5, 1);
        expect(file.licenses[0]?.dist1st).toBeCloseTo(250.25, 1);
    });

    it("treats a slot with no name and no profile ID as an empty save slot", () => {
        // Stats alone do not make a licence: an untouched slot is zeroed but still in range.
        const file = parseRksys(buildRksys([{ dist: 1234.5, vsWins: 5 }]));

        expect(file.licenses[0]).toBeNull();
    });

    it("keeps a slot that has a profile ID but no name", () => {
        const file = parseRksys(buildRksys([{ profileId: 12345 }]));

        expect(file.licenses[0]).not.toBeNull();
        expect(file.licenses[0]?.profileId).toBe(12345);
    });

    it("returns nulls rather than throwing when the buffer is too small for a licence", () => {
        // A truncated save: only the first licence is in range.
        const truncated = new ArrayBuffer(0x200);

        const file = parseRksys(truncated);

        expect(file.licenses).toHaveLength(4);
        expect(file.licenses.slice(1).every((l) => l === null)).toBe(true);
    });

    it("does not throw on an empty buffer", () => {
        expect(() => parseRksys(new ArrayBuffer(0))).not.toThrow();
    });
});
