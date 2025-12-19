// Yaz0 decompression for Nintendo archives
export function yaz0Decompress(src: Uint8Array): Uint8Array {
    if (src[0] !== 0x59 || src[1] !== 0x61 || src[2] !== 0x7A || src[3] !== 0x30) {
        throw new Error("Input is not Yaz0-compressed (missing 'Yaz0' magic).");
    }

    const dv = new DataView(src.buffer, src.byteOffset, src.byteLength);
    const uncompressedSize = dv.getUint32(4, false); // big-endian
    const dst = new Uint8Array(uncompressedSize);

    let srcPos = 16; // skip Yaz0 header
    let dstPos = 0;
    let currCodeByte = 0;
    let validBitCount = 0;

    while (dstPos < uncompressedSize) {
        if (validBitCount === 0) {
            if (srcPos >= src.length) break;
            currCodeByte = src[srcPos++];
            validBitCount = 8;
        }

        if (currCodeByte & 0x80) {
            // Literal byte
            if (srcPos >= src.length) throw new Error("Yaz0 stream truncated (literal).");
            dst[dstPos++] = src[srcPos++];
        } else {
            // Compressed run
            if (srcPos + 1 >= src.length) {
                throw new Error("Yaz0 stream truncated (compressed pair).");
            }
            const byte1 = src[srcPos++];
            const byte2 = src[srcPos++];
            let dist = ((byte1 & 0x0F) << 8) | byte2;
            dist += 1;

            let length = byte1 >> 4;
            if (length === 0) {
                if (srcPos >= src.length) throw new Error("Yaz0 stream truncated (length extension).");
                length = src[srcPos++] + 0x12;
            } else {
                length += 2;
            }

            for (let i = 0; i < length; i++) {
                dst[dstPos] = dst[dstPos - dist];
                dstPos++;
            }
        }

        currCodeByte <<= 1;
        validBitCount--;
    }

    if (dstPos !== uncompressedSize) {
        console.warn(`Yaz0 decompression: size mismatch (expected ${uncompressedSize}, got ${dstPos})`);
    }

    return dst;
}

// Yaz0 compression with LZ-style matching
export function yaz0Compress(uncompressed: Uint8Array): Uint8Array {
    const size = uncompressed.length;
    const out: number[] = [];

    // Yaz0 header
    out.push(0x59, 0x61, 0x7A, 0x30); // 'Yaz0'
    out.push(
        (size >>> 24) & 0xFF,
        (size >>> 16) & 0xFF,
        (size >>> 8) & 0xFF,
        size & 0xFF
    );
    // 8 reserved bytes
    for (let i = 0; i < 8; i++) out.push(0x00);

    const MAX_SEARCH_DEPTH = 8;
    const head = new Int32Array(0x10000);
    const prev = new Int32Array(size);
    head.fill(-1);
    prev.fill(-1);

    let pos = 0;

    while (pos < size) {
        const ctrlPos = out.length;
        out.push(0x00); // control byte placeholder
        let mask = 0x80;

        for (let b = 0; b < 8 && pos < size; b++) {
            let bestLen = 0;
            let bestDist = 0;

            if (pos < size - 2) {
                const k = ((uncompressed[pos] << 8) | uncompressed[pos + 1]) & 0xFFFF;
                let idx = head[k];
                let searchCount = 0;

                while (idx >= 0 && (pos - idx) <= 0x1000 && searchCount < MAX_SEARCH_DEPTH) {
                    const dist = pos - idx;
                    let maxLen = size - pos;
                    if (maxLen > 0x111) maxLen = 0x111;
                    const maxLenIdx = size - idx;
                    if (maxLen > maxLenIdx) maxLen = maxLenIdx;

                    let length = 2;
                    while (
                        length < maxLen &&
                        uncompressed[idx + length] === uncompressed[pos + length]
                    ) {
                        length++;
                    }

                    if (length > bestLen && length >= 3) {
                        bestLen = length;
                        bestDist = dist;
                        if (length === maxLen) break;
                    }

                    searchCount++;
                    idx = prev[idx];
                }
            }

            if (bestLen >= 3) {
                // Emit compressed run
                const runLen = bestLen;
                const distMinus1 = bestDist - 1;

                if (runLen >= 0x12) {
                    out.push(((0) << 4) | ((distMinus1 >> 8) & 0x0F));
                    out.push(distMinus1 & 0xFF);
                    out.push((runLen - 0x12) & 0xFF);
                } else {
                    out.push(((runLen - 2) << 4) | ((distMinus1 >> 8) & 0x0F));
                    out.push(distMinus1 & 0xFF);
                }

                const start = pos;
                const end = Math.min(pos + runLen, size - 1);
                for (let i = start; i < end; i++) {
                    const k2 = ((uncompressed[i] << 8) | uncompressed[i + 1]) & 0xFFFF;
                    prev[i] = head[k2];
                    head[k2] = i;
                }

                pos += runLen;
            } else {
                // Literal byte
                out[ctrlPos] |= mask;
                out.push(uncompressed[pos]);

                if (pos < size - 1) {
                    const k2 = ((uncompressed[pos] << 8) | uncompressed[pos + 1]) & 0xFFFF;
                    prev[pos] = head[k2];
                    head[k2] = pos;
                }

                pos += 1;
            }

            mask >>= 1;
        }
    }

    return new Uint8Array(out);
}

// Literal-only Yaz0 compression (fallback for compatibility)
export function yaz0CompressLiteralOnly(uncompressed: Uint8Array): Uint8Array {
    const size = uncompressed.length;
    const out: number[] = [];

    // Yaz0 magic
    out.push(0x59, 0x61, 0x7A, 0x30);
    out.push(
        (size >>> 24) & 0xFF,
        (size >>> 16) & 0xFF,
        (size >>> 8) & 0xFF,
        size & 0xFF
    );
    for (let i = 0; i < 8; i++) out.push(0x00);

    let i = 0;
    while (i < size) {
        const ctrlIndex = out.length;
        out.push(0x00);
        let mask = 0x80;

        for (let bit = 0; bit < 8 && i < size; bit++) {
            out[ctrlIndex] |= mask;
            out.push(uncompressed[i++]);
            mask >>= 1;
        }
    }

    return new Uint8Array(out);
}