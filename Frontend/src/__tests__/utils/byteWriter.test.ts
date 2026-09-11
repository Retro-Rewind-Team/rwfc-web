import { describe, expect, it } from "vitest";
import { ByteWriter } from "../../utils/byteWriter";

/**
 * Shared by the Yaz0 and U8 writers, which both used to accumulate into a number[]. Growth and
 * orAt are the parts a round-trip test would not pin down on its own.
 */
describe("ByteWriter", () => {
    it("returns exactly the bytes written, not its whole capacity", () => {
        const writer = new ByteWriter(1024);
        writer.push(1, 2, 3);

        expect(Array.from(writer.toUint8Array())).toEqual([1, 2, 3]);
        expect(writer.length).toBe(3);
    });

    it("grows past its initial capacity without losing earlier bytes", () => {
        const writer = new ByteWriter(2);
        for (let i = 0; i < 100; i++) writer.pushByte(i);

        const out = writer.toUint8Array();
        expect(out.length).toBe(100);
        expect(out[0]).toBe(0);
        expect(out[99]).toBe(99);
    });

    it("grows correctly when a single push spans the boundary", () => {
        const writer = new ByteWriter(4);
        writer.push(1, 2, 3);
        writer.push(4, 5, 6, 7, 8);

        expect(Array.from(writer.toUint8Array())).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it("copies a slice of a source array", () => {
        const writer = new ByteWriter(2);
        writer.pushFrom(new Uint8Array([9, 8, 7, 6, 5]), 1, 3);

        expect(Array.from(writer.toUint8Array())).toEqual([8, 7, 6]);
    });

    it("appends repeated padding", () => {
        const writer = new ByteWriter(1);
        writer.pushByte(0xff);
        writer.pushRepeat(0x00, 5);

        expect(Array.from(writer.toUint8Array())).toEqual([0xff, 0, 0, 0, 0, 0]);
    });

    it("ORs bits into a byte written earlier", () => {
        // How the Yaz0 writers fill in a control byte after emitting the group it describes.
        const writer = new ByteWriter(8);
        const control = writer.length;
        writer.pushByte(0x00);
        writer.push(0x41, 0x42);
        writer.orAt(control, 0x80);
        writer.orAt(control, 0x40);

        expect(Array.from(writer.toUint8Array())).toEqual([0xc0, 0x41, 0x42]);
    });

    it("refuses an orAt outside what has been written", () => {
        const writer = new ByteWriter(8);
        writer.pushByte(1);

        expect(() => writer.orAt(1, 0xff)).toThrow(RangeError);
        expect(() => writer.orAt(-1, 0xff)).toThrow(RangeError);
    });

    it("starts empty", () => {
        expect(new ByteWriter().toUint8Array().length).toBe(0);
    });
});
