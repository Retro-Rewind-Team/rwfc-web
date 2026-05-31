export interface Track {
    id: number;
    name: string;
    courseId: number;
    sortOrder: number;
    category: "retro" | "custom";
    laps: number;
    supportsGlitch: boolean;
    isHidden: boolean;
}

export interface TTProfile {
    id: number;
    displayName: string;
    totalSubmissions: number;
    currentWorldRecords: number;
    countryCode: number;
    countryAlpha2: string | null;
    countryName: string | null;
}

export interface GhostSubmission {
    id: number;
    trackId: number;
    trackName: string;
    ttProfileId: number;
    playerName: string;
    countryCode: number;
    countryAlpha2: string | null;
    countryName: string | null;
    cc: 150 | 200;
    finishTimeMs: number;
    finishTimeDisplay: string;
    vehicleId: number;
    characterId: number;
    controllerType: number;
    driftType: number; // 0 = Manual, 1 = Hybrid
    driftCategory: number; // 0 = Inside, 1 = Outside
    shroomless: boolean;
    glitch: boolean;
    isFlap: boolean;
    miiName: string;
    lapCount: number;
    lapSplitsMs: number[];
    lapSplitsDisplay: string[];
    fastestLapMs: number;
    fastestLapDisplay: string;
    dateSet: string;
    submittedAt: string;
    rank: number | null;
}

export interface TrackLeaderboard {
    track: Track;
    cc: 150 | 200;
    glitchAllowed: boolean;
    shroomless: boolean | null;
    vehicleFilter: string | null;
    isFlap: boolean;
    submissions: GhostSubmission[];
    totalSubmissions: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
    fastestLapMs: number | null;
    fastestLapDisplay: string | null;
}

export interface TrackFlap {
    fastestLapMs: number;
}

export interface TrackWorldRecords {
    trackId: number;
    activeWorldRecord: GhostSubmission | null;
}

export interface PagedSubmissions {
    submissions: GhostSubmission[];
    totalSubmissions: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
}

export interface TTPlayerStats {
    profile: TTProfile;
    totalTracks: number;
    tracks150cc: number;
    tracks200cc: number;
    averageFinishPosition: number;
}

export type VehicleFilter = "all" | "karts" | "bikes";
export type ShroomlessFilter = "all" | "only" | "exclude";
export type DriftFilter = "all" | "manual" | "hybrid";
export type DriftCategoryFilter = "all" | "inside" | "outside";

export type LeaderboardMode = "regular" | "flap";

export interface TTPlayerRanking {
    rank: number;
    ttProfileId: number;
    displayName: string;
    countryAlpha2: string | null;
    countryName: string | null;
    worldRecordCount: number;
}

export interface TTPlayerRankings {
    players: TTPlayerRanking[];
    totalPlayers: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
}

export type TrackCategoryFilter = "all" | "retro" | "custom";
