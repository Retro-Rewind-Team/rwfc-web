import { describe, expect, it } from "vitest";
import {
    getFileExtension,
    validateBrfnt,
    validateFileName,
    validateFontSzs,
    validateRatingFile,
    validateRksysFile,
} from "../../utils/fileValidator";

function makeBuffer(size: number): ArrayBuffer {
    return new ArrayBuffer(size);
}

function writeString(buf: ArrayBuffer, offset: number, str: string): void {
    const view = new DataView(buf);
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

function writeUint32BE(buf: ArrayBuffer, offset: number, value: number): void {
    new DataView(buf).setUint32(offset, value, false);
}

function writeUint16BE(buf: ArrayBuffer, offset: number, value: number): void {
    new DataView(buf).setUint16(offset, value, false);
}

// --- validateFontSzs ---

describe("validateFontSzs", () => {
    it("rejects a buffer smaller than 16 bytes", () => {
        const result = validateFontSzs(new ArrayBuffer(4));
        expect(result.valid).toBe(false);
        expect(result.error).toContain("too small");
    });

    it("rejects a buffer with wrong magic bytes", () => {
        const buf = makeBuffer(16);
        writeString(buf, 0, "AAAA");
        const result = validateFontSzs(buf);
        expect(result.valid).toBe(false);
        expect(result.error).toContain("Invalid file format");
    });

    it("rejects when decompressed size is 0", () => {
        const buf = makeBuffer(16);
        writeString(buf, 0, "Yaz0");
        writeUint32BE(buf, 4, 0);
        const result = validateFontSzs(buf);
        expect(result.valid).toBe(false);
    });

    it("accepts a valid Yaz0 header with a reasonable decompressed size", () => {
        const buf = makeBuffer(20000);
        writeString(buf, 0, "Yaz0");
        writeUint32BE(buf, 4, 50000);
        const result = validateFontSzs(buf);
        expect(result.valid).toBe(true);
    });

    it("adds a warning for files smaller than 10 KB", () => {
        const buf = makeBuffer(100);
        writeString(buf, 0, "Yaz0");
        writeUint32BE(buf, 4, 500);
        const result = validateFontSzs(buf);
        expect(result.valid).toBe(true);
        expect(result.warnings?.some((w) => w.includes("unusually small"))).toBe(true);
    });
});

// --- validateBrfnt ---

describe("validateBrfnt", () => {
    it("rejects a buffer smaller than 32 bytes", () => {
        const result = validateBrfnt(new ArrayBuffer(10));
        expect(result.valid).toBe(false);
    });

    it("rejects a buffer with wrong magic bytes", () => {
        const buf = makeBuffer(32);
        writeString(buf, 0, "AAAA");
        const result = validateBrfnt(buf);
        expect(result.valid).toBe(false);
    });

    it("accepts a valid RFNT header with correct BOM", () => {
        const buf = makeBuffer(5000);
        writeString(buf, 0, "RFNT");
        writeUint16BE(buf, 4, 0xfeff);
        const result = validateBrfnt(buf);
        expect(result.valid).toBe(true);
        expect(result.warnings ?? []).toHaveLength(0);
    });

    it("adds a warning for an unexpected BOM but still returns valid", () => {
        const buf = makeBuffer(5000);
        writeString(buf, 0, "RFNT");
        writeUint16BE(buf, 4, 0x0000);
        const result = validateBrfnt(buf);
        expect(result.valid).toBe(true);
        expect(result.warnings?.some((w) => w.includes("byte order mark"))).toBe(true);
    });
});

// --- validateRatingFile ---

describe("validateRatingFile", () => {
    it("rejects a buffer smaller than 8 bytes", () => {
        expect(validateRatingFile(new ArrayBuffer(4)).valid).toBe(false);
    });

    it("rejects wrong magic", () => {
        const buf = makeBuffer(8);
        writeString(buf, 0, "AAAA");
        expect(validateRatingFile(buf).valid).toBe(false);
    });

    it("rejects when header count exceeds buffer capacity", () => {
        const buf = makeBuffer(8);
        writeString(buf, 0, "RRRT");
        writeUint16BE(buf, 4, 1);
        writeUint16BE(buf, 6, 5);
        expect(validateRatingFile(buf).valid).toBe(false);
    });

    it("accepts an empty valid file (count=0) with a warning", () => {
        const buf = makeBuffer(8);
        writeString(buf, 0, "RRRT");
        writeUint16BE(buf, 4, 1);
        writeUint16BE(buf, 6, 0);
        const result = validateRatingFile(buf);
        expect(result.valid).toBe(true);
        expect(result.warnings?.some((w) => w.includes("0 entries"))).toBe(true);
    });

    it("accepts a file with the exact expected size for its entry count", () => {
        const count = 2;
        const buf = makeBuffer(8 + count * 16);
        writeString(buf, 0, "RRRT");
        writeUint16BE(buf, 4, 1);
        writeUint16BE(buf, 6, count);
        expect(validateRatingFile(buf).valid).toBe(true);
    });

    it("warns about extra data beyond the expected size", () => {
        const count = 1;
        const buf = makeBuffer(8 + count * 16 + 100);
        writeString(buf, 0, "RRRT");
        writeUint16BE(buf, 4, 1);
        writeUint16BE(buf, 6, count);
        const result = validateRatingFile(buf);
        expect(result.valid).toBe(true);
        expect(result.warnings?.some((w) => w.includes("extra data"))).toBe(true);
    });

    it("warns for unexpected version (non-1)", () => {
        const buf = makeBuffer(8);
        writeString(buf, 0, "RRRT");
        writeUint16BE(buf, 4, 2);
        writeUint16BE(buf, 6, 0);
        const result = validateRatingFile(buf);
        expect(result.valid).toBe(true);
        expect(result.warnings?.some((w) => w.includes("version"))).toBe(true);
    });
});

// --- validateRksysFile ---

describe("validateRksysFile", () => {
    it("rejects a buffer below the minimum size (0x1A72C = 107308 bytes)", () => {
        const result = validateRksysFile(new ArrayBuffer(1000));
        expect(result.valid).toBe(false);
        expect(result.error).toContain("too small");
    });

    it("accepts a buffer at the minimum required size", () => {
        const result = validateRksysFile(new ArrayBuffer(0x1a72c));
        expect(result.valid).toBe(true);
    });
});

// --- getFileExtension ---

describe("getFileExtension", () => {
    it("returns the lowercase extension for a normal filename", () => {
        expect(getFileExtension("Font.szs")).toBe("szs");
    });

    it("returns the last extension for a multi-dotted filename", () => {
        expect(getFileExtension("archive.tar.gz")).toBe("gz");
    });

    it("returns an empty string when there is no extension", () => {
        expect(getFileExtension("noextension")).toBe("");
    });

    it("lowercases the extension", () => {
        expect(getFileExtension("FILE.SZS")).toBe("szs");
    });
});

// --- validateFileName ---

describe("validateFileName", () => {
    it("returns valid when the extension matches", () => {
        const result = validateFileName("RRRating.pul", ["pul"]);
        expect(result.valid).toBe(true);
    });

    it("returns invalid with a descriptive error when the extension does not match", () => {
        const result = validateFileName("file.txt", ["pul", "szs"]);
        expect(result.valid).toBe(false);
        expect(result.error).toContain(".pul");
        expect(result.error).toContain(".szs");
    });

    it("accepts multiple valid extensions", () => {
        expect(validateFileName("font.brfnt", ["brfnt", "szs"]).valid).toBe(true);
    });
});
