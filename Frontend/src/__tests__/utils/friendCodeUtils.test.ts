import { describe, expect, it } from "vitest";
import { formatFriendCode, pidToFriendCode } from "../../utils/friendCodeUtils";

// Golden values derived from the actual MD5-based algorithm so that any
// regression in the checksum logic is caught immediately.
const FC_PID_0 = "2147-4836-4800";
const FC_PID_1 = "0214-7483-6481";
const FC_PID_100000 = "3049-4277-8016";

describe("pidToFriendCode", () => {
    it("returns the correct friend code for pid 0", () => {
        expect(pidToFriendCode(0)).toBe(FC_PID_0);
    });

    it("returns the correct friend code for pid 1", () => {
        expect(pidToFriendCode(1)).toBe(FC_PID_1);
    });

    it("returns the correct friend code for pid 100000", () => {
        expect(pidToFriendCode(100000)).toBe(FC_PID_100000);
    });

    it("returns a string in XXXX-XXXX-XXXX format", () => {
        const fc = pidToFriendCode(42);
        expect(fc).toMatch(/^\d{4}-\d{4}-\d{4}$/);
    });

    it("is deterministic — same pid always produces the same code", () => {
        expect(pidToFriendCode(12345)).toBe(pidToFriendCode(12345));
    });
});

describe("formatFriendCode", () => {
    it("formats a 12-digit string as XXXX-XXXX-XXXX", () => {
        expect(formatFriendCode("214748364800")).toBe("2147-4836-4800");
    });

    it("returns input unchanged when length is not 12", () => {
        expect(formatFriendCode("123")).toBe("123");
        expect(formatFriendCode("1234567890123")).toBe("1234567890123");
    });
});
