import { describe, expect, it } from "vitest";
import { detectSplitGroups } from "../../utils/roomUtils";
import { RoomPlayer } from "../../types";

function makePlayer(slotId: string | null, connectionMap: string[]): RoomPlayer {
    return {
        pid: slotId ?? "0",
        name: "Player",
        friendCode: "0000-0000-0000",
        vr: null,
        br: null,
        isOpenHost: false,
        isSuspended: false,
        connectionMap,
        slotId,
        mii: null,
    };
}

describe("detectSplitGroups", () => {
    it("returns one empty group for an empty player list", () => {
        const result = detectSplitGroups([]);
        expect(result).toEqual([[]]);
    });

    it("returns one group for a single player", () => {
        const player = makePlayer("1", []);
        const result = detectSplitGroups([player]);
        expect(result).toEqual([[player]]);
    });

    it("falls back to one group when any player is missing a slotId", () => {
        const a = makePlayer("1", ["2"]);
        const b = makePlayer(null, ["2"]);
        const result = detectSplitGroups([a, b]);
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveLength(2);
    });

    it("returns one group when both players are mutually connected", () => {
        // sorted: a(1), b(2)
        // a.conn_map[0] = connection to b; b.conn_map[0] = connection to a
        const a = makePlayer("1", ["2"]);
        const b = makePlayer("2", ["2"]);
        const result = detectSplitGroups([a, b]);
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveLength(2);
    });

    it("splits into two groups when two players cannot see each other", () => {
        const a = makePlayer("1", ["0"]);
        const b = makePlayer("2", ["0"]);
        const result = detectSplitGroups([a, b]);
        expect(result).toHaveLength(2);
        expect(result.every((g) => g.length === 1)).toBe(true);
    });

    it("requires bidirectional connection -- one-sided link does not unite groups", () => {
        // a claims it sees b, but b says it cannot see a
        const a = makePlayer("1", ["2"]);
        const b = makePlayer("2", ["0"]);
        const result = detectSplitGroups([a, b]);
        expect(result).toHaveLength(2);
    });

    it("treats three players with one isolated as two groups", () => {
        // sorted: a(1), b(2), c(3)
        // a.map: [toB=2, toC=0], b.map: [toA=2, toC=0], c.map: [toA=0, toB=0]
        const a = makePlayer("1", ["2", "0"]);
        const b = makePlayer("2", ["2", "0"]);
        const c = makePlayer("3", ["0", "0"]);
        const result = detectSplitGroups([a, b, c]);
        expect(result).toHaveLength(2);
        const sizes = result.map((g) => g.length).sort();
        expect(sizes).toEqual([1, 2]);
    });

    it("uses a bridge player to keep three players in one group", () => {
        // sorted: a(1), b(2), c(3)
        // a-b connected, b-c connected, a-c not directly connected
        // a.map: [toB=2, toC=0], b.map: [toA=2, toC=2], c.map: [toA=0, toB=2]
        const a = makePlayer("1", ["2", "0"]);
        const b = makePlayer("2", ["2", "2"]);
        const c = makePlayer("3", ["0", "2"]);
        const result = detectSplitGroups([a, b, c]);
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveLength(3);
    });

    it("splits four players into two groups of two", () => {
        // sorted: a(10), b(20), c(30), d(40)
        // a.map: [toB=2, toC=0, toD=0]
        // b.map: [toA=2, toC=0, toD=0]
        // c.map: [toA=0, toB=0, toD=2]
        // d.map: [toA=0, toB=0, toC=2]
        const a = makePlayer("10", ["2", "0", "0"]);
        const b = makePlayer("20", ["2", "0", "0"]);
        const c = makePlayer("30", ["0", "0", "2"]);
        const d = makePlayer("40", ["0", "0", "2"]);
        const result = detectSplitGroups([a, b, c, d]);
        expect(result).toHaveLength(2);
        expect(result.every((g) => g.length === 2)).toBe(true);
    });

    it("sorts by slot ID numerically, not lexicographically, before checking connections", () => {
        // Slots "9" and "10": lexicographic sort would put "10" before "9",
        // but numeric sort puts "9" first. The conn_map must match numeric order.
        // a(9)-b(10) connected; supply conn_maps for numeric-order (a first)
        const a = makePlayer("9", ["2"]); // a.map[0] = toB
        const b = makePlayer("10", ["2"]); // b.map[0] = toA
        const result = detectSplitGroups([b, a]); // intentionally pass out of order
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveLength(2);
    });
});
