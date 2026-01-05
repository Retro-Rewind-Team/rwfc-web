namespace RetroRewindWebsite.Helpers
{
    /// <summary>
    /// Provides helper methods for determining whether a track supports the glitch or shortcut category and for
    /// retrieving the list of such tracks.
    /// </summary>
    public static class TrackGlitchHelper
    {
        // Tracks that support glitch/shortcut category
        private static readonly HashSet<string> GlitchSupportedTracks = new(StringComparer.OrdinalIgnoreCase)
        {
            // Retro Tracks
            "GBA Bowser Castle 3",
            "GBA Broken Pier",
            "GCN DK Mountain",
            "DS Desert Hills",
            "Wii Toad's Factory",
            "Wii Grumble Volcano",
            "Wii Bowser's Castle",
            "Wii U Electrodrome",
            "Wii U Bone-Dry Dunes",
            "Tour Boo Lake",
            "Tour Cheep-Cheep Island",
            "Tour Snow Land",
            "SW2 Faraway Oasis",
            // Custom Tracks
            "Confectionery Cliffs",
            "WP Tanks!",
            "Sunrise Slopes",
            "Hell's Dimension",
            "Botania"
        };

        public static bool SupportsGlitch(string trackName)
        {
            return GlitchSupportedTracks.Contains(trackName);
        }

        public static HashSet<string> GetAllGlitchSupportedTracks()
        {
            return new HashSet<string>(GlitchSupportedTracks, StringComparer.OrdinalIgnoreCase);
        }
    }
}