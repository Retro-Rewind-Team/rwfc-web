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

export interface PlayerRaceStatsParams {
    days?: number;
    courseId?: number;
    engineClassId?: number;
    page?: number;
    pageSize?: number;
}
