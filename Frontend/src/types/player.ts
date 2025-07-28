export interface Player {
  pid: string;
  name: string;
  friendCode: string;
  vr: number;
  rank: number;
  activeRank: number | null;
  lastSeen: string;
  isActive: boolean;
  isSuspicious: boolean;
  vrStats: VRStats;
  miiImageBase64?: string;
}

export interface VRStats {
  last24Hours: number;
  lastWeek: number;
  lastMonth: number;
}

export interface PlayerSearchResult {
  name: string;
  friendCode: string;
  vr: number;
  rank: number;
  isActive: boolean;
  isSuspicious: boolean;
  lastSeen: string;
}
