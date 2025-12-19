import type { U8Archive, U8Node } from "../types/tools";

export function parseU8(u8: Uint8Array): U8Archive {
    if (u8[0] !== 0x55 || u8[1] !== 0xAA || u8[2] !== 0x38 || u8[3] !== 0x2D) {
        throw new Error("Not a U8 archive (missing U8 magic).");
    }

    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    const rootOffset = dv.getUint32(4, false);
    const headerSize = dv.getUint32(8, false);
    const dataOffset = dv.getUint32(12, false);

    function readNode(idx: number): U8Node {
        const off = rootOffset + idx * 12;
        const type = u8[off];
        const nameOffset = ((u8[off + 1] << 16) | (u8[off + 2] << 8) | u8[off + 3]) >>> 0;
        const dataOff = dv.getUint32(off + 4, false);
        const size = dv.getUint32(off + 8, false);
        return { type, nameOffset, dataOffset: dataOff, size, index: idx };
    }

    const rootNode = readNode(0);
    const nodeCount = rootNode.size;
    const nodes: U8Node[] = new Array(nodeCount);
    for (let i = 0; i < nodeCount; i++) {
        nodes[i] = readNode(i);
    }

    const stringBase = rootOffset + nodeCount * 12;
    const paths: string[] = new Array(nodeCount);
    paths[0] = "";

    interface StackEntry {
        index: number;
        firstChild: number;
        endIndex: number;
    }

    const stack: StackEntry[] = [
        { index: 0, firstChild: 1, endIndex: nodeCount }
    ];

    for (let idx = 1; idx < nodeCount; idx++) {
        const node = nodes[idx];

        while (stack.length) {
            const top = stack[stack.length - 1];
            if (top.firstChild <= idx && idx < top.endIndex) break;
            stack.pop();
        }
        const parentIndex = stack.length ? stack[stack.length - 1].index : 0;

        const nameStart = stringBase + node.nameOffset;
        let p = nameStart;
        const bytes: number[] = [];
        while (p < u8.length && u8[p] !== 0x00) {
            bytes.push(u8[p++]);
        }
        const name = String.fromCharCode(...bytes);
        const parentPath = paths[parentIndex];
        const fullPath = parentPath ? (parentPath + "/" + name) : name;
        paths[idx] = fullPath;

        if (node.type === 1) {
            stack.push({ index: idx, firstChild: node.dataOffset, endIndex: node.size });
        }
    }

    return { nodes, paths, rootOffset, headerSize, dataOffset };
}

export function replaceBrfntInU8(
    u8: Uint8Array,
    replacementUint8: Uint8Array,
    targetSuffix = "tt_kart_extension_font.brfnt"
): Uint8Array {
    const { nodes, paths, rootOffset, dataOffset } = parseU8(u8);

    const header = new Uint8Array(u8.subarray(0, dataOffset));
    const headerView = new DataView(header.buffer, header.byteOffset, header.byteLength);

    const dataBytes: number[] = [];

    function currentOffset(): number {
        return header.length + dataBytes.length;
    }

    function padToAlignment(alignment: number): void {
        const offset = currentOffset();
        const pad = (alignment - (offset % alignment)) & (alignment - 1);
        for (let i = 0; i < pad; i++) dataBytes.push(0x00);
    }

    for (let idx = 1; idx < nodes.length; idx++) {
        const node = nodes[idx];
        if (node.type === 1) continue;

        padToAlignment(0x20);
        const newOffset = currentOffset();

        const fullPath = paths[idx] || "";
        const isTarget = fullPath.endsWith(targetSuffix);

        const fileData = isTarget
            ? replacementUint8
            : u8.subarray(node.dataOffset, node.dataOffset + node.size);

        const nodeHeaderOff = rootOffset + idx * 12;
        headerView.setUint32(nodeHeaderOff + 4, newOffset, false);
        headerView.setUint32(nodeHeaderOff + 8, fileData.length, false);

        for (let i = 0; i < fileData.length; i++) {
            dataBytes.push(fileData[i]);
        }
    }

    const dataArr = new Uint8Array(dataBytes);
    const newU8 = new Uint8Array(header.length + dataArr.length);
    newU8.set(header, 0);
    newU8.set(dataArr, header.length);

    return newU8;
}