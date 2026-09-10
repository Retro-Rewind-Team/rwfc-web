import { describe, expect, it } from "vitest";
import { parseU8, replaceBrfntInU8 } from "../../utils/u8Parser";

/**
 * U8 is the container inside a .szs. The font patcher rewrites one file in it and writes the
 * result back to a user's SD card, so a mistake in the node table corrupts a real save.
 *
 * Layout built below: a 32-byte header, a node table of 12-byte entries, a string table, then
 * file data. Node type 1 is a directory, whose dataOffset/size fields hold the first-child and
 * end indices rather than a real offset and length.
 */
const HEADER_SIZE = 0x20;
const NODE_SIZE = 12;
const TARGET = "tt_kart_extension_font.brfnt";

interface BuiltArchive {
    bytes: Uint8Array;
    plainData: Uint8Array;
    fontData: Uint8Array;
}

function buildArchive(plainData: Uint8Array, fontData: Uint8Array): BuiltArchive {
    const names = ["", "dir", "a.bin", TARGET];
    const nameOffsets: number[] = [];
    let stringTableSize = 0;
    for (const name of names) {
        nameOffsets.push(stringTableSize);
        stringTableSize += name.length + 1;
    }

    const nodeCount = names.length;
    const rootOffset = HEADER_SIZE;
    const stringBase = rootOffset + nodeCount * NODE_SIZE;

    const align = (value: number) => (value + 0x1f) & ~0x1f;
    const dataOffset = align(stringBase + stringTableSize);
    const plainOffset = dataOffset;
    const fontOffset = align(plainOffset + plainData.length);
    const total = fontOffset + fontData.length;

    const bytes = new Uint8Array(total);
    const dv = new DataView(bytes.buffer);

    bytes.set([0x55, 0xaa, 0x38, 0x2d], 0);
    dv.setUint32(4, rootOffset, false);
    dv.setUint32(8, nodeCount * NODE_SIZE + stringTableSize, false);
    dv.setUint32(12, dataOffset, false);

    const writeNode = (index: number, type: number, field1: number, field2: number) => {
        const off = rootOffset + index * NODE_SIZE;
        bytes[off] = type;
        const nameOffset = nameOffsets[index];
        bytes[off + 1] = (nameOffset >> 16) & 0xff;
        bytes[off + 2] = (nameOffset >> 8) & 0xff;
        bytes[off + 3] = nameOffset & 0xff;
        dv.setUint32(off + 4, field1, false);
        dv.setUint32(off + 8, field2, false);
    };

    // Root: size carries the total node count.
    writeNode(0, 1, 0, nodeCount);
    // Directory holding both files: children are indices 2 and 3.
    writeNode(1, 1, 2, nodeCount);
    writeNode(2, 0, plainOffset, plainData.length);
    writeNode(3, 0, fontOffset, fontData.length);

    names.forEach((name, i) => {
        for (let c = 0; c < name.length; c++) {
            bytes[stringBase + nameOffsets[i] + c] = name.charCodeAt(c);
        }
    });

    bytes.set(plainData, plainOffset);
    bytes.set(fontData, fontOffset);

    return { bytes, plainData, fontData };
}

const sample = () =>
    buildArchive(new Uint8Array([1, 2, 3, 4]), new Uint8Array([9, 9, 9, 9, 9, 9, 9, 9]));

describe("parseU8", () => {
    it("rejects a buffer without the U8 magic", () => {
        expect(() => parseU8(new Uint8Array(64))).toThrow(/U8 magic/);
    });

    it("reads the header offsets", () => {
        const { bytes } = sample();

        const archive = parseU8(bytes);

        expect(archive.rootOffset).toBe(HEADER_SIZE);
        expect(archive.nodes).toHaveLength(4);
    });

    it("builds full slash-delimited paths by walking the parent stack", () => {
        const { bytes } = sample();

        const archive = parseU8(bytes);

        expect(archive.paths[0]).toBe("");
        expect(archive.paths[1]).toBe("dir");
        expect(archive.paths[2]).toBe("dir/a.bin");
        expect(archive.paths[3]).toBe(`dir/${TARGET}`);
    });

    it("distinguishes directory nodes from file nodes", () => {
        const { bytes } = sample();

        const archive = parseU8(bytes);

        expect(archive.nodes[1].type).toBe(1);
        expect(archive.nodes[2].type).toBe(0);
        expect(archive.nodes[3].type).toBe(0);
    });
});

describe("replaceBrfntInU8", () => {
    /** Pulls a file's bytes back out using its own node entry, which is what a consumer does. */
    const fileBytes = (archive: Uint8Array, index: number) => {
        const parsed = parseU8(archive);
        const node = parsed.nodes[index];
        return archive.subarray(node.dataOffset, node.dataOffset + node.size);
    };

    it("swaps in the replacement and updates that node's size", () => {
        const { bytes } = sample();
        const replacement = new Uint8Array([7, 7, 7]);

        const rebuilt = replaceBrfntInU8(bytes, replacement);

        expect(parseU8(rebuilt).nodes[3].size).toBe(replacement.length);
        expect(Array.from(fileBytes(rebuilt, 3))).toEqual([7, 7, 7]);
    });

    it("leaves other files byte-identical", () => {
        const { bytes, plainData } = sample();

        const rebuilt = replaceBrfntInU8(bytes, new Uint8Array(64).fill(3));

        expect(Array.from(fileBytes(rebuilt, 2))).toEqual(Array.from(plainData));
    });

    it("keeps paths resolvable after the rebuild", () => {
        const { bytes } = sample();

        const rebuilt = replaceBrfntInU8(bytes, new Uint8Array([1]));

        expect(parseU8(rebuilt).paths[3]).toBe(`dir/${TARGET}`);
    });

    it("aligns every file to a 32-byte boundary", () => {
        const { bytes } = sample();

        // An odd length forces padding before the following file.
        const rebuilt = replaceBrfntInU8(bytes, new Uint8Array(5).fill(1));
        const parsed = parseU8(rebuilt);

        for (const node of parsed.nodes.filter((n) => n.type === 0)) {
            expect(node.dataOffset % 0x20).toBe(0);
        }
    });

    it("grows the archive when the replacement is larger", () => {
        const { bytes } = sample();

        const rebuilt = replaceBrfntInU8(bytes, new Uint8Array(4096).fill(2));

        expect(rebuilt.length).toBeGreaterThan(bytes.length);
        expect(parseU8(rebuilt).nodes[3].size).toBe(4096);
    });

    it("leaves the archive untouched when no path matches the target suffix", () => {
        const { bytes, fontData } = sample();

        const rebuilt = replaceBrfntInU8(bytes, new Uint8Array([5, 5]), "no-such-file.brfnt");

        expect(Array.from(fileBytes(rebuilt, 3))).toEqual(Array.from(fontData));
    });
});
