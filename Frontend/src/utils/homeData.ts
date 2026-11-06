import type { Room, Track } from "../types";

/*
 * Pure helpers behind the home page. Kept out of the components so they can be unit tested
 * without rendering anything.
 */

/**
 * Track names start with the console they came from ("SNES Mario Circuit 1"). Only prefixes in
 * this map are split out; anything else is treated as part of the name.
 */
export const TRACK_ORIGINS: Record<string, string> = {
    SNES: "Super Mario Kart",
    N64: "Mario Kart 64",
    GBA: "Mario Kart: Super Circuit",
    GCN: "Mario Kart: Double Dash!!",
    DS: "Mario Kart DS",
    Wii: "Mario Kart Wii",
    "3DS": "Mario Kart 7",
    SW: "Mario Kart 8 Deluxe",
    Tour: "Mario Kart Tour",
    GP: "Mario Kart Arcade GP",
    SW2: "Mario Kart World",
};

export interface TrackLabel {
    origin: string | null;
    name: string;
}

export function splitTrackName(fullName: string): TrackLabel {
    const space = fullName.indexOf(" ");
    if (space > 0) {
        const prefix = fullName.slice(0, space);
        if (prefix in TRACK_ORIGINS) {
            return { origin: prefix, name: fullName.slice(space + 1) };
        }
    }
    return { origin: null, name: fullName };
}

/** Consoles shown in the hero sample, oldest first, so the list reads as a walk through the series. */
const SAMPLE_ORIGINS = ["SNES", "N64", "GBA", "GCN", "DS", "3DS", "Tour", "SW2"];

/**
 * A stable sample of real track names: the first visible track from each console in
 * SAMPLE_ORIGINS, then the first few custom tracks. Stable, not random, so the hero does not
 * reshuffle between visits.
 */
export function pickTrackSample(tracks: Track[], customCount = 2): Track[] {
    const visible = tracks.filter((t) => !t.isHidden).sort((a, b) => a.sortOrder - b.sortOrder);
    const sample: Track[] = [];

    for (const origin of SAMPLE_ORIGINS) {
        const match = visible.find(
            (t) => t.category === "retro" && splitTrackName(t.name).origin === origin,
        );
        if (match) sample.push(match);
    }

    sample.push(...visible.filter((t) => t.category === "custom").slice(0, customCount));
    return sample;
}

/**
 * An even spread of real track names for the hero ticker: every nth visible track in list order,
 * so it walks from Super Mario Kart through to the custom tracks.
 */
export function pickTickerTracks(tracks: Track[], count = 28): Track[] {
    const visible = tracks.filter((t) => !t.isHidden).sort((a, b) => a.sortOrder - b.sortOrder);
    if (visible.length <= count) return visible;
    const step = visible.length / count;
    return Array.from({ length: count }, (_, i) => visible[Math.floor(i * step)]);
}

export interface TrackCounts {
    retro: number;
    custom: number;
    total: number;
}

export function countTracks(tracks: Track[]): TrackCounts {
    const visible = tracks.filter((t) => !t.isHidden);
    const retro = visible.filter((t) => t.category === "retro").length;
    const custom = visible.filter((t) => t.category === "custom").length;
    return { retro, custom, total: retro + custom };
}

/** The busiest public rooms that have someone in them, most players first. */
export function busiestPublicRooms(rooms: Room[], limit = 5): Room[] {
    return rooms
        .filter((room) => room.isPublic && room.players.length > 0)
        .sort((a, b) => b.players.length - a.players.length)
        .slice(0, limit);
}

/** "4 minutes ago", "just now". Plain wording so a snapshot's age is obvious at a glance. */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
    const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
    if (Math.abs(seconds) < 45) return "just now";

    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const minutes = Math.round(seconds / 60);
    if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
    return rtf.format(Math.round(hours / 24), "day");
}
