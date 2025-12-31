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