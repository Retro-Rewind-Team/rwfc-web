import { describe, expect, it } from "vitest";
import {
    buildRatingFile,
    entriesInUse,
    findRatingEntry,
    parseRatingFile,
} from "../../utils/ratingParser";

/** Builds a valid RRRT buffer with the given entries. */
function makeBuffer(
    entries: { profileId: number; vr: number; br: number; flags: number }[],
    opts: { magic?: string; version?: number; countOverride?: number } = {},
): ArrayBuffer {
    const magic = opts.magic ?? "RRRT";
    const count = opts.countOverride ?? entries.length;
    const buf = new ArrayBuffer(8 + entries.length * 16);
    const view = new DataView(buf);
    view.setUint8(0, magic.charCodeAt(0));
    view.setUint8(1, magic.charCodeAt(1));
    view.setUint8(2, magic.charCodeAt(2));
    view.setUint8(3, magic.charCodeAt(3));
    view.setUint16(4, opts.version ?? 1, false);
    view.setUint16(6, count, false);
    entries.forEach((e, i) => {
        const base = 8 + i * 16;
        view.setUint32(base, e.profileId >>> 0, false);
        view.setFloat32(base + 4, e.vr, false);
        view.setFloat32(base + 8, e.br, false);
        view.setUint32(base + 12, e.flags, false);
    });
    return buf;
}

describe("parseRatingFile", () => {
    it("throws when the buffer is fewer than 8 bytes", () => {
        expect(() => parseRatingFile(new ArrayBuffer(4))).toThrow("File too small");
    });

    it("parses magic, version, and count from the header", () => {
        const buf = makeBuffer([{ profileId: 1, vr: 5000.0, br: 4500.0, flags: 0 }]);
        const result = parseRatingFile(buf);
        expect(result.magic).toBe("RRRT");
        expect(result.version).toBe(1);
        expect(result.count).toBe(1);
    });

    it("parses entry fields correctly", () => {
        const buf = makeBuffer([{ profileId: 42, vr: 6000.0, br: 3000.0, flags: 7 }]);
        const { entries } = parseRatingFile(buf);
        expect(entries).toHaveLength(1);
        expect(entries[0].profileId).toBe(42);
        expect(entries[0].vr).toBeCloseTo(6000.0, 1);
        expect(entries[0].br).toBeCloseTo(3000.0, 1);
        expect(entries[0].flags).toBe(7);
    });

    it("truncates entries when header count exceeds buffer capacity", () => {
        const buf = makeBuffer([{ profileId: 1, vr: 100, br: 100, flags: 0 }], {
            countOverride: 5,
        });
        const result = parseRatingFile(buf);
        expect(result.entries).toHaveLength(1);
    });

    it("clamps VR and BR values to [-10000, 10000]", () => {
        const buf = makeBuffer([{ profileId: 1, vr: 99999, br: -99999, flags: 0 }]);
        const { entries } = parseRatingFile(buf);
        expect(entries[0].vr).toBe(10000);
        expect(entries[0].br).toBe(-10000);
    });
});

describe("buildRatingFile", () => {
    it("writes the RRRT magic bytes", () => {
        const rating = { magic: "RRRT", version: 1, count: 0, entries: [] };
        const buf = buildRatingFile(rating);
        const view = new DataView(buf);
        expect(
            String.fromCharCode(
                view.getUint8(0),
                view.getUint8(1),
                view.getUint8(2),
                view.getUint8(3),
            ),
        ).toBe("RRRT");
    });

    it("writes count equal to the number of entries", () => {
        const entries = [
            { index: 0, profileId: 1, vr: 5000, br: 4000, flags: 0 },
            { index: 1, profileId: 2, vr: 6000, br: 3000, flags: 0 },
        ];
        const buf = buildRatingFile({ magic: "RRRT", version: 1, count: 2, entries });
        const view = new DataView(buf);
        expect(view.getUint16(6, false)).toBe(2);
    });
});

describe("round-trip: parseRatingFile → buildRatingFile → parseRatingFile", () => {
    it("produces byte-identical results", () => {
        const original = makeBuffer([
            { profileId: 100, vr: 7500.0, br: 5000.0, flags: 1 },
            { profileId: 200, vr: 3000.0, br: 2000.0, flags: 0 },
        ]);
        const parsed = parseRatingFile(original);
        const rebuilt = buildRatingFile(parsed);
        const parsedAgain = parseRatingFile(rebuilt);

        expect(parsedAgain.magic).toBe(parsed.magic);
        expect(parsedAgain.version).toBe(parsed.version);
        expect(parsedAgain.count).toBe(parsed.count);
        expect(parsedAgain.entries).toHaveLength(parsed.entries.length);
        parsedAgain.entries.forEach((e, i) => {
            expect(e.profileId).toBe(parsed.entries[i].profileId);
            expect(e.vr).toBeCloseTo(parsed.entries[i].vr, 1);
            expect(e.br).toBeCloseTo(parsed.entries[i].br, 1);
            expect(e.flags).toBe(parsed.entries[i].flags);
        });
    });
});

describe("profile IDs above the signed 32-bit range", () => {
    // Profile IDs are unsigned 32-bit. Read or written as signed, anything at or above 2^31 comes
    // back negative, and the editor treats profileId > 0 as "this slot holds a player".
    const LARGE_PID = 3_000_000_000;

    it("parses a profile ID above 2^31 as a positive number", () => {
        const buf = makeBuffer([{ profileId: LARGE_PID, vr: 5000.0, br: 4500.0, flags: 0 }]);

        const parsed = parseRatingFile(buf);

        expect(parsed.entries[0].profileId).toBe(LARGE_PID);
        expect(parsed.entries[0].profileId).toBeGreaterThan(0);
    });

    it("round-trips a profile ID above 2^31 unchanged", () => {
        const original = makeBuffer([
            { profileId: LARGE_PID, vr: 7500.0, br: 5000.0, flags: 1 },
            { profileId: 4_294_967_295, vr: 3000.0, br: 2000.0, flags: 0 },
        ]);

        const rebuilt = buildRatingFile(parseRatingFile(original));
        const parsedAgain = parseRatingFile(rebuilt);

        expect(parsedAgain.entries[0].profileId).toBe(LARGE_PID);
        expect(parsedAgain.entries[1].profileId).toBe(4_294_967_295);
    });
});

// RRRating.pul is not one row per license. RatingSave.cpp keeps a 100-slot table keyed by profile
// ID, puts a new profile in the first free slot, and only loads a slot whose flags have bit 0 set.
const EMPTY_SLOT = { profileId: 0, vr: 0, br: 0, flags: 0 };

describe("findRatingEntry", () => {
    it("finds a profile stored past the first four slots", () => {
        const others = [101, 102, 103, 104, 105, 106].map((profileId) => ({
            profileId,
            vr: 50,
            br: 50,
            flags: 1,
        }));
        const file = parseRatingFile(
            makeBuffer([...others, { profileId: 600_000_123, vr: 226.93, br: 50, flags: 1 }]),
        );

        expect(findRatingEntry(file, 600_000_123)?.index).toBe(6);
    });

    it("ignores a slot whose data flag is cleared, as the game does when loading", () => {
        const file = parseRatingFile(makeBuffer([{ profileId: 42, vr: 80, br: 50, flags: 0 }]));

        expect(findRatingEntry(file, 42)).toBeUndefined();
    });

    it("never matches profile ID 0, which marks an unused slot", () => {
        const file = parseRatingFile(makeBuffer([{ profileId: 0, vr: 80, br: 50, flags: 1 }]));

        expect(findRatingEntry(file, 0)).toBeUndefined();
    });
});

describe("entriesInUse", () => {
    it("lists every slot holding a profile, wherever it sits in the table", () => {
        const file = parseRatingFile(
            makeBuffer([
                { profileId: 11, vr: 50, br: 50, flags: 1 },
                EMPTY_SLOT,
                EMPTY_SLOT,
                EMPTY_SLOT,
                EMPTY_SLOT,
                { profileId: 55, vr: 60, br: 50, flags: 1 },
            ]),
        );

        expect(entriesInUse(file.entries).map((e) => e.index)).toEqual([0, 5]);
    });

    it("keeps a profile whose data flag is cleared, so the editor can switch it back on", () => {
        const file = parseRatingFile(makeBuffer([{ profileId: 77, vr: 50, br: 50, flags: 0 }]));

        expect(entriesInUse(file.entries).map((e) => e.index)).toEqual([0]);
    });
});
