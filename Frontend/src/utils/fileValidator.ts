export interface ValidationResult {
    valid: boolean;
    error?: string;
    warnings?: string[];
}

export function validateFontSzs(buffer: ArrayBuffer): ValidationResult {
    const view = new DataView(buffer);
    const warnings: string[] = [];

    // Check minimum size (Yaz0 header is 16 bytes)
    if (buffer.byteLength < 16) {
        return {
            valid: false,
            error: "File too small to be a valid Font.szs (needs at least 16 bytes)"
        };
    }

    // Check Yaz0 magic bytes
    const magic = String.fromCharCode(
        view.getUint8(0),
        view.getUint8(1),
        view.getUint8(2),
        view.getUint8(3)
    );

    if (magic !== "Yaz0") {
        return {
            valid: false,
            error: `Invalid file format. Expected Yaz0 magic bytes, got "${magic}"`
        };
    }

    // Check decompressed size from header
    const decompressedSize = view.getUint32(4, false);
    if (decompressedSize === 0 || decompressedSize > 100 * 1024 * 1024) {
        return {
            valid: false,
            error: `Suspicious decompressed size: ${decompressedSize.toLocaleString()} bytes`
        };
    }

    // Warn about unusually small/large files
    if (buffer.byteLength < 10000) {
        warnings.push("File is unusually small for Font.szs (< 10 KB)");
    }
    if (buffer.byteLength > 50 * 1024 * 1024) {
        warnings.push("File is unusually large for Font.szs (> 50 MB)");
    }

    return { valid: true, warnings };
}

export function validateBrfnt(buffer: ArrayBuffer): ValidationResult {
    const view = new DataView(buffer);
    const warnings: string[] = [];

    // Check minimum size (RFNT header is typically at least 32 bytes)
    if (buffer.byteLength < 32) {
        return {
            valid: false,
            error: "File too small to be a valid .brfnt (needs at least 32 bytes)"
        };
    }

    // Check RFNT magic bytes (big-endian)
    const magic = String.fromCharCode(
        view.getUint8(0),
        view.getUint8(1),
        view.getUint8(2),
        view.getUint8(3)
    );

    if (magic !== "RFNT") {
        return {
            valid: false,
            error: `Invalid file format. Expected RFNT magic bytes, got "${magic}"`
        };
    }

    // Check BOM (Byte Order Mark) - should be 0xFEFF for big-endian
    const bom = view.getUint16(4, false);
    if (bom !== 0xFEFF) {
        warnings.push(`Unusual byte order mark: 0x${bom.toString(16).toUpperCase()} (expected 0xFEFF)`);
    }

    // Warn about unusually small/large font files
    if (buffer.byteLength < 1000) {
        warnings.push("File is unusually small for a .brfnt font (< 1 KB)");
    }
    if (buffer.byteLength > 10 * 1024 * 1024) {
        warnings.push("File is unusually large for a .brfnt font (> 10 MB)");
    }

    return { valid: true, warnings };
}

export function validateRatingFile(buffer: ArrayBuffer): ValidationResult {
    const view = new DataView(buffer);
    const warnings: string[] = [];

    // Check minimum size (header is 8 bytes)
    if (buffer.byteLength < 8) {
        return {
            valid: false,
            error: "File too small to be a valid RRRating.pul (needs at least 8 bytes)"
        };
    }

    // Check RRRT magic bytes
    const magic = String.fromCharCode(
        view.getUint8(0),
        view.getUint8(1),
        view.getUint8(2),
        view.getUint8(3)
    );

    if (magic !== "RRRT") {
        return {
            valid: false,
            error: `Invalid file format. Expected RRRT magic bytes, got "${magic}"`
        };
    }

    // Check version
    const version = view.getUint16(4, false);
    if (version !== 1) {
        warnings.push(`Unexpected version: ${version} (expected 1). File may not parse correctly.`);
    }

    // Check entry count
    const count = view.getUint16(6, false);
    const maxEntriesBySize = Math.floor((buffer.byteLength - 8) / 16);

    if (count === 0) {
        warnings.push("File contains 0 entries");
    }

    if (count > maxEntriesBySize) {
        return {
            valid: false,
            error: `Header claims ${count} entries but file only has space for ${maxEntriesBySize}`
        };
    }

    // Check expected file size
    const expectedSize = 8 + count * 16;
    if (buffer.byteLength < expectedSize) {
        return {
            valid: false,
            error: `File too small for ${count} entries (expected ${expectedSize} bytes, got ${buffer.byteLength})`
        };
    }

    if (buffer.byteLength > expectedSize) {
        warnings.push(`File has extra data (${buffer.byteLength - expectedSize} bytes beyond expected size)`);
    }

    // Warn about unusually large entry counts
    if (count > 10000) {
        warnings.push(`Very large entry count: ${count.toLocaleString()}`);
    }

    return { valid: true, warnings };
}

export function validateRksysFile(buffer: ArrayBuffer): ValidationResult {
    const warnings: string[] = [];

    // Expected size for rksys.dat (approximately 110,000 bytes)
    const expectedSize = 0x1AE48; // 110,152 bytes
    const minSize = 100000; // At least 100 KB
    const maxSize = 150000; // At most 150 KB

    if (buffer.byteLength < minSize) {
        return {
            valid: false,
            error: `File too small to be a valid rksys.dat (expected ~${expectedSize.toLocaleString()} bytes, got ${buffer.byteLength.toLocaleString()})`
        };
    }

    if (buffer.byteLength > maxSize) {
        return {
            valid: false,
            error: `File too large to be a valid rksys.dat (expected ~${expectedSize.toLocaleString()} bytes, got ${buffer.byteLength.toLocaleString()})`
        };
    }

    if (buffer.byteLength !== expectedSize) {
        warnings.push(`File size differs from expected (expected ${expectedSize.toLocaleString()} bytes, got ${buffer.byteLength.toLocaleString()})`);
    }

    return { valid: true, warnings };
}

export function getFileExtension(filename: string): string {
    const parts = filename.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

export function validateFileName(filename: string, expectedExtensions: string[]): ValidationResult {
    const ext = getFileExtension(filename);
    
    if (!expectedExtensions.includes(ext)) {
        return {
            valid: false,
            error: `Invalid file extension ".${ext}". Expected: ${expectedExtensions.map(e => `.${e}`).join(", ")}`
        };
    }

    return { valid: true };
}