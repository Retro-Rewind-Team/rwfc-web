/**
 * Centralised TanStack Query key factory. Using these ensures key consistency
 * across hooks and pages, and makes targeted cache invalidation straightforward.
 */
export const queryKeys = {
    stats: ["stats"] as const,
    discordMembers: ["discord-members"] as const,
    rrVersion: ["rr-version"] as const,

    leaderboard: (request: object) => ["leaderboard", request] as const,
    legacyAvailable: ["legacyAvailable"] as const,
    legacyLeaderboard: (request: object) => ["legacyLeaderboard", request] as const,

    player: (friendCode: string) => ["player", friendCode] as const,
    legacyPlayer: (friendCode: string) => ["legacyPlayer", friendCode] as const,

    globalRaceStats: (days: number | undefined) => ["global-race-stats", days] as const,
    playerRaceStats: (
        pid: string | undefined,
        days: number | undefined,
        courseId: number | undefined,
        page: number,
    ) => ["player-race-stats", pid, days, courseId, page] as const,

    roomStats: ["roomStatus", "stats"] as const,
    room: (id: number | undefined) => ["roomStatus", id] as const,

    ttTracks: ["tt-tracks"] as const,
    ttWorldRecordsAll: (cc: number, glitch: boolean, shroomless: string, vehicle: string) =>
        ["tt-world-records-all", cc, glitch, shroomless, vehicle] as const,
    ttTrack: (trackId: number) => ["tt-track", trackId] as const,
    ttLeaderboard: (
        trackId: number,
        cc: number,
        glitch: boolean,
        mode: string,
        shroomless: string,
        vehicle: string,
        page: number,
        pageSize: number,
    ) =>
        ["tt-leaderboard", trackId, cc, glitch, mode, shroomless, vehicle, page, pageSize] as const,
    ttFlap: (trackId: number, cc: number, glitch: boolean, shroomless: string, vehicle: string) =>
        ["tt-flap", trackId, cc, glitch, shroomless, vehicle] as const,
    ttWrHistory: (
        trackId: number,
        cc: number,
        glitch: boolean,
        shroomless: string,
        vehicle: string,
    ) => ["tt-wr-history", trackId, cc, glitch, shroomless, vehicle] as const,
    ttFlapWrHistory: (
        trackId: number,
        cc: number,
        glitch: boolean,
        shroomless: string,
        vehicle: string,
    ) => ["tt-flap-wr-history", trackId, cc, glitch, shroomless, vehicle] as const,
    ttProfile: (id: number) => ["tt-profile", id] as const,
    ttProfileSubmissions: (
        id: number,
        page: number,
        pageSize: number,
        cc: number | undefined,
        glitch: boolean | undefined,
        shroomless: string,
        vehicle: string,
    ) => ["tt-profile-submissions", id, page, pageSize, cc, glitch, shroomless, vehicle] as const,
    ttProfileStats: (id: number) => ["tt-profile-stats", id] as const,
} as const;
