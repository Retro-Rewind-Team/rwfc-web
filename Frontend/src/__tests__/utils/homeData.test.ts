import { describe, expect, it } from "vitest";
import type { Room, Track } from "../../types";
import {
    busiestPublicRooms,
    countTracks,
    formatRelativeTime,
    pickTickerTracks,
    pickTrackSample,
    splitTrackName,
} from "../../utils/homeData";
import { detectPlatform } from "../../constants/platformGuides";

const track = (id: number, name: string, category: "retro" | "custom", isHidden = false) =>
    ({
        id,
        name,
        category,
        isHidden,
        sortOrder: id,
        courseId: id,
        laps: 3,
        supportsGlitch: false,
    }) as Track;

const room = (id: string, players: number, isPublic = true) =>
    ({ id, isPublic, players: Array.from({ length: players }) }) as unknown as Room;

describe("splitTrackName", () => {
    it("splits a known console prefix from the name", () => {
        expect(splitTrackName("SNES Mario Circuit 1")).toEqual({
            origin: "SNES",
            name: "Mario Circuit 1",
        });
    });

    it("leaves names without a known prefix whole", () => {
        // "Bowser's Termination Station" starts with a word, not a console.
        expect(splitTrackName("Bowser's Termination Station")).toEqual({
            origin: null,
            name: "Bowser's Termination Station",
        });
    });
});

describe("pickTrackSample", () => {
    const tracks = [
        track(1, "SNES Mario Circuit 1", "retro"),
        track(2, "SNES Donut Plains 1", "retro"),
        track(3, "N64 Luigi Raceway", "retro", true),
        track(4, "N64 Moo Moo Farm", "retro"),
        track(5, "Phendrana Frostbite", "custom"),
        track(6, "Honeymoon Lune", "custom"),
        track(7, "Poke Floats", "custom"),
    ];

    it("takes the first visible retro track per console, then custom tracks", () => {
        expect(pickTrackSample(tracks).map((t) => t.name)).toEqual([
            "SNES Mario Circuit 1",
            "N64 Moo Moo Farm",
            "Phendrana Frostbite",
            "Honeymoon Lune",
        ]);
    });

    it("counts only visible tracks", () => {
        expect(countTracks(tracks)).toEqual({ retro: 3, custom: 3, total: 6 });
    });
});

describe("busiestPublicRooms", () => {
    it("drops private and empty rooms and sorts by player count", () => {
        const rooms = [room("a", 4), room("b", 0), room("c", 12), room("d", 9, false)];
        expect(busiestPublicRooms(rooms).map((r) => r.id)).toEqual(["c", "a"]);
    });
});

describe("formatRelativeTime", () => {
    const now = new Date("2026-01-01T12:00:00Z");

    it("says just now for very recent times", () => {
        expect(formatRelativeTime("2026-01-01T11:59:40Z", now)).toBe("just now");
    });

    it("uses minutes, then hours", () => {
        expect(formatRelativeTime("2026-01-01T11:55:00Z", now)).toBe("5 minutes ago");
        expect(formatRelativeTime("2026-01-01T09:00:00Z", now)).toBe("3 hours ago");
    });
});

describe("detectPlatform", () => {
    it.each([
        ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", "ios"],
        ["Mozilla/5.0 (Linux; Android 14; Pixel 8)", "android"],
        ["Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)", "macos"],
        ["Mozilla/5.0 (X11; Linux x86_64)", "linux"],
        ["Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "pc"],
        ["SomethingElse/1.0", "wii"],
    ])("maps %s to %s", (ua, expected) => {
        expect(detectPlatform(ua)).toBe(expected);
    });
});

describe("pickTickerTracks", () => {
    const many = Array.from({ length: 100 }, (_, i) =>
        track(i, `Track ${i}`, i < 60 ? "retro" : "custom", i === 0),
    );

    it("spreads evenly across the visible list and skips hidden tracks", () => {
        const picked = pickTickerTracks(many, 10);
        expect(picked).toHaveLength(10);
        expect(picked.some((t) => t.isHidden)).toBe(false);
        expect(picked.at(-1)?.category).toBe("custom");
    });

    it("returns everything when there are fewer tracks than requested", () => {
        expect(pickTickerTracks(many.slice(1, 5), 10)).toHaveLength(4);
    });
});
