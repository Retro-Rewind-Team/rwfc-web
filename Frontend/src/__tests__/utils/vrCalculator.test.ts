import { describe, expect, it } from "vitest";
import {
    calcNegPoints,
    calcPosPoints,
    DEFAULT_MODIFIERS,
    fmtDelta,
    fmtFixed,
    getGainCap,
    getLossCap,
    getLowVrLossDivider,
    getMultiplier,
    simulate,
    truncCentis,
    type VRModifiers,
} from "../../utils/vrCalculator";

/**
 * Expected values come from an oracle, not from this code: PlayerRating.cpp and
 * RatingMultiplier.cpp from the game source, ported statement by statement to numpy float32
 * (IEEE single precision, like the game's float math). Ratings are internal units, where 50.00
 * displays as 5000 VR.
 */

describe("calcPosPoints", () => {
    it("awards 0.1785 for beating an equal-rated player", () => {
        expect(calcPosPoints(50, 50)).toBeCloseTo(0.178507611, 6);
    });

    it("awards more for beating a stronger player", () => {
        expect(calcPosPoints(50, 100)).toBeCloseTo(0.193237141, 6);
    });

    it("reaches the 0.24 cap against a far stronger player", () => {
        expect(calcPosPoints(0, 5000)).toBeCloseTo(0.24, 6);
    });

    it("bottoms out at 0.02 against a far weaker player", () => {
        expect(calcPosPoints(5000, 0)).toBeCloseTo(0.02, 6);
    });
});

describe("calcNegPoints", () => {
    it("takes 0.1785 for losing to an equal-rated player", () => {
        expect(calcNegPoints(50, 50)).toBeCloseTo(-0.178507611, 6);
    });

    it("takes the full 0.19 for losing to a far weaker player", () => {
        expect(calcNegPoints(5000, 0)).toBeCloseTo(-0.19, 6);
    });

    it("takes very little for losing to a far stronger player", () => {
        expect(calcNegPoints(0, 5000)).toBeCloseTo(-0.00555555569, 6);
    });
});

describe("getGainCap", () => {
    it("does not cap gains below 1500", () => {
        expect(getGainCap(1499)).toBe(1e6);
        expect(getGainCap(0)).toBe(1e6);
    });

    it("caps gains at 0.1 from 9000 up", () => {
        expect(getGainCap(9000)).toBeCloseTo(0.1, 6);
        expect(getGainCap(99999)).toBeCloseTo(0.1, 6);
    });

    it("scales the cap down linearly between 1500 and 9000", () => {
        expect(getGainCap(5250)).toBeCloseTo(500.050018, 3);
    });
});

describe("getLossCap", () => {
    it("caps losses at 0.5 at a rating of 150", () => {
        expect(getLossCap(150)).toBe(-0.5);
    });

    it("caps losses at 2.09 from 500 up", () => {
        expect(getLossCap(500)).toBeCloseTo(-2.09, 6);
        expect(getLossCap(9999)).toBeCloseTo(-2.09, 6);
    });

    it("keeps extending the same line below 150 instead of flattening at -0.5", () => {
        expect(getLossCap(100)).toBeCloseTo(-0.27285713, 6);
    });

    it("turns positive below a rating of about 40, as the game's formula does", () => {
        expect(getLossCap(10)).toBeCloseTo(0.135999978, 6);
    });
});

describe("getLowVrLossDivider", () => {
    it("divides losses by 7.5 at a rating of 0", () => {
        expect(getLowVrLossDivider(0)).toBe(7.5);
    });

    it("scales linearly to 1 at a rating of 150", () => {
        expect(getLowVrLossDivider(75)).toBeCloseTo(4.25, 6);
        expect(getLowVrLossDivider(149.99)).toBeCloseTo(1.000433, 5);
    });

    it("does nothing from 150 up", () => {
        expect(getLowVrLossDivider(150)).toBe(1);
    });
});

describe("truncCentis", () => {
    it("truncates (does not round) to 2 decimal places", () => {
        expect(truncCentis(1.239)).toBeCloseTo(1.23, 6);
    });

    it("keeps an exact centi value that double-precision math would push down a centi", () => {
        // 0.29 * 100 is 28.999999999999996 in doubles, but 29 in the game's single precision.
        expect(truncCentis(0.29)).toBeCloseTo(0.29, 6);
    });

    it("truncates toward zero for negative values", () => {
        expect(truncCentis(-1.239)).toBeCloseTo(-1.23, 6);
    });

    it("leaves whole numbers unchanged", () => {
        expect(truncCentis(5)).toBe(5);
    });
});

describe("getMultiplier", () => {
    const mods = (overrides: Partial<VRModifiers> = {}): VRModifiers => ({
        ...DEFAULT_MODIFIERS,
        ...overrides,
    });

    it.each([
        { name: "no modifiers", modifiers: mods(), players: 12, total: 1 },
        { name: "weekend", modifiers: mods({ weekend: true }), players: 12, total: 1.5 },
        { name: "beta build", modifiers: mods({ betaBuild: true }), players: 12, total: 1.25 },
        { name: "server value 2", modifiers: mods({ serverMultiplier: 2 }), players: 12, total: 2 },
        {
            name: "battle elimination, 12 players",
            modifiers: mods({ battleElimination: true }),
            players: 12,
            total: 2.162,
        },
        {
            name: "battle elimination, 6 players",
            modifiers: mods({ battleElimination: true }),
            players: 6,
            total: 1.166,
        },
        {
            name: "battle elimination, 5 players",
            modifiers: mods({ battleElimination: true }),
            players: 5,
            total: 1,
        },
        {
            name: "weekend plus battle elimination, 8 players",
            modifiers: mods({ weekend: true, battleElimination: true }),
            players: 8,
            total: 1.998,
        },
    ])("$name gives $total", ({ modifiers, players, total }) => {
        expect(getMultiplier(modifiers, players).total).toBeCloseTo(total, 5);
    });

    it("caps the total at 2.5", () => {
        const result = getMultiplier(
            mods({ weekend: true, serverMultiplier: 2, betaBuild: true }),
            12,
        );

        expect(result.total).toBe(2.5);
        expect(result.capped).toBe(true);
    });

    it("never goes below 1, even with a server value under 1", () => {
        expect(getMultiplier(mods({ serverMultiplier: 0.5 }), 12).total).toBe(1);
    });

    it("ignores a server value that is not a number, as the game ignores an unreadable one", () => {
        expect(getMultiplier(mods({ serverMultiplier: Number.NaN }), 12).total).toBe(1);
    });
});

describe("simulate", () => {
    const GAME_LIMITS = {
        vrMode: true,
        allDisconnected: false,
        minDisplay: 100,
        maxDisplay: 1_000_000,
    };

    /** Runs a race in the given finish order and returns each player's VR afterwards. */
    const race = (
        displayVrs: number[],
        modifiers: VRModifiers = DEFAULT_MODIFIERS,
        options: Partial<typeof GAME_LIMITS> = {},
    ) =>
        simulate(
            displayVrs.map((displayVr, i) => ({ id: i + 1, displayVr })),
            modifiers,
            { ...GAME_LIMITS, ...options },
        ).players.map((p) => p.newDisplayVr);

    it("12 players at 5000 VR: 1st gains 196 and the low-VR divider softens every loss", () => {
        expect(race(Array(12).fill(5000))).toEqual([
            5196, 5160, 5124, 5089, 5053, 5017, 4996, 4995, 4995, 4995, 4995, 4995,
        ]);
    });

    it("12 players at 30000 VR: the bottom three hit the loss cap", () => {
        expect(race(Array(12).fill(30000))).toEqual([
            30196, 30160, 30124, 30089, 30053, 30017, 29982, 29946, 29910, 29881, 29881, 29881,
        ]);
    });

    it("a lobby with a wide VR spread", () => {
        expect(
            race([12000, 45000, 30000, 8000, 60000, 25000, 5000, 90000, 15000, 3000, 40000, 20000]),
        ).toEqual([
            12228, 45122, 30124, 8150, 60004, 25046, 5072, 89890, 14981, 3004, 39861, 19927,
        ]);
    });

    it("irregular ratings, including the 100 VR floor and the 15000 divider boundary", () => {
        expect(
            race([5029, 4971, 12345, 9876, 150, 14999, 15000, 50001, 23456, 7777, 31313, 100]),
        ).toEqual([5251, 5158, 12476, 9979, 260, 15019, 14984, 49910, 23367, 7759, 31188, 117]);
    });

    it("a 2000 VR player finishing last still gains, because the loss cap turns positive", () => {
        expect(race([...Array(11).fill(5000), 2000])).toEqual([
            5195, 5159, 5124, 5088, 5052, 5017, 4996, 4995, 4995, 4995, 4995, 2009,
        ]);
    });

    it("holds ratings near the top to the 0.10 gain cap", () => {
        expect(race([999950, 999990, 5000, 5000])).toEqual([999959, 999976, 5016, 4996]);
    });

    it("applies the low-VR divider only under VR mode rules", () => {
        const lobby = Array(12).fill(8000);

        expect(race(lobby)).toEqual([
            8196, 8160, 8124, 8089, 8053, 8017, 7995, 7986, 7981, 7981, 7981, 7981,
        ]);
        expect(race(lobby, DEFAULT_MODIFIERS, { vrMode: false })).toEqual([
            8196, 8160, 8124, 8089, 8053, 8017, 7982, 7981, 7981, 7981, 7981, 7981,
        ]);
    });

    it("zeroes a loss smaller than 0.0101 under VR mode rules", () => {
        // Losing to a far stronger player costs 0.0056: dropped in VR mode, kept otherwise.
        expect(race([999000, 20000])[1]).toBe(20000);
        expect(race([999000, 20000], DEFAULT_MODIFIERS, { vrMode: false })[1]).toBe(19999);
    });

    it("scales changes by the weekend multiplier", () => {
        expect(race(Array(12).fill(30000), { ...DEFAULT_MODIFIERS, weekend: true })).toEqual([
            30294, 30240, 30187, 30133, 30080, 30026, 29973, 29919, 29881, 29881, 29881, 29881,
        ]);
    });

    it("stops scaling once the multiplier reaches its 2.5 cap", () => {
        const modifiers = { ...DEFAULT_MODIFIERS, weekend: true, serverMultiplier: 2 };

        expect(race(Array(12).fill(30000), modifiers)).toEqual([
            30490, 30401, 30312, 30223, 30133, 30044, 29955, 29881, 29881, 29881, 29881, 29881,
        ]);
    });

    it("all-disconnected rule: 4 or more players each lose 1 VR", () => {
        expect(race(Array(4).fill(5000), DEFAULT_MODIFIERS, { allDisconnected: true })).toEqual([
            4999, 4999, 4999, 4999,
        ]);
    });

    it("all-disconnected rule: fewer than 4 players keep their VR", () => {
        expect(race(Array(3).fill(5000), DEFAULT_MODIFIERS, { allDisconnected: true })).toEqual([
            5000, 5000, 5000,
        ]);
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
