import type { RatingEntry, RatingFile } from "../types/tools";

function clamp(value: number, min: number, max: number): number {
    const v = Number(value);
    if (!Number.isFinite(v)) return min;
    if (v < min) return min;
    if (v > max) return max;
    return v;
}

export function parseRatingFile(buffer: ArrayBuffer): RatingFile {
    const view = new DataView(buffer);
    if (view.byteLength < 8) {
        throw new Error("File too small to be a valid RRRating.pul (needs at least 8 bytes).");
    }

    let magic = "";
    for (let i = 0; i < 4; i++) {
        magic += String.fromCharCode(view.getUint8(i));
    }

    const version = view.getUint16(4, false);
    const count = view.getUint16(6, false);

    const maxEntriesBySize = Math.floor((view.byteLength - 8) / 16);
    const entriesToRead = Math.min(count, maxEntriesBySize);

    if (magic !== "RRRT") {
        console.warn("Unexpected magic:", magic);
    }

    if (entriesToRead < count) {
        console.warn("Header count larger than capacity; truncating to", entriesToRead);
    }

    const entries: RatingEntry[] = [];
    for (let i = 0; i < entriesToRead; i++) {
        const base = 8 + i * 16;
        const profileId = view.getInt32(base, false);
        let vr = view.getFloat32(base + 4, false);
        let br = view.getFloat32(base + 8, false);
        const flags = view.getUint32(base + 12, false);

        vr = clamp(vr, -10000, 10000);
        br = clamp(br, -10000, 10000);

        entries.push({
            index: i,
            profileId,
            vr,
            br,
            flags: flags >>> 0
        });
    }

    return { magic, version, count, entries };
}

export function buildRatingFile(ratingFile: RatingFile): ArrayBuffer {
    const totalEntries = Math.min(ratingFile.count, ratingFile.entries.length);
    const byteLength = 8 + totalEntries * 16;
    const buffer = new ArrayBuffer(byteLength);
    const view = new DataView(buffer);

    const magic = ratingFile.magic || "RRRT";
    view.setUint8(0, magic.charCodeAt(0) || "R".charCodeAt(0));
    view.setUint8(1, magic.charCodeAt(1) || "R".charCodeAt(0));
    view.setUint8(2, magic.charCodeAt(2) || "R".charCodeAt(0));
    view.setUint8(3, magic.charCodeAt(3) || "T".charCodeAt(0));

    const version = typeof ratingFile.version === "number" ? ratingFile.version : 1;
    view.setUint16(4, version & 0xffff, false);
    view.setUint16(6, totalEntries & 0xffff, false);

    for (let i = 0; i < totalEntries; i++) {
        const e = ratingFile.entries[i];
        const base = 8 + i * 16;
        view.setInt32(base, e.profileId | 0, false);
        view.setFloat32(base + 4, e.vr, false);
        view.setFloat32(base + 8, e.br, false);
        view.setUint32(base + 12, e.flags >>> 0, false);
    }

    return buffer;
}