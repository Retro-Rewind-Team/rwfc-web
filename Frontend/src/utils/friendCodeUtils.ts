// MD5 implementation for Friend Code generation
function md5Bytes(bytes: Uint8Array): Uint8Array {
    const r = (x: number, n: number) => (x << n) | (x >>> (32 - n));
    const K = new Uint32Array(64);
    for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0;

    const S = new Uint8Array([
        7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
        5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
        4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
        6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
    ]);

    const len = bytes.length;
    const nWords = (((len + 9 + 63) >> 6) << 4);
    const X = new Uint32Array(nWords);

    for (let i = 0; i < len; i++) X[i >> 2] |= bytes[i] << ((i & 3) * 8);
    X[len >> 2] |= 0x80 << ((len & 3) * 8);

    const bl = len * 8 >>> 0;
    const blh = Math.floor((len * 8) / 2 ** 32) >>> 0;
    X[nWords - 2] = bl;
    X[nWords - 1] = blh;

    let a0 = 0x67452301 | 0, b0 = 0xEFCDAB89 | 0, c0 = 0x98BADCFE | 0, d0 = 0x10325476 | 0;

    for (let i = 0; i < nWords; i += 16) {
        let a = a0, b = b0, c = c0, d = d0;
        for (let j = 0; j < 64; j++) {
            let f: number, g: number;
            if (j < 16) {
                f = (b & c) | (~b & d);
                g = j;
            } else if (j < 32) {
                f = (d & b) | (~d & c);
                g = (5 * j + 1) % 16;
            } else if (j < 48) {
                f = b ^ c ^ d;
                g = (3 * j + 5) % 16;
            } else {
                f = c ^ (b | ~d);
                g = (7 * j) % 16;
            }
            const t = (a + f + K[j] + X[i + g]) >>> 0;
            a = d; d = c; c = b; b = (b + r(t, S[j])) >>> 0;
        }
        a0 = (a0 + a) >>> 0; b0 = (b0 + b) >>> 0; c0 = (c0 + c) >>> 0; d0 = (d0 + d) >>> 0;
    }

    const out = new Uint8Array(16);
    const W = [a0, b0, c0, d0];
    for (let i = 0; i < 4; i++) {
        out[i * 4 + 0] = W[i] & 0xFF;
        out[i * 4 + 1] = (W[i] >>> 8) & 0xFF;
        out[i * 4 + 2] = (W[i] >>> 16) & 0xFF;
        out[i * 4 + 3] = (W[i] >>> 24) & 0xFF;
    }
    return out;
}

export function pidToFriendCode(pid: number): string {
    pid = pid >>> 0;
    const buf = new Uint8Array(8);
    buf[0] = pid & 0xFF;
    buf[1] = (pid >>> 8) & 0xFF;
    buf[2] = (pid >>> 16) & 0xFF;
    buf[3] = (pid >>> 24) & 0xFF;
    buf[4] = 0x4A; // 'J'
    buf[5] = 0x43; // 'C'
    buf[6] = 0x4D; // 'M'
    buf[7] = 0x52; // 'R'

    const md = md5Bytes(buf);
    const csum = md[0] >>> 1;
    const fc = (BigInt(csum) << 32n) | BigInt(pid >>> 0);
    let s = fc.toString();
    if (s.length < 12) s = s.padStart(12, "0");
    return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

export function formatFriendCode(digits: string): string {
    if (digits.length !== 12) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
}