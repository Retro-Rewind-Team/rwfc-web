/**
 * Converts an ISO 3166-1 alpha-2 country code to a flag emoji.
 * Uses regional indicator symbols (U+1F1E6 onward) so the emoji renders as a flag
 * on platforms that support it. Returns the globe emoji for invalid or missing codes.
 * @param alpha2Code - Two-letter country code (e.g. "NL", "US").
 */
export const getCountryFlag = (alpha2Code: string | null | undefined): string => {
    if (!alpha2Code || alpha2Code.length !== 2) return "🌐";

    // Convert alpha-2 code to flag emoji
    // A = U+1F1E6, B = U+1F1E7, etc.
    const codePoints = alpha2Code
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt(0));

    return String.fromCodePoint(...codePoints);
};

/**
 * Returns a human-readable country name for an ISO 3166-1 alpha-2 code.
 * Falls back to the uppercased code itself when the code is not in the built-in map.
 * Returns "Unknown" when the input is null, undefined, or an empty string.
 * @param alpha2Code - Two-letter country code (e.g. "NL", "US").
 */
export const getCountryName = (alpha2Code: string | null | undefined): string => {
    if (!alpha2Code) return "Unknown";

    // Fallback mapping for some common countries
    const names: Record<string, string> = {
        NL: "Netherlands",
        US: "United States",
        GB: "United Kingdom",
        DE: "Germany",
        FR: "France",
        JP: "Japan",
    };

    return names[alpha2Code.toUpperCase()] || alpha2Code.toUpperCase();
};
