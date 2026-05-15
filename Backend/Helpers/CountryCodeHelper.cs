namespace RetroRewindWebsite.Helpers;

/// <summary>
/// Helper class for converting between ISO 3166-1 country codes
/// </summary>
public static class CountryCodeHelper
{
    // ISO 3166-1 numeric to alpha-2 mapping (most common countries)
    private static readonly Dictionary<int, string> NumericToAlpha2 = new()
    {
        // Europe
        { 276, "DE" }, // Germany
        { 250, "FR" }, // France
        { 826, "GB" }, // United Kingdom
        { 380, "IT" }, // Italy
        { 724, "ES" }, // Spain
        { 528, "NL" }, // Netherlands
        { 56, "BE" },  // Belgium
        { 40, "AT" },  // Austria
        { 756, "CH" }, // Switzerland
        { 616, "PL" }, // Poland
        { 203, "CZ" }, // Czech Republic
        { 348, "HU" }, // Hungary
        { 642, "RO" }, // Romania
        { 752, "SE" }, // Sweden
        { 578, "NO" }, // Norway
        { 208, "DK" }, // Denmark
        { 246, "FI" }, // Finland
        { 372, "IE" }, // Ireland
        { 620, "PT" }, // Portugal
        { 300, "GR" }, // Greece
        { 470, "MT" }, // Malta
        { 442, "LU" }, // Luxembourg
        { 703, "SK" }, // Slovakia
        { 705, "SI" }, // Slovenia
        { 191, "HR" }, // Croatia
        { 100, "BG" }, // Bulgaria
        { 688, "RS" }, // Serbia
        { 70, "BA" },  // Bosnia and Herzegovina
        { 499, "ME" }, // Montenegro
        { 807, "MK" }, // North Macedonia
        { 8, "AL" },   // Albania
        { 440, "LT" }, // Lithuania
        { 428, "LV" }, // Latvia
        { 233, "EE" }, // Estonia
        { 352, "IS" }, // Iceland
        { 196, "CY" }, // Cyprus
        { 498, "MD" }, // Moldova
        { 112, "BY" }, // Belarus
        { 268, "GE" }, // Georgia
        { 51, "AM" },  // Armenia
        { 31, "AZ" },  // Azerbaijan
        { 438, "LI" }, // Liechtenstein
        { 492, "MC" }, // Monaco
        { 674, "SM" }, // San Marino
        { 20, "AD" },  // Andorra
        { 234, "FO" }, // Faroe Islands

        // Americas
        { 840, "US" }, // United States
        { 124, "CA" }, // Canada
        { 484, "MX" }, // Mexico
        { 76, "BR" },  // Brazil
        { 32, "AR" },  // Argentina
        { 152, "CL" }, // Chile
        { 170, "CO" }, // Colombia
        { 604, "PE" }, // Peru
        { 862, "VE" }, // Venezuela
        { 68, "BO" },  // Bolivia
        { 218, "EC" }, // Ecuador
        { 600, "PY" }, // Paraguay
        { 858, "UY" }, // Uruguay
        { 188, "CR" }, // Costa Rica
        { 320, "GT" }, // Guatemala
        { 591, "PA" }, // Panama
        { 214, "DO" }, // Dominican Republic
        { 630, "PR" }, // Puerto Rico
        { 192, "CU" }, // Cuba
        { 388, "JM" }, // Jamaica
        { 340, "HN" }, // Honduras
        { 222, "SV" }, // El Salvador
        { 332, "HT" }, // Haiti
        { 558, "NI" }, // Nicaragua
        { 780, "TT" }, // Trinidad and Tobago

        // Asia
        { 392, "JP" }, // Japan
        { 156, "CN" }, // China
        { 410, "KR" }, // South Korea
        { 158, "TW" }, // Taiwan
        { 344, "HK" }, // Hong Kong
        { 702, "SG" }, // Singapore
        { 764, "TH" }, // Thailand
        { 704, "VN" }, // Vietnam
        { 458, "MY" }, // Malaysia
        { 360, "ID" }, // Indonesia
        { 608, "PH" }, // Philippines
        { 356, "IN" }, // India
        { 586, "PK" }, // Pakistan
        { 50, "BD" },  // Bangladesh
        { 144, "LK" }, // Sri Lanka
        { 524, "NP" }, // Nepal
        { 398, "KZ" }, // Kazakhstan
        { 104, "MM" }, // Myanmar
        { 860, "UZ" }, // Uzbekistan

        // Oceania
        { 36, "AU" },  // Australia
        { 554, "NZ" }, // New Zealand
        { 242, "FJ" }, // Fiji
        { 598, "PG" }, // Papua New Guinea

        // Middle East
        { 784, "AE" }, // United Arab Emirates
        { 682, "SA" }, // Saudi Arabia
        { 376, "IL" }, // Israel
        { 792, "TR" }, // Turkey
        { 364, "IR" }, // Iran
        { 368, "IQ" }, // Iraq
        { 400, "JO" }, // Jordan
        { 414, "KW" }, // Kuwait
        { 634, "QA" }, // Qatar
        { 48, "BH" },  // Bahrain
        { 512, "OM" }, // Oman
        { 422, "LB" }, // Lebanon

        // Africa
        { 710, "ZA" }, // South Africa
        { 818, "EG" }, // Egypt
        { 566, "NG" }, // Nigeria
        { 404, "KE" }, // Kenya
        { 504, "MA" }, // Morocco
        { 288, "GH" }, // Ghana
        { 231, "ET" }, // Ethiopia
        { 788, "TN" }, // Tunisia
        { 12, "DZ" },  // Algeria
        { 834, "TZ" }, // Tanzania
        { 120, "CM" }, // Cameroon
        { 384, "CI" }, // Ivory Coast
        { 686, "SN" }, // Senegal
        { 800, "UG" }, // Uganda
        { 716, "ZW" }, // Zimbabwe
        { 24, "AO" },  // Angola

        // Other
        { 643, "RU" }, // Russia
        { 804, "UA" }, // Ukraine
    };

    // Alpha-2 to country name mapping
    private static readonly Dictionary<string, string> Alpha2ToName = new()
    {
        // Europe
        { "DE", "Germany" },
        { "FR", "France" },
        { "GB", "United Kingdom" },
        { "IT", "Italy" },
        { "ES", "Spain" },
        { "NL", "Netherlands" },
        { "BE", "Belgium" },
        { "AT", "Austria" },
        { "CH", "Switzerland" },
        { "PL", "Poland" },
        { "CZ", "Czech Republic" },
        { "HU", "Hungary" },
        { "RO", "Romania" },
        { "SE", "Sweden" },
        { "NO", "Norway" },
        { "DK", "Denmark" },
        { "FI", "Finland" },
        { "IE", "Ireland" },
        { "PT", "Portugal" },
        { "GR", "Greece" },
        { "MT", "Malta" },
        { "LU", "Luxembourg" },
        { "SK", "Slovakia" },
        { "SI", "Slovenia" },
        { "HR", "Croatia" },
        { "BG", "Bulgaria" },
        { "RS", "Serbia" },
        { "BA", "Bosnia and Herzegovina" },
        { "ME", "Montenegro" },
        { "MK", "North Macedonia" },
        { "AL", "Albania" },
        { "LT", "Lithuania" },
        { "LV", "Latvia" },
        { "EE", "Estonia" },
        { "IS", "Iceland" },
        { "CY", "Cyprus" },
        { "MD", "Moldova" },
        { "BY", "Belarus" },
        { "GE", "Georgia" },
        { "AM", "Armenia" },
        { "AZ", "Azerbaijan" },
        { "LI", "Liechtenstein" },
        { "MC", "Monaco" },
        { "SM", "San Marino" },
        { "AD", "Andorra" },
        { "FO", "Faroe Islands" },

        // Americas
        { "US", "United States" },
        { "CA", "Canada" },
        { "MX", "Mexico" },
        { "BR", "Brazil" },
        { "AR", "Argentina" },
        { "CL", "Chile" },
        { "CO", "Colombia" },
        { "PE", "Peru" },
        { "VE", "Venezuela" },
        { "BO", "Bolivia" },
        { "EC", "Ecuador" },
        { "PY", "Paraguay" },
        { "UY", "Uruguay" },
        { "CR", "Costa Rica" },
        { "GT", "Guatemala" },
        { "PA", "Panama" },
        { "DO", "Dominican Republic" },
        { "PR", "Puerto Rico" },
        { "CU", "Cuba" },
        { "JM", "Jamaica" },
        { "HN", "Honduras" },
        { "SV", "El Salvador" },
        { "HT", "Haiti" },
        { "NI", "Nicaragua" },
        { "TT", "Trinidad and Tobago" },

        // Asia
        { "JP", "Japan" },
        { "CN", "China" },
        { "KR", "South Korea" },
        { "TW", "Taiwan" },
        { "HK", "Hong Kong" },
        { "SG", "Singapore" },
        { "TH", "Thailand" },
        { "VN", "Vietnam" },
        { "MY", "Malaysia" },
        { "ID", "Indonesia" },
        { "PH", "Philippines" },
        { "IN", "India" },
        { "PK", "Pakistan" },
        { "BD", "Bangladesh" },
        { "LK", "Sri Lanka" },
        { "NP", "Nepal" },
        { "KZ", "Kazakhstan" },
        { "MM", "Myanmar" },
        { "UZ", "Uzbekistan" },

        // Oceania
        { "AU", "Australia" },
        { "NZ", "New Zealand" },
        { "FJ", "Fiji" },
        { "PG", "Papua New Guinea" },

        // Middle East
        { "AE", "United Arab Emirates" },
        { "SA", "Saudi Arabia" },
        { "IL", "Israel" },
        { "TR", "Turkey" },
        { "IR", "Iran" },
        { "IQ", "Iraq" },
        { "JO", "Jordan" },
        { "KW", "Kuwait" },
        { "QA", "Qatar" },
        { "BH", "Bahrain" },
        { "OM", "Oman" },
        { "LB", "Lebanon" },

        // Africa
        { "ZA", "South Africa" },
        { "EG", "Egypt" },
        { "NG", "Nigeria" },
        { "KE", "Kenya" },
        { "MA", "Morocco" },
        { "GH", "Ghana" },
        { "ET", "Ethiopia" },
        { "TN", "Tunisia" },
        { "DZ", "Algeria" },
        { "TZ", "Tanzania" },
        { "CM", "Cameroon" },
        { "CI", "Ivory Coast" },
        { "SN", "Senegal" },
        { "UG", "Uganda" },
        { "ZW", "Zimbabwe" },
        { "AO", "Angola" },

        // Other
        { "RU", "Russia" },
        { "UA", "Ukraine" },
    };

    /// <summary>
    /// Converts ISO 3166-1 numeric code to alpha-2 code
    /// </summary>
    /// <param name="numericCode">Numeric country code (e.g., 840 for United States)</param>
    /// <returns>Two-letter alpha-2 code (e.g., "US") or null if not found</returns>
    public static string? GetAlpha2Code(int numericCode)
    {
        return NumericToAlpha2.TryGetValue(numericCode, out var alpha2) ? alpha2 : null;
    }

    /// <summary>
    /// Converts ISO 3166-1 numeric code to country name
    /// </summary>
    /// <param name="numericCode">Numeric country code</param>
    /// <returns>Country name or null if not found</returns>
    public static string? GetCountryName(int numericCode)
    {
        var alpha2 = GetAlpha2Code(numericCode);
        if (alpha2 == null) return null;

        return Alpha2ToName.TryGetValue(alpha2, out var name) ? name : null;
    }

    /// <summary>
    /// Converts alpha-2 code to country name
    /// </summary>
    /// <param name="alpha2Code">Two-letter country code (case-insensitive)</param>
    /// <returns>Country name or null if not found</returns>
    public static string? GetCountryName(string alpha2Code)
    {
        return Alpha2ToName.TryGetValue(alpha2Code.ToUpper(), out var name) ? name : null;
    }

    /// <summary>
    /// Converts alpha-2 code to numeric code
    /// </summary>
    /// <param name="alpha2Code">Two-letter country code (case-insensitive)</param>
    /// <returns>Numeric country code or null if not found</returns>
    public static int? GetNumericCode(string alpha2Code)
    {
        var upper = alpha2Code.ToUpper();
        var entry = NumericToAlpha2.FirstOrDefault(x => x.Value == upper);
        return entry.Key == 0 ? null : entry.Key;
    }

    /// <summary>
    /// Gets all available countries sorted by name
    /// </summary>
    /// <returns>List of tuples containing (NumericCode, Alpha2, Name)</returns>
    public static List<(int NumericCode, string Alpha2, string Name)> GetAllCountries()
    {
        return [.. NumericToAlpha2
            .Select(kvp => (
                NumericCode: kvp.Key,
                Alpha2: kvp.Value,
                Name: Alpha2ToName[kvp.Value]
            ))
            .OrderBy(x => x.Name)];
    }
}
