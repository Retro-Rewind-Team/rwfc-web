/**
 * VR simulation mirroring Retro Rewind's PlayerRating.cpp and RatingMultiplier.cpp.
 *
 * The game does this math in single-precision floats, and that matters: ratings are truncated to
 * centis after every race, so a value such as 0.29, which doubles hold as 0.28999999999999998,
 * would lose a whole display VR point. Every step goes through Math.fround to stay on the same
 * float grid the game uses.
 */
const f = Math.fround;

const SPLINE_CONTROL_POINTS = [0, 1, 8, 50, 125] as const;
const SPLINE_BIAS = 7499;
/**
 * The game's constant as written. Its comment in PlayerRating.cpp says 1/(2*SPLINE_BIAS), but the
 * value is three times that, and the value is what runs.
 */
const SPLINE_SCALE = f(0.00020004);

export const VR_DISPLAY_SCALE = 100;
export const DEFAULT_DISPLAY_VR = 5000;
/** MIN_RATING and MAX_RATING from PlayerRating.hpp (1.00 and 10000.00) in display VR. */
export const MIN_DISPLAY_VR = 100;
export const MAX_DISPLAY_VR = 1_000_000;

/** The game's Clamp: same argument order and the same result when the bounds cross. */
function clamp(val: number, min: number, max: number): number {
    return val < min ? min : val > max ? max : val;
}

function evaluateSpline(x: number): number {
    let result = 0;
    for (let i = -2; i <= 6; i++) {
        const idx = i < 0 ? 0 : i > 4 ? 4 : i;
        let d = f(x - i);
        if (d < 0) d = -d;

        let w = 0;
        if (d <= 1) {
            // (4 - 6d² + 3d³) / 6, in the order the game evaluates it
            w = f(f(f(4 - f(f(6 * d) * d)) + f(f(f(3 * d) * d) * d)) / 6);
        } else if (d < 2) {
            const t = f(2 - d);
            w = f(f(f(t * t) * t) / 6);
        }
        result = f(result + f(w * SPLINE_CONTROL_POINTS[idx]));
    }
    return f(result / 30);
}

/**
 * Calculates the VR points earned by finishing ahead of one opponent.
 * Beating a stronger opponent is worth more. Returns a value in [0.02, 0.24] internal VR.
 * @param selfVr - The player's internal VR (display VR / 100).
 * @param oppVr - The opponent's internal VR.
 */
export function calcPosPoints(selfVr: number, oppVr: number): number {
    const sample = clamp(f(SPLINE_BIAS + f(f(oppVr - selfVr) * 4)), 0, SPLINE_BIAS * 2);
    return clamp(evaluateSpline(f(SPLINE_SCALE * sample)), f(0.02), f(0.24));
}

/**
 * Calculates the VR points lost by finishing behind one opponent.
 * Losing to a weaker opponent costs more. Returns a value in [-0.19, 0] internal VR.
 * @param selfVr - The player's internal VR (display VR / 100).
 * @param oppVr - The opponent's internal VR.
 */
export function calcNegPoints(selfVr: number, oppVr: number): number {
    const sample = clamp(f(SPLINE_BIAS - f(f(oppVr - selfVr) * 16)), 0, SPLINE_BIAS * 2);
    return clamp(-evaluateSpline(f(SPLINE_SCALE * sample)), f(-0.19), 0);
}

/**
 * Returns the largest VR gain allowed in one race at a given internal rating.
 * Uncapped below 1500, then shrinking linearly from about 1000 down to 0.1 at 9000 and above.
 * @param rating - The player's current internal VR (display VR / 100).
 */
export function getGainCap(rating: number): number {
    if (rating < 1500) return 1e6;
    if (rating >= 9000) return f(0.1);
    const t = f(f(rating - 1500) / 7500);
    return f(f(0.1) + f(f(999.9) * f(1 - t)));
}

/**
 * Returns the largest VR loss allowed in one race (a negative number) at a given internal rating.
 * Fixed at -2.09 from 500 up. Below that the game keeps following the line through -0.5 at 150,
 * and under about 40 the "cap" turns positive, which forces a small gain even for last place.
 * @param rating - The player's current internal VR (display VR / 100).
 */
export function getLossCap(rating: number): number {
    if (rating >= 500) return f(-2.09);
    const t = f(f(rating - 150) / 350);
    return f(f(-0.5) + f(f(f(-2.09) + f(0.5)) * t));
}

/**
 * Returns what a negative race total is divided by under VR mode rules: 7.5 at a rating of 0,
 * falling linearly to 1 (no effect) at 150 and above.
 * @param rating - The player's current internal VR (display VR / 100).
 */
export function getLowVrLossDivider(rating: number): number {
    if (rating >= 150) return 1;
    if (rating <= 0) return 7.5;
    return f(7.5 - f(6.5 * f(rating / 150)));
}

/** Truncates a rating to two decimal places (centis) without rounding, in single precision. */
export function truncCentis(v: number): number {
    return f(Math.trunc(f(f(v) * 100)) / 100);
}

/** The number FormatRatingDigits prints for a rating: the whole part, then rounded centis. */
function toDisplayVr(rating: number): number {
    let whole = Math.trunc(rating);
    let centis = Math.trunc(f(f(f(rating - whole) * 100) + 0.5));
    if (centis >= 100) {
        whole++;
        centis -= 100;
    }
    if (centis < 0) centis = -centis;
    return whole * 100 + centis;
}

export interface VRModifiers {
    /** Weekend event for the player's region: 1.5×. */
    weekend: boolean;
    /** Battle elimination: +0.166 for each room player above 5. */
    battleElimination: boolean;
    /** Beta builds of the game multiply by 1.25. */
    betaBuild: boolean;
    /** Value the game downloads from /api/multiplier, which is how events are applied. */
    serverMultiplier: number;
}

export const DEFAULT_MODIFIERS: VRModifiers = {
    weekend: false,
    battleElimination: false,
    betaBuild: false,
    serverMultiplier: 1,
};

export interface MultiplierInfo {
    /** 1, or 1.5 on a weekend. */
    base: number;
    /** Battle elimination bonus, added to the base. */
    battle: number;
    /** Server multiplier actually applied: 1 when the value is not usable. */
    server: number;
    /** Final multiplier, after the beta factor and the game's 1.0-2.5 limit. */
    total: number;
    /** True when that limit changed the total. */
    capped: boolean;
}

/**
 * Computes the VR multiplier the way RatingMultiplier.cpp's GetMultiplier does:
 * (weekend base + battle bonus) × server value × beta factor, then clamped to [1, 2.5].
 * @param mods - Active modifiers.
 * @param roomPlayers - Number of players in the room, used for the battle elimination bonus.
 */
export function getMultiplier(mods: VRModifiers, roomPlayers: number): MultiplierInfo {
    const base = mods.weekend ? f(1.5) : 1;
    const battle = mods.battleElimination && roomPlayers > 5 ? f(f(roomPlayers - 5) * f(0.166)) : 0;
    // The game only applies a server value that parsed as a plain number; anything else leaves 1.
    const server =
        Number.isFinite(mods.serverMultiplier) && mods.serverMultiplier >= 0
            ? f(mods.serverMultiplier)
            : 1;

    let uncapped = f(f(base + battle) * server);
    if (mods.betaBuild) uncapped = f(uncapped * f(1.25));
    const total = uncapped < 1 ? 1 : uncapped > 2.5 ? 2.5 : uncapped;

    return { base, battle, server, total, capped: total !== uncapped };
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
 * Simulates one race, following RR_UpdatePoints in PlayerRating.cpp. Array order is finish order.
 *
 * Each player sums points against every opponent. Under VR mode rules a negative total below a
 * rating of 150 is divided by {@link getLowVrLossDivider}. The total is multiplied, clamped to the
 * loss and gain caps, and then VR mode rules either set everyone to -0.01 (all disconnected, 4+
 * players) or drop a loss smaller than 0.0101. The new rating is clamped to the rating range and
 * truncated to centis.
 * @param players - Each player's ID and current display VR, in finish order.
 * @param mods - Active modifiers.
 * @param opts - VR mode rules, the all-disconnected case, and the display VR floor and ceiling.
 */
export function simulate(
    players: PlayerInput[],
    mods: VRModifiers,
    opts: { vrMode: boolean; allDisconnected: boolean; minDisplay: number; maxDisplay: number },
): SimulationResult {
    const n = players.length;
    const mult = getMultiplier(mods, n);
    const minRating = f(opts.minDisplay / VR_DISPLAY_SCALE);
    const maxRating = f(opts.maxDisplay / VR_DISPLAY_SCALE);
    const ratings = players.map((p) => f(p.displayVr / VR_DISPLAY_SCALE));

    const pairSums = new Array<number>(n).fill(0);
    const pairs: Omit<PlayerContribution, "multValue">[][] = Array.from({ length: n }, () => []);

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (i === j) continue;
            const win = i < j;
            const raw = win
                ? calcPosPoints(ratings[i], ratings[j])
                : calcNegPoints(ratings[i], ratings[j]);
            pairSums[i] = f(pairSums[i] + raw);
            pairs[i].push({ opponentId: players[j].id, win, rawValue: raw });
        }
    }

    const results = players.map((p, i): PlayerResult => {
        const old = ratings[i];
        const rules: string[] = [];
        let delta = pairSums[i];

        let divider = 1;
        if (opts.vrMode && old < 150 && delta < 0) {
            divider = getLowVrLossDivider(old);
            if (divider > 1) {
                delta = f(delta / divider);
                rules.push(`LOW VR ÷${divider.toFixed(2)}`);
            }
        }

        delta = f(delta * mult.total);
        const afterMult = delta;
        delta = clamp(delta, getLossCap(old), getGainCap(old));
        const afterCaps = delta;

        if (opts.vrMode) {
            if (opts.allDisconnected) {
                delta = n >= 4 ? f(-0.01) : 0;
                rules.push(n >= 4 ? "ALL DISC −0.01" : "ALL DISC 0.00");
            } else if (delta >= f(-0.0101) && delta < 0) {
                delta = 0;
                rules.push("TINY NEG → 0");
            }
        }

        const next = truncCentis(clamp(f(old + delta), minRating, maxRating));

        return {
            id: p.id,
            displayVr: p.displayVr,
            pairSum: pairSums[i],
            afterMult,
            afterCaps,
            vrRule: rules.length > 0 ? rules.join(", ") : "-",
            finalDelta: f(next - old),
            newDisplayVr: toDisplayVr(next),
            contributions: pairs[i].map((pair) => ({
                ...pair,
                multValue: f(f(pair.rawValue / divider) * mult.total),
            })),
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
