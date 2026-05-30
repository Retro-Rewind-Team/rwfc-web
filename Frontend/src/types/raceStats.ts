export interface TrackPlayCount {
    trackName: string;
    raceCount: number;
    courseId: number;
}

export interface RecentRace {
    trackName: string;
    courseId: number;
    finishTimeDisplay: string;
    characterName: string;
    vehicleName: string;
    timestamp: string;
    finishPos: number | null;
    playerCount: number;
    roomId: string;
    raceNumber: number;
}

export interface SetupEntry {
    name: string;
    raceCount: number;
}

export interface PlayerRaceStats {
    totalRaces: number;
    trackedSince: string;
    topTracks: TrackPlayCount[];
    topCharacters: SetupEntry[];
    topVehicles: SetupEntry[];
    topCombos: SetupEntry[];
    totalFramesIn1st: number;
    avgFramesIn1stPerRace: number;
    recentRaces: RecentRace[];
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalRecentRaces: number;
}

export interface ActivePlayer {
    name: string;
    pid: string;
    fc: string;
    raceCount: number;
}

export interface DayActivity {
    dayName: string;
    raceCount: number;
}

export interface HourActivity {
    hour: number;
    raceCount: number;
}

export interface GlobalRaceStats {
    totalRacesTracked: number;
    uniquePlayersCount: number;
    trackedSince: string;
    allPlayedTracks: TrackPlayCount[];
    topCharacters: SetupEntry[];
    topVehicles: SetupEntry[];
    topCombos: SetupEntry[];
    mostActivePlayers: ActivePlayer[];
    racesByDayOfWeek: DayActivity[];
    racesByHour: HourActivity[];
}

export interface PositionCount {
    position: number;
    count: number;
}

export interface TrackPerformance {
    courseId: number;
    trackName: string;
    raceCount: number;
    winRate: number;
    avgFinishPos: number;
    lowSample: boolean;
}

export interface PlayerAnalytics {
    winRate: number;
    finishPositionDistribution: PositionCount[];
    trackPerformance: TrackPerformance[];
    racesByDayOfWeek: DayActivity[];
    racesByHour: HourActivity[];
}

export interface PlayerRaceStatsParams {
    days?: number;
    courseId?: number;
    engineClassId?: number;
    page?: number;
    pageSize?: number;
}

export interface RaceEntry {
    profileId: number;
    name: string | null;
    friendCode: string | null;
    finishPos: number;
    finishTimeDisplay: string;
    characterName: string;
    vehicleName: string;
    framesIn1st: number;
}

export interface RaceResult {
    roomId: string;
    raceNumber: number;
    timestamp: string;
    courseId: number;
    trackName: string;
    engineClassId: number;
    participants: RaceEntry[];
}

export interface RacesParams {
    roomId?: string;
    raceNumber?: number;
    courseId?: number;
    engineClassId?: number;
    friendCode?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
}

