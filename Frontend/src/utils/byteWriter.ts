/**
 * A growable byte buffer backed by a Uint8Array.
 *
 * The binary writers here used to accumulate into a `number[]` and convert at the end. Every entry
 * in a JS number array is a boxed 64-bit slot, so a multi-megabyte font cost roughly eight times
 * its own size while being built, and then again for the copy into the final Uint8Array.
 */
export class ByteWriter {
    private buffer: Uint8Array;
    private size = 0;

    constructor(initialCapacity = 4096) {
        this.buffer = new Uint8Array(Math.max(1, initialCapacity));
    }

    /** Number of bytes written so far. */
    get length(): number {
        return this.size;
    }

    /** Appends one byte. Kept separate from {@link push} so hot loops do not allocate a rest array. */
    pushByte(byte: number): void {
        this.ensure(1);
        this.buffer[this.size++] = byte;
    }

    /** Appends several bytes. */
    push(...bytes: number[]): void {
        this.ensure(bytes.length);
        for (const byte of bytes) {
            this.buffer[this.size++] = byte;
        }
    }

    /** Appends `count` bytes from `source` starting at `start`. */
    pushFrom(source: Uint8Array, start: number, count: number): void {
        this.ensure(count);
        this.buffer.set(source.subarray(start, start + count), this.size);
        this.size += count;
    }

    /** Appends `count` copies of `byte`, used for alignment padding. */
    pushRepeat(byte: number, count: number): void {
        this.ensure(count);
        this.buffer.fill(byte, this.size, this.size + count);
        this.size += count;
    }

    /**
     * ORs a mask into an already-written byte. The Yaz0 writers reserve a control byte, emit the
     * group it describes, then set its bits once they know what went in.
     */
    orAt(index: number, mask: number): void {
        if (index < 0 || index >= this.size) {
            throw new RangeError(`ByteWriter.orAt out of range: ${index}`);
        }
        this.buffer[index] |= mask;
    }

    /** Copies out exactly the bytes written. */
    toUint8Array(): Uint8Array {
        return this.buffer.slice(0, this.size);
    }

    private ensure(extra: number): void {
        const needed = this.size + extra;
        if (needed <= this.buffer.length) return;

        let capacity = this.buffer.length;
        while (capacity < needed) capacity *= 2;

        const grown = new Uint8Array(capacity);
        grown.set(this.buffer.subarray(0, this.size));
        this.buffer = grown;
    }
}
