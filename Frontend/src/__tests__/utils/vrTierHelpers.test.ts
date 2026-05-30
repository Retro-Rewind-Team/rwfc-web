import { describe, expect, it } from "vitest";
import { Medal, Trophy } from "lucide-solid";
import {
    formatVRRange,
    getNextVRTier,
    getTierProgress,
    getTrophyIcon,
    getVRNeededForNextTier,
    getVRTierInfo,
    isTopThreeRank,
    tierHasGlow,
    tierHasIcon,
    tierHasTab,
} from "../../utils/vrTierHelpers";

describe("getVRTierInfo", () => {
    it("returns 'beginner' tier for VR 0", () => {
        expect(getVRTierInfo(0).tier).toBe("beginner");
    });

    it("returns 'beginner' tier at the top of the beginner range (9999)", () => {
        expect(getVRTierInfo(9999).tier).toBe("beginner");
    });

    it("returns 'rising' tier at the boundary (10000)", () => {
        expect(getVRTierInfo(10000).tier).toBe("rising");
    });

    it("returns 'god' tier at 100000", () => {
        expect(getVRTierInfo(100000).tier).toBe("god");
    });

    it("returns SUSPICIOUS_TIER when isSuspicious is true, regardless of VR", () => {
        expect(getVRTierInfo(999999, true).tier).toBe("suspicious");
        expect(getVRTierInfo(0, true).tier).toBe("suspicious");
    });
});

describe("getNextVRTier", () => {
    it("returns 'rising' when current VR is in the beginner range", () => {
        expect(getNextVRTier(5000)?.tier).toBe("rising");
    });

    it("returns null at the top tier (god)", () => {
        expect(getNextVRTier(100000)).toBeNull();
    });

    it("returns null when isSuspicious is true", () => {
        expect(getNextVRTier(5000, true)).toBeNull();
    });
});

describe("getVRNeededForNextTier", () => {
    it("returns the correct VR gap from mid-beginner to rising (10000)", () => {
        expect(getVRNeededForNextTier(5000)).toBe(5000);
    });

    it("returns 0 at the top tier", () => {
        expect(getVRNeededForNextTier(100000)).toBe(0);
    });

    it("returns 0 when isSuspicious", () => {
        expect(getVRNeededForNextTier(5000, true)).toBe(0);
    });
});

describe("getTierProgress", () => {
    it("returns 0 at the very start of the beginner tier (VR 0)", () => {
        expect(getTierProgress(0)).toBe(0);
    });

    it("returns 0.5 at the midpoint of a tier", () => {
        expect(getTierProgress(5000)).toBeCloseTo(0.5, 1);
    });

    it("returns 1 at the top tier (no next tier)", () => {
        expect(getTierProgress(100000)).toBe(1);
    });

    it("returns 0 when isSuspicious", () => {
        expect(getTierProgress(50000, true)).toBe(0);
    });

    it("clamps to [0, 1]", () => {
        const progress = getTierProgress(9999);
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(1);
    });
});

describe("formatVRRange", () => {
    it("formats a finite range as 'X - Y VR'", () => {
        expect(formatVRRange(getVRTierInfo(0))).toBe("0 - 9,999 VR");
    });

    it("formats an open-ended top tier as 'X+ VR'", () => {
        expect(formatVRRange(getVRTierInfo(100000))).toBe("100,000+ VR");
    });
});

describe("isTopThreeRank", () => {
    it("returns true for ranks 1, 2, and 3", () => {
        expect(isTopThreeRank(1)).toBe(true);
        expect(isTopThreeRank(2)).toBe(true);
        expect(isTopThreeRank(3)).toBe(true);
    });

    it("returns false for rank 0", () => {
        expect(isTopThreeRank(0)).toBe(false);
    });

    it("returns false for rank 4 and above", () => {
        expect(isTopThreeRank(4)).toBe(false);
        expect(isTopThreeRank(100)).toBe(false);
    });
});

describe("getTrophyIcon", () => {
    it("returns gold medal for rank 1", () => {
        expect(getTrophyIcon(1)).toBe(Trophy);
    });

    it("returns silver medal for rank 2", () => {
        expect(getTrophyIcon(2)).toBe(Medal);
    });

    it("returns bronze medal for rank 3", () => {
        expect(getTrophyIcon(3)).toBe(Medal);
    });

    it("returns null for rank 0 and 4+", () => {
        expect(getTrophyIcon(0)).toBeNull();
        expect(getTrophyIcon(4)).toBeNull();
    });
});

describe("tierHasGlow", () => {
    it("returns true for glow tiers (god, elite, etc.)", () => {
        expect(tierHasGlow("god")).toBe(true);
        expect(tierHasGlow("elite")).toBe(true);
        expect(tierHasGlow("legend")).toBe(true);
    });

    it("returns false for non-glow tiers", () => {
        expect(tierHasGlow("beginner")).toBe(false);
        expect(tierHasGlow("veteran")).toBe(false);
    });

    it("returns false for unknown tier names", () => {
        expect(tierHasGlow("unknown-tier")).toBe(false);
    });
});

describe("tierHasTab", () => {
    it("returns true for all defined tiers", () => {
        expect(tierHasTab("god")).toBe(true);
        expect(tierHasTab("beginner")).toBe(true);
        expect(tierHasTab("suspicious")).toBe(true);
    });

    it("returns false for an unknown tier name", () => {
        expect(tierHasTab("fake-tier")).toBe(false);
    });
});

describe("tierHasIcon", () => {
    it("returns true for icon tiers (god, elite, suspicious, etc.)", () => {
        expect(tierHasIcon("god")).toBe(true);
        expect(tierHasIcon("elite")).toBe(true);
        expect(tierHasIcon("suspicious")).toBe(true);
    });

    it("returns false for tiers without icons", () => {
        expect(tierHasIcon("beginner")).toBe(false);
        expect(tierHasIcon("veteran")).toBe(false);
    });
});
