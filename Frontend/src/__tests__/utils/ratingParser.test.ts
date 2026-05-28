import { describe, expect, it } from "vitest";
import { buildRatingFile, parseRatingFile } from "../../utils/ratingParser";

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
        view.setInt32(base, e.profileId, false);
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
