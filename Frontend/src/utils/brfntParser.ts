const RFNT_MAGIC = 0x52464e54; // "RFNT"
const CMAP_MAGIC = 0x434d4150; // "CMAP"
const BLOCK_HEADER_SIZE = 8;
/** CMAP block header (8) + ccodeBegin, ccodeEnd, mappingMethod, reserved (8) + next pointer (4). */
const CMAP_INFO_OFFSET = 20;
const NO_GLYPH = 0xffff;

/**
 * Reports whether a BRFNT font maps a character code to a glyph.
 *
 * After the 16-byte RFNT header the file is a run of size-prefixed blocks. Each CMAP block covers
 * a code range with one of three layouts: 0 maps the whole range contiguously, 1 is a table with a
 * glyph index per code (0xFFFF for none), 2 is a list of code/index pairs.
 *
 * Returns false for data that does not parse as a font instead of throwing: callers use this to
 * warn about a file's contents, and validating the file is a separate step.
 * @param brfnt - Raw bytes of a .brfnt file.
 * @param charCode - UTF-16 code unit to look up, e.g. 0xF07D for Retro Rewind's E-rank badge.
 */
export function brfntHasGlyph(brfnt: Uint8Array, charCode: number): boolean {
    if (brfnt.length < 0x10) return false;
    const dv = new DataView(brfnt.buffer, brfnt.byteOffset, brfnt.byteLength);
    if (dv.getUint32(0, false) !== RFNT_MAGIC) return false;

    let offset = dv.getUint16(12, false);
    const blockCount = dv.getUint16(14, false);

    for (let i = 0; i < blockCount && offset + BLOCK_HEADER_SIZE <= brfnt.length; i++) {
        const size = dv.getUint32(offset + 4, false);
        // A size below the header would never advance the walk.
        if (size < BLOCK_HEADER_SIZE) return false;

        if (
            dv.getUint32(offset, false) === CMAP_MAGIC &&
            cmapHasGlyph(dv, offset, size, charCode)
        ) {
            return true;
        }
        offset += size;
    }

    return false;
}

function cmapHasGlyph(dv: DataView, block: number, size: number, code: number): boolean {
    const blockEnd = Math.min(block + size, dv.byteLength);
    if (block + CMAP_INFO_OFFSET > blockEnd) return false;

    const begin = dv.getUint16(block + 8, false);
    const end = dv.getUint16(block + 10, false);
    if (code < begin || code > end) return false;

    const info = block + CMAP_INFO_OFFSET;
    switch (dv.getUint16(block + 12, false)) {
        case 0:
            return true;
        case 1: {
            const at = info + (code - begin) * 2;
            return at + 2 <= blockEnd && dv.getUint16(at, false) !== NO_GLYPH;
        }
        case 2: {
            if (info + 2 > blockEnd) return false;
            const count = dv.getUint16(info, false);
            for (let i = 0; i < count; i++) {
                const at = info + 2 + i * 4;
                if (at + 4 > blockEnd) return false;
                if (dv.getUint16(at, false) === code)
                    return dv.getUint16(at + 2, false) !== NO_GLYPH;
            }
            return false;
        }
        default:
            return false;
    }
}
