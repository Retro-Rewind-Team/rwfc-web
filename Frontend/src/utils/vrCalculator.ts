const SPLINE_CP = [0, 1, 8, 50, 125] as const;
const SPLINE_BIAS = 7499;
const SPLINE_SCALE = 1 / (SPLINE_BIAS * 2);

export const VR_DISPLAY_SCALE = 100;
export const DEFAULT_DISPLAY_VR = 5000;

function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
}

function evalSpline(x: number): number {
    let r = 0;
    for (let i = -2; i <= 6; i++) {
        const idx = clamp(i, 0, 4);
        const d = Math.abs(x - i);
        let w = 0;
        if (d <= 1) {
            w = (4 - 6 * d * d + 3 * d * d * d) / 6;
        } else if (d < 2) {
            const t = 2 - d;
            w = (t * t * t) / 6;
        }
        r += w * SPLINE_CP[idx];
    }
    return r / 30;
}

/**
 * Calculates the positive VR points earned by beating one opponent.
 * Uses a cubic B-spline over the VR difference, biased toward the opponent's rating.
 * Returns a value in [0.02, 0.24] in internal VR units.
 * @param selfVr - The player's internal VR (display VR / 100).
 * @param oppVr - The opponent's internal VR.
 */
export function calcPosPoints(selfVr: number, oppVr: number): number {
    const s = clamp(SPLINE_BIAS + (oppVr - selfVr) * 4, 0, SPLINE_BIAS * 2);
    return clamp(evalSpline(SPLINE_SCALE * s), 0.02, 0.24);
}

/**
 * Calculates the negative VR points lost by finishing behind one opponent.
 * Mirrors the positive spline but inverts the VR difference and returns a value in [-0.19, 0].
 * @param selfVr - The player's internal VR (display VR / 100).
 * @param oppVr - The opponent's internal VR.
 */
export function calcNegPoints(selfVr: number, oppVr: number): number {
    const s = clamp(SPLINE_BIAS - (oppVr - selfVr) * 16, 0, SPLINE_BIAS * 2);
    return clamp(-evalSpline(SPLINE_SCALE * s), -0.19, 0);
}

/**
 * Returns the maximum VR gain cap for a given internal rating.
 * Players below 1500 have no cap (1e6). From 1500 to 9000 the cap decreases
 * linearly from ~1000 down to 0.1 to slow runaway inflation at high ratings.
 * @param rating - The player's current internal VR value (display VR / 100).
 */
export function getGainCap(rating: number): number {
    if (rating < 1500) return 1e6;
    if (rating >= 9000) return 0.1;
    return 0.1 + 999.9 * (1 - (rating - 1500) / 7500);
}

/**
 * Returns the maximum VR loss cap (a negative value) for a given internal rating.
 * Players at or below 150 are hard-floored at -0.5 to prevent large losses at the
 * lowest ratings. From 150 to 500 the cap grows linearly in magnitude to -2.09 as
 * rating increases, then stays fixed above 500.
 * @param rating - The player's current internal VR value (display VR / 100).
 */
export function getLossCap(rating: number): number {
    if (rating <= 150) return -0.5;
    if (rating >= 500) return -2.09;
    return -0.5 - 1.59 * ((rating - 150) / 350);
}

/** Truncates a value to two decimal places (centis) without rounding. */
export function truncCentis(v: number): number {
    return Math.trunc(v * 100) / 100;
}

export interface VRModifiers {
    eventDay: boolean;
    specialMultiplier: boolean;
    weekendMultiplier: boolean;
    battleBonus: boolean;
    betaBuild: boolean;
}

export const DEFAULT_MODIFIERS: VRModifiers = {
    eventDay: false,
    specialMultiplier: false,
    weekendMultiplier: false,
    battleBonus: false,
    betaBuild: false,
};

export interface MultiplierInfo {
    base: number;
    battle: number;
    total: number;
}

/**
 * Computes the VR multiplier breakdown for a race session.
 * The base multiplier starts at 2 on event days, else 1. Special and weekend multipliers
 * each add 25%. The battle bonus adds 0.166 per player above 5. If betaBuild is active,
 * the total (base + battle) is scaled by 1.15.
 * @param mods - Active modifier flags for the session.
 * @param playerCount - Number of players in the room, used for the battle bonus.
 */
export function getMultiplier(mods: VRModifiers, playerCount: number): MultiplierInfo {
    let base = mods.eventDay ? 2 : 1;
    if (mods.specialMultiplier) base *= 1.25;
    if (mods.weekendMultiplier) base *= 1.25;
    const battle = mods.battleBonus && playerCount > 5 ? (playerCount - 5) * 0.166 : 0;
    const total = mods.betaBuild ? (base + battle) * 1.15 : base + battle;
    return { base, battle, total };
}

export interface PlayerInput {
    id: number;
    displayVr: number;
}

export interface PlayerContribution {
    opponentId: number;
    win: boolean;
    rawValue: number;
    multValue: number;
}

export interface PlayerResult {
    id: number;
    displayVr: number;
    pairSum: number;
    afterMult: number;
    afterCaps: number;
    vrRule: string;
    finalDelta: number;
    newDisplayVr: number;
    contributions: PlayerContribution[];
}

export interface SimulationResult {
    players: PlayerResult[];
    mult: MultiplierInfo;
}

/**
 * Simulates a full VR race result for all players in a room.
 * For each ordered pair (winner i, loser j), calculates pair-wise point contributions
 * using calcPosPoints and calcNegPoints, sums them, applies multipliers, clamps with
 * gain/loss caps, and applies Retro Rewind's "tiny negative to zero" and
 * "all disconnected" edge-case rules. The final display VR is truncated to centis.
 * @param players - Each player's ID and current display VR.
 * @param mods - Session modifier flags (event day, weekend, etc.).
 * @param opts - Simulation options including VR mode, disconnect state, and VR floor/ceiling.
 * @returns Per-player results with intermediate values and the session multiplier breakdown.
 */
export function simulate(
    players: PlayerInput[],
    mods: VRModifiers,
    opts: { vrMode: boolean; allDisconnected: boolean; minDisplay: number; maxDisplay: number },
): SimulationResult {
    const n = players.length;
    const mult = getMultiplier(mods, n);
    const minVr = opts.minDisplay / VR_DISPLAY_SCALE;
    const maxVr = opts.maxDisplay / VR_DISPLAY_SCALE;

    const pairSums = new Array<number>(n).fill(0);
    const contribs: PlayerContribution[][] = Array.from({ length: n }, () => []);

    for (let i = 0; i < n; i++) {
        const selfVr = players[i].displayVr / VR_DISPLAY_SCALE;
        for (let j = 0; j < n; j++) {
            if (i === j) continue;
            const oppVr = players[j].displayVr / VR_DISPLAY_SCALE;
            if (i < j) {
                const raw = calcPosPoints(selfVr, oppVr);
                pairSums[i] += raw;
                contribs[i].push({
                    opponentId: players[j].id,
                    win: true,
                    rawValue: raw,
                    multValue: raw * mult.total,
                });
            } else {
                const raw = calcNegPoints(selfVr, oppVr);
                pairSums[i] += raw;
                contribs[i].push({
                    opponentId: players[j].id,
                    win: false,
                    rawValue: raw,
                    multValue: raw * mult.total,
                });
            }
        }
    }

    const results: PlayerResult[] = players.map((p, i) => {
        const vr = p.displayVr / VR_DISPLAY_SCALE;
        let delta = pairSums[i] * mult.total;
        const afterMult = delta;
        delta = clamp(delta, getLossCap(vr), getGainCap(vr));
        const afterCaps = delta;

        let vrRule = "-";
        if (opts.vrMode) {
            if (opts.allDisconnected) {
                delta = n >= 4 ? -0.01 : 0;
                vrRule = n >= 4 ? "ALL DISC −0.01" : "ALL DISC 0.00";
            } else if (delta >= -0.0101 && delta < 0) {
                delta = 0;
                vrRule = "TINY NEG → 0";
            }
        }

        const newVr = truncCentis(clamp(vr + delta, minVr, maxVr));
        const finalDelta = newVr - vr;

        return {
            id: p.id,
            displayVr: p.displayVr,
            pairSum: pairSums[i],
            afterMult,
            afterCaps,
            vrRule,
            finalDelta,
            newDisplayVr: Math.round(newVr * VR_DISPLAY_SCALE),
            contributions: contribs[i],
        };
    });

    return { players: results, mult };
}

/** Formats an internal VR delta as a signed display-VR string (e.g. "+250" or "-50"). */
export function fmtDelta(internalDelta: number): string {
    const d = Math.round(internalDelta * VR_DISPLAY_SCALE);
    if (d === 0) return "±0";
    return d > 0 ? `+${d}` : `${d}`;
}

/** Formats a number to a fixed number of decimal places, or returns "-" for non-finite values. */
export function fmtFixed(val: number, dp = 4): string {
    return Number.isFinite(val) ? val.toFixed(dp) : "-";
}
