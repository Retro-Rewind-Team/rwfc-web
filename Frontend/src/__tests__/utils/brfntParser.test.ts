import { describe, expect, it } from "vitest";
import { brfntHasGlyph } from "../../utils/brfntParser";

/**
 * BRFNT is the Wii font format inside Font.szs. After a 16-byte "RFNT" header come size-prefixed
 * blocks; CMAP blocks map character codes to glyphs using one of three layouts:
 *   0: a contiguous code range starting at one glyph index
 *   1: a table with one glyph index per code, 0xFFFF meaning "no glyph"
 *   2: a list of code/index pairs
 * Retro Rewind's rank icons are U+F07D..U+F085, and the font patcher checks a font has them.
 */
type CodeMap =
    | { method: 0; begin: number; end: number; firstGlyph: number }
    | { method: 1; begin: number; end: number; glyphs: number[] }
    | { method: 2; pairs: [number, number][] };

function block(magic: string, body: Uint8Array): Uint8Array {
    const size = (8 + body.length + 3) & ~3;
    const out = new Uint8Array(size);
    for (let i = 0; i < 4; i++) out[i] = magic.charCodeAt(i);
    new DataView(out.buffer).setUint32(4, size, false);
    out.set(body, 8);
    return out;
}

function buildBrfnt(maps: CodeMap[]): Uint8Array {
    // A non-CMAP block first, so the reader has to step over it by its size field.
    const blocks = [block("FINF", new Uint8Array(0x18))];

    for (const map of maps) {
        let begin: number;
        let end: number;
        let info: number[];
        if (map.method === 0) {
            [begin, end, info] = [map.begin, map.end, [map.firstGlyph]];
        } else if (map.method === 1) {
            [begin, end, info] = [map.begin, map.end, map.glyphs];
        } else {
            const codes = map.pairs.map(([code]) => code);
            [begin, end] = [Math.min(...codes), Math.max(...codes)];
            info = [map.pairs.length, ...map.pairs.flat()];
        }

        const body = new Uint8Array(12 + info.length * 2);
        const dv = new DataView(body.buffer);
        dv.setUint16(0, begin, false);
        dv.setUint16(2, end, false);
        dv.setUint16(4, map.method, false);
        info.forEach((value, i) => dv.setUint16(12 + i * 2, value, false));
        blocks.push(block("CMAP", body));
    }

    const total = 0x10 + blocks.reduce((sum, b) => sum + b.length, 0);
    const out = new Uint8Array(total);
    const dv = new DataView(out.buffer);
    out.set([0x52, 0x46, 0x4e, 0x54], 0);
    dv.setUint16(4, 0xfeff, false);
    dv.setUint16(6, 0x0104, false);
    dv.setUint32(8, total, false);
    dv.setUint16(12, 0x10, false);
    dv.setUint16(14, blocks.length, false);
    let offset = 0x10;
    for (const b of blocks) {
        out.set(b, offset);
        offset += b.length;
    }
    return out;
}

const ASCII = { method: 0, begin: 0x20, end: 0x7e, firstGlyph: 0 } as const;

describe("brfntHasGlyph", () => {
    it("finds a code inside a contiguous range", () => {
        expect(brfntHasGlyph(buildBrfnt([ASCII]), 0x41)).toBe(true);
    });

    it("does not find a code outside every range", () => {
        expect(brfntHasGlyph(buildBrfnt([ASCII]), 0xf07d)).toBe(false);
    });

    it("finds a code in a pair list that follows another code map", () => {
        const font = buildBrfnt([
            ASCII,
            {
                method: 2,
                pairs: [
                    [0xf07d, 40],
                    [0xf085, 48],
                ],
            },
        ]);

        expect(brfntHasGlyph(font, 0xf085)).toBe(true);
    });

    it("does not find a code absent from a pair list whose range covers it", () => {
        const font = buildBrfnt([
            {
                method: 2,
                pairs: [
                    [0xf07d, 40],
                    [0xf085, 48],
                ],
            },
        ]);

        expect(brfntHasGlyph(font, 0xf080)).toBe(false);
    });

    it("treats 0xFFFF in a table as no glyph", () => {
        const font = buildBrfnt([
            { method: 1, begin: 0xf07d, end: 0xf07f, glyphs: [40, 0xffff, 42] },
        ]);

        expect(brfntHasGlyph(font, 0xf07e)).toBe(false);
        expect(brfntHasGlyph(font, 0xf07f)).toBe(true);
    });

    it("returns false for bytes that are not a font", () => {
        expect(brfntHasGlyph(new Uint8Array(64), 0x41)).toBe(false);
    });

    it("returns false instead of looping when a block claims a size of zero", () => {
        const font = buildBrfnt([ASCII]);
        new DataView(font.buffer).setUint32(0x10 + 4, 0, false);

        expect(brfntHasGlyph(font, 0x41)).toBe(false);
    });
});
