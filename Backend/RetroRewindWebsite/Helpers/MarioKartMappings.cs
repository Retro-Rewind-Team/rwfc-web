namespace RetroRewindWebsite.Helpers
{
    /// <summary>
    /// Helper class for mapping Mario Kart Wii game data IDs to human-readable names
    /// </summary>
    public static class MarioKartMappings
    {
        private static readonly Dictionary<short, string> _characters = new()
        {
            { 0x00, "Mario" },
            { 0x01, "Baby Peach" },
            { 0x02, "Waluigi" },
            { 0x03, "Bowser" },
            { 0x04, "Baby Daisy" },
            { 0x05, "Dry Bones" },
            { 0x06, "Baby Mario" },
            { 0x07, "Luigi" },
            { 0x08, "Toad" },
            { 0x09, "Donkey Kong" },
            { 0x0A, "Yoshi" },
            { 0x0B, "Wario" },
            { 0x0C, "Baby Luigi" },
            { 0x0D, "Toadette" },
            { 0x0E, "Koopa Troopa" },
            { 0x0F, "Daisy" },
            { 0x10, "Peach" },
            { 0x11, "Birdo" },
            { 0x12, "Diddy Kong" },
            { 0x13, "King Boo" },
            { 0x14, "Bowser Jr." },
            { 0x15, "Dry Bowser" },
            { 0x16, "Funky Kong" },
            { 0x17, "Rosalina" },
            { 0x18, "Small Mii Outfit A (Male)" },
            { 0x19, "Small Mii Outfit A (Female)" },
            { 0x1A, "Small Mii Outfit B (Male)" },
            { 0x1B, "Small Mii Outfit B (Female)" },
            { 0x1C, "Small Mii Outfit C (Male)" },
            { 0x1D, "Small Mii Outfit C (Female)" },
            { 0x1E, "Medium Mii Outfit A (Male)" },
            { 0x1F, "Medium Mii Outfit A (Female)" },
            { 0x20, "Medium Mii Outfit B (Male)" },
            { 0x21, "Medium Mii Outfit B (Female)" },
            { 0x22, "Medium Mii Outfit C (Male)" },
            { 0x23, "Medium Mii Outfit C (Female)" },
            { 0x24, "Large Mii Outfit A (Male)" },
            { 0x25, "Large Mii Outfit A (Female)" },
            { 0x26, "Large Mii Outfit B (Male)" },
            { 0x27, "Large Mii Outfit B (Female)" }
        };

        /// <summary>
        /// Gets the character name for a given character ID
        /// </summary>
        /// <param name="characterId">Character ID from ghost file</param>
        /// <returns>Character name or "Unknown Character ({id})" if not found</returns>
        public static string GetCharacterName(short characterId)
        {
            return _characters.TryGetValue(characterId, out var name) ? name : $"Unknown Character ({characterId})";
        }

        private static readonly Dictionary<short, string> _vehicles = new()
        {
            { 0x00, "Standard Kart S" },
            { 0x01, "Standard Kart M" },
            { 0x02, "Standard Kart L" },
            { 0x03, "Baby Booster" },
            { 0x04, "Classic Dragster" },
            { 0x05, "Offroader" },
            { 0x06, "Mini Beast" },
            { 0x07, "Wild Wing" },
            { 0x08, "Flame Flyer" },
            { 0x09, "Cheep Charger" },
            { 0x0A, "Super Blooper" },
            { 0x0B, "Piranha Prowler" },
            { 0x0C, "Tiny Titan" },
            { 0x0D, "Daytripper" },
            { 0x0E, "Jetsetter" },
            { 0x0F, "Blue Falcon" },
            { 0x10, "Sprinter" },
            { 0x11, "Honeycoupe" },
            { 0x12, "Standard Bike S" },
            { 0x13, "Standard Bike M" },
            { 0x14, "Standard Bike L" },
            { 0x15, "Bullet Bike" },
            { 0x16, "Mach Bike" },
            { 0x17, "Flame Runner" },
            { 0x18, "Bit Bike" },
            { 0x19, "Sugarscoot" },
            { 0x1A, "Wario Bike" },
            { 0x1B, "Quacker" },
            { 0x1C, "Zip Zip" },
            { 0x1D, "Shooting Star" },
            { 0x1E, "Magikruiser" },
            { 0x1F, "Sneakster" },
            { 0x20, "Spear" },
            { 0x21, "Jet Bubble" },
            { 0x22, "Dolphin Dasher" },
            { 0x23, "Phantom" }
        };

        /// <summary>
        /// Gets the vehicle name for a given vehicle ID
        /// </summary>
        /// <param name="vehicleId">Vehicle ID from ghost file</param>
        /// <returns>Vehicle name or "Unknown Vehicle ({id})" if not found</returns>
        public static string GetVehicleName(short vehicleId)
        {
            return _vehicles.TryGetValue(vehicleId, out var name) ? name : $"Unknown Vehicle ({vehicleId})";
        }

        private static readonly Dictionary<short, string> _controllers = new()
        {
            { 0, "Wii Wheel" },
            { 1, "Nunchuk" },
            { 2, "Classic Controller" },
            { 3, "GameCube Controller" }
        };

        /// <summary>
        /// Gets the controller name for a given controller type ID
        /// </summary>
        /// <param name="controllerId">Controller type ID from ghost file</param>
        /// <returns>Controller name or "Unknown Controller ({id})" if not found</returns>
        public static string GetControllerName(short controllerId)
        {
            return _controllers.TryGetValue(controllerId, out var name) ? name : $"Unknown Controller ({controllerId})";
        }

        private static readonly Dictionary<short, string> _driftTypes = new()
        {
            { 0, "Manual" },
            { 1, "Hybrid" }
        };

        /// <summary>
        /// Gets the drift type name for a given drift type ID
        /// </summary>
        /// <param name="driftTypeId">Drift type ID from ghost file (0=Manual, 1=Hybrid)</param>
        /// <returns>Drift type name or "Unknown Drift Type ({id})" if not found</returns>
        public static string GetDriftTypeName(short driftTypeId)
        {
            return _driftTypes.TryGetValue(driftTypeId, out var name) ? name : $"Unknown Drift Type ({driftTypeId})";
        }

        private static readonly Dictionary<short, string> _trackSlots = new()
        {
            { 0, "Mario Circuit" },
            { 1, "Moo Moo Meadows" },
            { 2, "Mushroom Gorge" },
            { 3, "Grumble Volcano" },
            { 4, "Toad's Factory" },
            { 5, "Coconut Mall" },
            { 6, "DK Summit" },
            { 7, "Wario's Gold Mine" },
            { 8, "Luigi Circuit" },
            { 9, "Daisy Circuit" },
            { 10, "Moonview Highway" },
            { 11, "Maple Treeway" },
            { 12, "Bowser's Castle" },
            { 13, "Rainbow Road" },
            { 14, "Dry Dry Ruins" },
            { 15, "Koopa Cape" },
            { 16, "GCN Peach Beach" },
            { 17, "GCN Mario Circuit" },
            { 18, "GCN Waluigi Stadium" },
            { 19, "GCN DK Mountain" },
            { 20, "DS Yoshi Falls" },
            { 21, "DS Desert Hills" },
            { 22, "DS Peach Gardens" },
            { 23, "DS Delfino Square" },
            { 24, "SNES Mario Circuit 3" },
            { 25, "SNES Ghost Valley 2" },
            { 26, "N64 Mario Raceway" },
            { 27, "N64 Sherbet Land" },
            { 28, "N64 Bowser's Castle" },
            { 29, "N64 DK's Jungle Parkway" },
            { 30, "GBA Bowser Castle 3" },
            { 31, "GBA Shy Guy Beach" }
        };

        /// <summary>
        /// Gets the track slot name for a given course ID
        /// </summary>
        /// <param name="courseId">Course ID from ghost file (track slot identifier)</param>
        /// <returns>Track name or null if not found</returns>
        public static string? GetTrackSlotName(short courseId)
        {
            return _trackSlots.TryGetValue(courseId, out var name) ? name : null;
        }
    }
}