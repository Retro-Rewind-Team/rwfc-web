import { RoomPlayer } from "../types";

/**
 * Detects split rooms by finding connected components in the bidirectional
 * connectivity graph formed by each player's conn_map.
 *
 * conn_map position j in player i's map (players sorted by slot ID ascending):
 *   - maps to player j     if j < i  (slot before self, no offset needed)
 *   - maps to player j + 1 if j >= i (slot at or after self, skip own entry)
 *
 * Returns one group when there is no split, two or more groups when there is.
 * Falls back to a single group if slot IDs are unavailable (old snapshots).
 */
export function detectSplitGroups(players: RoomPlayer[]): RoomPlayer[][] {
    if (players.length <= 1) return [players];

    if (players.some(p => !p.slotId)) return [players];

    const sorted = [...players].sort(
        (a, b) => parseInt(a.slotId!) - parseInt(b.slotId!)
    );
    const n = sorted.length;

    const canConnect = (i: number, j: number): boolean => {
        const map = sorted[i].connectionMap;
        const pos = j < i ? j : j - 1;
        return pos >= 0 && pos < map.length && map[pos] !== "0";
    };

    const visited = new Array<boolean>(n).fill(false);
    const groups: RoomPlayer[][] = [];

    for (let start = 0; start < n; start++) {
        if (visited[start]) continue;

        const groupIndices: number[] = [];
        const queue = [start];
        visited[start] = true;

        while (queue.length > 0) {
            const curr = queue.shift()!;
            groupIndices.push(curr);

            for (let j = 0; j < n; j++) {
                if (visited[j]) continue;
                if (canConnect(curr, j) && canConnect(j, curr)) {
                    visited[j] = true;
                    queue.push(j);
                }
            }
        }

        groups.push(groupIndices.map(idx => sorted[idx]));
    }

    return groups;
}
