namespace RetroRewindWebsite.Helpers
{
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
            
            // Oceania
            { 36, "AU" },  // Australia
            { 554, "NZ" }, // New Zealand
            
            // Middle East
            { 784, "AE" }, // United Arab Emirates
            { 682, "SA" }, // Saudi Arabia
            { 376, "IL" }, // Israel
            { 792, "TR" }, // Turkey
            
            // Africa
            { 710, "ZA" }, // South Africa
            { 818, "EG" }, // Egypt
            
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
            
            // Oceania
            { "AU", "Australia" },
            { "NZ", "New Zealand" },
            
            // Middle East
            { "AE", "United Arab Emirates" },
            { "SA", "Saudi Arabia" },
            { "IL", "Israel" },
            { "TR", "Turkey" },
            
            // Africa
            { "ZA", "South Africa" },
            { "EG", "Egypt" },
            
            // Other
            { "RU", "Russia" },
            { "UA", "Ukraine" },
        };

        public static string? GetAlpha2Code(int numericCode)
        {
            return NumericToAlpha2.TryGetValue(numericCode, out var alpha2) ? alpha2 : null;
        }

        public static string? GetCountryName(int numericCode)
        {
            var alpha2 = GetAlpha2Code(numericCode);
            if (alpha2 == null) return null;

            return Alpha2ToName.TryGetValue(alpha2, out var name) ? name : null;
        }

        public static string? GetCountryName(string alpha2Code)
        {
            return Alpha2ToName.TryGetValue(alpha2Code.ToUpper(), out var name) ? name : null;
        }

        public static int? GetNumericCode(string alpha2Code)
        {
            var upper = alpha2Code.ToUpper();
            var entry = NumericToAlpha2.FirstOrDefault(x => x.Value == upper);
            return entry.Key == 0 ? null : entry.Key;
        }

        public static List<(int NumericCode, string Alpha2, string Name)> GetAllCountries()
        {
            return NumericToAlpha2
                .Select(kvp => (
                    NumericCode: kvp.Key,
                    Alpha2: kvp.Value,
                    Name: Alpha2ToName[kvp.Value]
                ))
                .OrderBy(x => x.Name)
                .ToList();
        }
    }
}