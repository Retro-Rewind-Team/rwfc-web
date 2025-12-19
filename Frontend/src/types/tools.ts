// Rank Calculator Types
export interface RksysLicense {
    index: number;
    name: string;
    profileId: number;
    friendCode: string;
    vrPoints: number;
    vsWins: number;
    vsLosses: number;
    firsts: number;
    distance: number;
    distance1st: number;
}

export interface RankScore {
    score: number;
    rank: number;
    rankLabel: string;
    M: number;
    winPct: number;
    vrNorm: number;
    firstsNorm: number;
    distNorm: number;
    dist1stNorm: number;
    totalVs: number;
    meetsRaceReq: boolean;
}

export interface NeededStats {
    threshold: number | null;
    M_req: number;
    byStat: {
        VR: StatRequirement;
        WinPct: StatRequirement;
        Firsts: StatRequirement;
        Distance: StatRequirement;
        Dist1st: StatRequirement;
    } | null;
}

export interface StatRequirement {
    neededNorm: number;
    neededRaw: number;
    unit: string;
    feasibility: "ok" | "warn" | "bad";
    extraWins?: string;
}

export interface StatContribution {
    points: number;
    share: number;
}

// Rating Editor Types
export interface RatingEntry {
    index: number;
    profileId: number;
    vr: number;
    br: number;
    flags: number;
}

export interface RatingFile {
    magic: string;
    version: number;
    count: number;
    entries: RatingEntry[];
}

// Font Patcher Types
export interface U8Node {
    type: number;
    nameOffset: number;
    dataOffset: number;
    size: number;
    index: number;
}

export interface U8Archive {
    nodes: U8Node[];
    paths: string[];
    rootOffset: number;
    headerSize: number;
    dataOffset: number;
}