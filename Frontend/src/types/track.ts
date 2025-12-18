export interface Track {
    file: string | number;
    name: string;
    authors: string;
    version: string;
    laps: string | number | null;
    wikiUrl?: string;
    youtubeUrl?: string | null;
}

export interface GroupedRetroTracks {
    [console: string]: Track[];
}

export interface TracksData {
    retro: GroupedRetroTracks;
    custom: Track[];
    battle: Track[];
}

export type TrackCategory = "retro" | "custom" | "battle";