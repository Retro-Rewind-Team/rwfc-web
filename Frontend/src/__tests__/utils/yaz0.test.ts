import { describe, expect, it } from "vitest";
import { yaz0Compress, yaz0CompressLiteralOnly, yaz0Decompress } from "../../utils/yaz0";

/**
 * Yaz0 is what the font patcher runs over a user's .szs before writing it back, so a defect here
 * corrupts a real file on their SD card. Round-tripping is the property that matters: whatever the
 * compressor emits, the decompressor must return the original bytes exactly.
 */
describe("yaz0", () => {
    const roundTrips = (name: string, bytes: Uint8Array) => {
        it(`round-trips ${name}`, () => {
            expect(yaz0Decompress(yaz0Compress(bytes))).toEqual(bytes);
        });

        it(`round-trips ${name} with the literal-only encoder`, () => {
            expect(yaz0Decompress(yaz0CompressLiteralOnly(bytes))).toEqual(bytes);
        });
    };

    roundTrips("an empty buffer", new Uint8Array(0));
    roundTrips("a single byte", new Uint8Array([0x42]));

    // No repeats, so nothing can be back-referenced.
    roundTrips("incompressible data", Uint8Array.from({ length: 256 }, (_, i) => i));

    // Long runs are the case back-references exist for.
    roundTrips("a long run of one value", new Uint8Array(1000).fill(0xab));

    roundTrips(
        "repeating structure",
        Uint8Array.from({ length: 2048 }, (_, i) => i % 8),
    );

    roundTrips(
        "a mix of runs and noise",
        Uint8Array.from({ length: 4096 }, (_, i) => (i % 64 < 32 ? 0xff : (i * 7) % 251)),
    );

    it("writes the Yaz0 magic and the uncompressed size into the header", () => {
        const original = new Uint8Array(300).fill(1);

        const compressed = yaz0Compress(original);

        expect(Array.from(compressed.slice(0, 4))).toEqual([0x59, 0x61, 0x7a, 0x30]);
        const view = new DataView(compressed.buffer, compressed.byteOffset, compressed.byteLength);
        expect(view.getUint32(4, false)).toBe(original.length);
    });

    it("compresses a highly repetitive buffer to well under its original size", () => {
        const original = new Uint8Array(8192).fill(0x5a);

        // Not an exact figure -- just that back-references are being emitted at all rather than
        // every byte going out as a literal.
        expect(yaz0Compress(original).length).toBeLessThan(original.length / 4);
    });

    it("rejects input without the Yaz0 magic", () => {
        expect(() => yaz0Decompress(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]))).toThrow(/Yaz0/);
    });

    it("returns a plain Uint8Array, not a subarray view onto a larger buffer", () => {
        const decompressed = yaz0Decompress(yaz0Compress(new Uint8Array(64).fill(9)));

        expect(decompressed.byteOffset).toBe(0);
        expect(decompressed.buffer.byteLength).toBe(decompressed.length);
    });
});
