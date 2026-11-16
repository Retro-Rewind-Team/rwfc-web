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
    miiData?: string;
    badges: number[] | null;
    vehiclePreference: "kart" | "bike" | null;
    vehicleRank: number | null;
    countryAlpha2: string | null;
    countryName: string | null;
}

export interface VRStats {
    last24Hours: number;
    lastWeek: number;
    lastMonth: number;
}
