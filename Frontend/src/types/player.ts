export interface Player {
    pid: string;
    name: string;
    friendCode: string;
    vr: number;
    rank: number;
    lastSeen: string;
    isSuspicious: boolean;
    vrStats: VRStats;
    miiImageBase64?: string;
}

export interface VRStats {
    last24Hours: number;
    lastWeek: number;
    lastMonth: number;
}

