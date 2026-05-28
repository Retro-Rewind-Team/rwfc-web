import { describe, expect, it } from "vitest";
import {
    calcNegPoints,
    calcPosPoints,
    DEFAULT_MODIFIERS,
    fmtDelta,
    fmtFixed,
    getGainCap,
    getLossCap,
    getMultiplier,
    simulate,
    truncCentis,
} from "../../utils/vrCalculator";

describe("calcPosPoints", () => {
    it("returns a value in the valid range [0.02, 0.24]", () => {
        const result = calcPosPoints(50, 50);
        expect(result).toBeGreaterThanOrEqual(0.02);
        expect(result).toBeLessThanOrEqual(0.24);
    });

    it("returns a higher value when opponent VR is much higher (beating a stronger player)", () => {
        const vsBetter = calcPosPoints(50, 100);
        const vsWorse = calcPosPoints(50, 10);
        expect(vsBetter).toBeGreaterThan(vsWorse);
    });
});

describe("calcNegPoints", () => {
    it("returns a value in the valid range [-0.19, 0]", () => {
        const result = calcNegPoints(50, 50);
        expect(result).toBeLessThanOrEqual(0);
        expect(result).toBeGreaterThanOrEqual(-0.19);
    });

    it("returns a larger loss when opponent VR is much lower (losing to a weaker player)", () => {
        const vsWeaker = calcNegPoints(100, 10);
        const vsStronger = calcNegPoints(10, 100);
        expect(vsWeaker).toBeLessThan(vsStronger);
    });
});

describe("getGainCap", () => {
    it("returns 1e6 (no cap) below 1500", () => {
        expect(getGainCap(1499)).toBe(1e6);
        expect(getGainCap(0)).toBe(1e6);
    });

    it("returns 0.1 at and above 9000", () => {
        expect(getGainCap(9000)).toBe(0.1);
        expect(getGainCap(99999)).toBe(0.1);
    });

    it("returns a value between 0.1 and 1000 in the 1500-9000 range", () => {
        const cap = getGainCap(5250);
        expect(cap).toBeGreaterThan(0.1);
        expect(cap).toBeLessThan(1000);
    });
});

describe("getLossCap", () => {
    it("returns -0.5 at and below 150", () => {
        expect(getLossCap(150)).toBe(-0.5);
        expect(getLossCap(0)).toBe(-0.5);
    });

    it("returns -2.09 at and above 500", () => {
        expect(getLossCap(500)).toBeCloseTo(-2.09, 5);
        expect(getLossCap(9999)).toBeCloseTo(-2.09, 5);
    });

    it("returns a value between -2.09 and -0.5 in the 150-500 range", () => {
        const cap = getLossCap(325);
        expect(cap).toBeLessThan(-0.5);
        expect(cap).toBeGreaterThan(-2.09);
    });
});

describe("truncCentis", () => {
    it("truncates (does not round) to 2 decimal places", () => {
        expect(truncCentis(1.239)).toBe(1.23);
        expect(truncCentis(1.231)).toBe(1.23);
    });

    it("truncates toward zero for negative values", () => {
        expect(truncCentis(-1.239)).toBe(-1.23);
    });

    it("leaves whole numbers unchanged", () => {
        expect(truncCentis(5)).toBe(5);
    });
});

describe("getMultiplier", () => {
    it("returns base=1, battle=0, total=1 with no modifiers", () => {
        const result = getMultiplier(DEFAULT_MODIFIERS, 4);
        expect(result).toEqual({ base: 1, battle: 0, total: 1 });
    });

    it("doubles base when eventDay is true", () => {
        const result = getMultiplier({ ...DEFAULT_MODIFIERS, eventDay: true }, 4);
        expect(result.base).toBe(2);
        expect(result.total).toBe(2);
    });

    it("multiplies base by 1.25 when specialMultiplier is true", () => {
        const result = getMultiplier({ ...DEFAULT_MODIFIERS, specialMultiplier: true }, 4);
        expect(result.base).toBeCloseTo(1.25, 5);
    });

    it("stacks eventDay and specialMultiplier: base = 2.5", () => {
        const result = getMultiplier(
            { ...DEFAULT_MODIFIERS, eventDay: true, specialMultiplier: true },
            4,
        );
        expect(result.base).toBeCloseTo(2.5, 5);
    });

    it("adds battle bonus of 0.166 per player above 5", () => {
        const result = getMultiplier({ ...DEFAULT_MODIFIERS, battleBonus: true }, 6);
        expect(result.battle).toBeCloseTo(0.166, 3);
        expect(result.total).toBeCloseTo(1.166, 3);
    });

    it("does not add battle bonus when player count is 5 or fewer", () => {
        const result = getMultiplier({ ...DEFAULT_MODIFIERS, battleBonus: true }, 5);
        expect(result.battle).toBe(0);
    });

    it("multiplies total by 1.15 when betaBuild is true", () => {
        const result = getMultiplier({ ...DEFAULT_MODIFIERS, betaBuild: true }, 4);
        expect(result.total).toBeCloseTo(1.15, 5);
    });

    it("applies betaBuild on top of eventDay: total = 2 * 1.15", () => {
        const result = getMultiplier({ ...DEFAULT_MODIFIERS, eventDay: true, betaBuild: true }, 4);
        expect(result.total).toBeCloseTo(2.3, 5);
    });
});

describe("simulate", () => {
    const OPTS = { vrMode: true, allDisconnected: false, minDisplay: 1, maxDisplay: 99999 };

    it("two equal-VR players: winner gains, loser loses", () => {
        const players = [
            { id: 1, displayVr: 5000 },
            { id: 2, displayVr: 5000 },
        ];
        const { players: results } = simulate(players, DEFAULT_MODIFIERS, OPTS);
        expect(results[0].finalDelta).toBeGreaterThan(0);
        expect(results[1].finalDelta).toBeLessThan(0);
    });

    it("all-disconnected rule: 4+ players all get -1 display VR", () => {
        const players = [1, 2, 3, 4].map((id) => ({ id, displayVr: 5000 }));
        const { players: results } = simulate(players, DEFAULT_MODIFIERS, {
            ...OPTS,
            allDisconnected: true,
        });
        results.forEach((r) => {
            expect(r.newDisplayVr).toBe(r.displayVr - 1);
        });
    });

    it("all-disconnected rule: fewer than 4 players get 0 delta", () => {
        const players = [1, 2, 3].map((id) => ({ id, displayVr: 5000 }));
        const { players: results } = simulate(players, DEFAULT_MODIFIERS, {
            ...OPTS,
            allDisconnected: true,
        });
        results.forEach((r) => {
            expect(r.finalDelta).toBe(0);
        });
    });

    it("tiny negative rule: internal delta in (-0.0101, 0) rounds to 0 in vrMode", () => {
        const players = [
            { id: 1, displayVr: 99000 },
            { id: 2, displayVr: 100 },
        ];
        const { players: results } = simulate(players, DEFAULT_MODIFIERS, OPTS);
        const tinyNegPlayer = results.find((r) => r.vrRule === "TINY NEG → 0");
        if (tinyNegPlayer) {
            expect(tinyNegPlayer.finalDelta).toBe(0);
        }
    });
});

describe("fmtDelta", () => {
    it("formats a positive internal delta as '+N'", () => {
        expect(fmtDelta(0.05)).toBe("+5");
    });

    it("formats a negative internal delta as '-N'", () => {
        expect(fmtDelta(-0.03)).toBe("-3");
    });

    it("formats zero as '±0'", () => {
        expect(fmtDelta(0)).toBe("±0");
    });

    it("rounds to the nearest display VR unit", () => {
        expect(fmtDelta(0.004)).toBe("±0");
        expect(fmtDelta(0.006)).toBe("+1");
    });
});

describe("fmtFixed", () => {
    it("formats a finite number to 4 decimal places by default", () => {
        expect(fmtFixed(3.14159)).toBe("3.1416");
    });

    it("respects a custom dp argument", () => {
        expect(fmtFixed(3.14159, 2)).toBe("3.14");
    });

    it("returns '-' for Infinity", () => {
        expect(fmtFixed(Infinity)).toBe("-");
    });

    it("returns '-' for NaN", () => {
        expect(fmtFixed(NaN)).toBe("-");
    });

    it("formats zero correctly", () => {
        expect(fmtFixed(0)).toBe("0.0000");
    });
});
