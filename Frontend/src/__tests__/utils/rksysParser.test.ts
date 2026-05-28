import { describe, expect, it } from "vitest";
import {
    computeNeeds,
    computeScore,
    type LicenseStats,
    MAX_DIST,
    MAX_DIST1ST,
    MAX_FIRSTS,
    MAX_VR_INTERNAL,
    MIN_VS_FOR_RANK,
    rankFromScore,
} from "../../utils/rksysParser";

function makeStats(overrides: Partial<LicenseStats> = {}): LicenseStats {
    return {
        miiName: "TestPlayer",
        profileId: 1,
        vrPoints: 0,
        vsWins: 0,
        vsLosses: 0,
        firsts: 0,
        dist: 0,
        dist1st: 0,
        ...overrides,
    };
}

// --- rankFromScore ---

describe("rankFromScore", () => {
    it("returns rank 1 for score below 24", () => {
        expect(rankFromScore(0)).toBe(1);
        expect(rankFromScore(23.9)).toBe(1);
    });

    it("returns rank 2 at the 24 threshold", () => {
        expect(rankFromScore(24)).toBe(2);
    });

    it("returns rank 3 at the 36 threshold", () => {
        expect(rankFromScore(36)).toBe(3);
    });

    it("returns rank 4 at the 48 threshold", () => {
        expect(rankFromScore(48)).toBe(4);
    });

    it("returns rank 5 at the 60 threshold", () => {
        expect(rankFromScore(60)).toBe(5);
    });

    it("returns rank 6 at the 72 threshold", () => {
        expect(rankFromScore(72)).toBe(6);
    });

    it("returns rank 7 at the 84 threshold", () => {
        expect(rankFromScore(84)).toBe(7);
    });

    it("returns rank 8 at the 94 threshold", () => {
        expect(rankFromScore(94)).toBe(8);
    });

    it("returns rank 9 at score 100", () => {
        expect(rankFromScore(100)).toBe(9);
    });

    it("returns rank 8 just below 100", () => {
        expect(rankFromScore(99.9)).toBe(8);
    });
});

// --- computeScore ---

describe("computeScore", () => {
    it("sets meetsRaceReq = false and score = 0 when totalVs < MIN_VS_FOR_RANK", () => {
        const stats = makeStats({ vsWins: 50, vsLosses: 49 });
        const result = computeScore(stats);
        expect(result.meetsRaceReq).toBe(false);
        expect(result.score).toBe(0);
        expect(result.rank).toBe(0);
    });

    it("sets meetsRaceReq = true when totalVs >= MIN_VS_FOR_RANK", () => {
        const stats = makeStats({ vsWins: 60, vsLosses: 40 });
        expect(computeScore(stats).meetsRaceReq).toBe(true);
    });

    it("defaults winPct to 45 when totalVs is 0", () => {
        const stats = makeStats();
        expect(computeScore(stats).winPct).toBe(45);
    });

    it("computes winPct correctly from wins and losses", () => {
        const stats = makeStats({ vsWins: 75, vsLosses: 25 });
        expect(computeScore(stats).winPct).toBe(75);
    });

    it("clamps vrNorm to 100 when vrPoints exceeds MAX_VR_INTERNAL * 100", () => {
        const stats = makeStats({
            vrPoints: MAX_VR_INTERNAL * 100 * 2,
            vsWins: MIN_VS_FOR_RANK,
        });
        expect(computeScore(stats).vrNorm).toBe(100);
    });

    it("clamps firstsNorm to 100 when firsts exceeds MAX_FIRSTS", () => {
        const stats = makeStats({
            firsts: MAX_FIRSTS * 2,
            vsWins: MIN_VS_FOR_RANK,
        });
        expect(computeScore(stats).firstsNorm).toBe(100);
    });

    it("returns a higher score for a player with all stats maxed out", () => {
        const lowStats = makeStats({ vsWins: MIN_VS_FOR_RANK });
        const highStats = makeStats({
            vrPoints: MAX_VR_INTERNAL * 100,
            vsWins: MIN_VS_FOR_RANK,
            firsts: MAX_FIRSTS,
            dist: MAX_DIST,
            dist1st: MAX_DIST1ST,
        });
        expect(computeScore(highStats).score).toBeGreaterThan(computeScore(lowStats).score);
    });
});

// --- computeNeeds ---

describe("computeNeeds", () => {
    it("returns null when the player is already at rank 9 (max)", () => {
        const stats = makeStats({
            vrPoints: MAX_VR_INTERNAL * 100,
            vsWins: 100,
            vsLosses: 0,
            firsts: MAX_FIRSTS,
            dist: MAX_DIST,
            dist1st: MAX_DIST1ST,
        });
        expect(computeNeeds(stats)).toBeNull();
    });

    it("returns a RankNeeds object for a player below rank 9", () => {
        const stats = makeStats({ vsWins: MIN_VS_FOR_RANK });
        const needs = computeNeeds(stats);
        expect(needs).not.toBeNull();
        expect(needs).toHaveProperty("threshold");
        expect(needs).toHaveProperty("vr");
        expect(needs).toHaveProperty("winPct");
        expect(needs).toHaveProperty("firsts");
    });

    it("threshold in returned RankNeeds is one of the defined rank thresholds", () => {
        const stats = makeStats({ vsWins: MIN_VS_FOR_RANK });
        const needs = computeNeeds(stats);
        const validThresholds = [24, 36, 48, 60, 72, 84, 94, 100];
        expect(validThresholds).toContain(needs?.threshold);
    });

    it("feasibility is 'ok' when the needed stat is within the normal range", () => {
        const stats = makeStats({
            vrPoints: MAX_VR_INTERNAL * 50,
            vsWins: MIN_VS_FOR_RANK,
            firsts: MAX_FIRSTS / 2,
        });
        const needs = computeNeeds(stats);
        const allFeasibilities = [
            needs?.vr.feasibility,
            needs?.firsts.feasibility,
            needs?.dist.feasibility,
        ];
        expect(allFeasibilities.some((f) => f === "ok")).toBe(true);
    });
});
