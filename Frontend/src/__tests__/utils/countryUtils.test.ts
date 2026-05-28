import { describe, expect, it } from "vitest";
import { getCountryFlag, getCountryName } from "../../utils/countryUtils";

describe("getCountryFlag", () => {
    it("returns the US flag emoji for 'US'", () => {
        expect(getCountryFlag("US")).toBe("🇺🇸");
    });

    it("returns the JP flag emoji for 'JP'", () => {
        expect(getCountryFlag("JP")).toBe("🇯🇵");
    });

    it("is case-insensitive — lowercase code produces the same flag", () => {
        expect(getCountryFlag("us")).toBe(getCountryFlag("US"));
    });

    it("returns the globe emoji for null", () => {
        expect(getCountryFlag(null)).toBe("🌐");
    });

    it("returns the globe emoji for undefined", () => {
        expect(getCountryFlag(undefined)).toBe("🌐");
    });

    it("returns the globe emoji for a code that is not 2 characters", () => {
        expect(getCountryFlag("USA")).toBe("🌐");
        expect(getCountryFlag("")).toBe("🌐");
    });
});

describe("getCountryName", () => {
    it("returns 'Netherlands' for 'NL'", () => {
        expect(getCountryName("NL")).toBe("Netherlands");
    });

    it("returns 'United States' for 'US'", () => {
        expect(getCountryName("US")).toBe("United States");
    });

    it("returns the uppercased code for an unknown country", () => {
        expect(getCountryName("ZZ")).toBe("ZZ");
    });

    it("returns 'Unknown' for null", () => {
        expect(getCountryName(null)).toBe("Unknown");
    });

    it("returns 'Unknown' for undefined", () => {
        expect(getCountryName(undefined)).toBe("Unknown");
    });

    it("is case-insensitive for known codes", () => {
        expect(getCountryName("nl")).toBe("Netherlands");
    });
});
