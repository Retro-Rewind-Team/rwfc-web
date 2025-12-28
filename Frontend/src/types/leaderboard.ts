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
  suspiciousPlayers: number;
  lastUpdated: string;
}

export interface LeaderboardRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  ascending?: boolean;
  timePeriod?: string;
}
