import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Medal, Trophy } from "lucide-solid";
import {
    formatAverageLap,
    formatDate,
    formatLastSeen,
    formatTimestamp,
    getDriftInfo,
    getRankBadgeClass,
    getRankIcon,
    getVRGainClass,
} from "../../utils/formatter";

describe("formatDate", () => {
    it("formats an ISO date string as DD/MM/YYYY", () => {
        // Use noon local time to avoid timezone-induced date rollover
        expect(formatDate("2024-06-15T12:00:00")).toBe("15/06/2024");
    });

    it("zero-pads single-digit day and month", () => {
        expect(formatDate("2024-01-05T12:00:00")).toBe("05/01/2024");
    });
});

describe("getDriftInfo", () => {
    it("returns 'Manual Outside' for type=0, category=0", () => {
        expect(getDriftInfo(0, 0)).toBe("Manual Outside");
    });

    it("returns 'Hybrid Inside' for type=1, category=1", () => {
        expect(getDriftInfo(1, 1)).toBe("Hybrid Inside");
    });

    it("handles unknown type and category gracefully", () => {
        const result = getDriftInfo(99, 99);
        expect(result).toContain("Unknown");
    });
});

describe("getRankBadgeClass", () => {
    it("returns gold class for rank 1", () => {
        expect(getRankBadgeClass(1)).toBe("bg-yellow-500 text-white");
    });

    it("returns silver class for rank 2", () => {
        expect(getRankBadgeClass(2)).toBe("bg-gray-400 text-white");
    });

    it("returns bronze class for rank 3", () => {
        expect(getRankBadgeClass(3)).toBe("bg-yellow-600 text-white");
    });

    it("returns blue class for rank 4 and above", () => {
        expect(getRankBadgeClass(4)).toBe("bg-blue-500 text-white");
        expect(getRankBadgeClass(100)).toBe("bg-blue-500 text-white");
    });
});

describe("getRankIcon", () => {
    it("returns trophy emoji for rank 1", () => {
        expect(getRankIcon(1)).toBe(Trophy);
    });

    it("returns silver medal emoji for rank 2", () => {
        expect(getRankIcon(2)).toBe(Medal);
    });

    it("returns bronze medal emoji for rank 3", () => {
        expect(getRankIcon(3)).toBe(Medal);
    });

    it("returns null for rank 4 and above", () => {
        expect(getRankIcon(4)).toBeNull();
        expect(getRankIcon(100)).toBeNull();
    });

    it("returns null for rank 0", () => {
        expect(getRankIcon(0)).toBeNull();
    });
});

describe("getVRGainClass", () => {
    it("returns green bold class for positive gain", () => {
        expect(getVRGainClass(1)).toBe("text-green-600 font-bold");
        expect(getVRGainClass(500)).toBe("text-green-600 font-bold");
    });

    it("returns red bold class for negative gain", () => {
        expect(getVRGainClass(-1)).toBe("text-red-600 font-bold");
    });

    it("returns gray class for zero gain", () => {
        expect(getVRGainClass(0)).toBe("text-gray-600");
    });
});

describe("formatTimestamp", () => {
    it("formats an ISO timestamp as HH:MM:SS using local time", () => {
        // No 'Z' suffix so the date is parsed in local time -- no timezone rollover
        expect(formatTimestamp("2024-06-15T14:30:45")).toBe("14:30:45");
    });

    it("zero-pads single-digit hours, minutes, and seconds", () => {
        expect(formatTimestamp("2024-06-15T09:05:03")).toBe("09:05:03");
    });
});

describe("formatLastSeen", () => {
    const BASE = "2024-06-15T12:00:00Z";

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns 'Now Online' when less than 1 minute has passed", () => {
        vi.setSystemTime(new Date("2024-06-15T12:00:30Z"));
        expect(formatLastSeen(BASE)).toBe("Now Online");
    });

    it("returns '1 minute ago' for exactly 1 minute", () => {
        vi.setSystemTime(new Date("2024-06-15T12:01:00Z"));
        expect(formatLastSeen(BASE)).toBe("1 minute ago");
    });

    it("returns 'N minutes ago' for 2-59 minutes", () => {
        vi.setSystemTime(new Date("2024-06-15T12:45:00Z"));
        expect(formatLastSeen(BASE)).toBe("45 minutes ago");
    });

    it("returns '1 hour ago' for exactly 60 minutes", () => {
        vi.setSystemTime(new Date("2024-06-15T13:00:00Z"));
        expect(formatLastSeen(BASE)).toBe("1 hour ago");
    });

    it("returns 'N hours ago' for 2-23 hours", () => {
        vi.setSystemTime(new Date("2024-06-15T18:00:00Z"));
        expect(formatLastSeen(BASE)).toBe("6 hours ago");
    });

    it("returns '1 day ago' for exactly 24 hours", () => {
        vi.setSystemTime(new Date("2024-06-16T12:00:00Z"));
        expect(formatLastSeen(BASE)).toBe("1 day ago");
    });

    it("returns 'N days ago' for 2-6 days", () => {
        vi.setSystemTime(new Date("2024-06-18T12:00:00Z"));
        expect(formatLastSeen(BASE)).toBe("3 days ago");
    });

    it("returns '1 week ago' for exactly 7 days", () => {
        vi.setSystemTime(new Date("2024-06-22T12:00:00Z"));
        expect(formatLastSeen(BASE)).toBe("1 week ago");
    });

    it("returns 'N weeks ago' for 2+ weeks", () => {
        vi.setSystemTime(new Date("2024-06-29T12:00:00Z"));
        expect(formatLastSeen(BASE)).toBe("2 weeks ago");
    });
});

describe("formatAverageLap", () => {
    const laps = (...ms: number[]) => ms.map((timeMs) => ({ timeMs }));

    it("averages the laps and formats as m:ss.mmm", () => {
        // 90.000s and 92.000s average to 91.000s.
        expect(formatAverageLap(laps(90_000, 92_000))).toBe("1:31.000");
    });

    it("returns N/A for no laps rather than dividing by zero", () => {
        expect(formatAverageLap([])).toBe("N/A");
    });

    it("pads the seconds so a sub-ten-second remainder is not misread", () => {
        // 65.4s must render 1:05.400, not 1:5.400.
        expect(formatAverageLap(laps(65_400))).toBe("1:05.400");
    });

    it("keeps millisecond precision", () => {
        expect(formatAverageLap(laps(61_001, 61_003))).toBe("1:01.002");
    });

    it("handles a single lap", () => {
        expect(formatAverageLap(laps(123_456))).toBe("2:03.456");
    });

    it("handles an average under a minute", () => {
        expect(formatAverageLap(laps(9_500))).toBe("0:09.500");
    });
});
