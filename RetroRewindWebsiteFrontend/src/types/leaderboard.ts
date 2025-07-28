import { Player } from "./player";

export interface LeaderboardResponse {
  players: Player[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  stats: LeaderboardStats;
}

export interface LeaderboardStats {
  totalPlayers: number;
  activePlayers: number;
  suspiciousPlayers: number;
  lastUpdated: string;
}

export interface LeaderboardRequest {
  page?: number;
  pageSize?: number;
  activeOnly?: boolean;
  search?: string;
  sortBy?: string;
  ascending?: boolean;
  timePeriod?: string;
}
