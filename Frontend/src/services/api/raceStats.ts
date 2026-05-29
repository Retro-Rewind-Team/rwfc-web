import { apiRequest } from "./client";
import { PagedResult } from "../../types/room";
import {
    GlobalRaceStats,
    PlayerAnalytics,
    PlayerRaceStats,
    PlayerRaceStatsParams,
    RaceResult,
    RacesParams,
} from "../../types/raceStats";

export const raceStatsApi = {
    async getPlayerRaceStats(
        pid: string,
        params: PlayerRaceStatsParams = {},
    ): Promise<PlayerRaceStats> {
        const searchParams = new URLSearchParams();
        if (params.days !== undefined) searchParams.append("days", params.days.toString());
        if (params.courseId !== undefined)
            searchParams.append("courseId", params.courseId.toString());
        if (params.engineClassId !== undefined)
            searchParams.append("engineClassId", params.engineClassId.toString());
        if (params.page !== undefined) searchParams.append("page", params.page.toString());
        if (params.pageSize !== undefined)
            searchParams.append("pageSize", params.pageSize.toString());

        const query = searchParams.toString();
        return apiRequest<PlayerRaceStats>(`/racestats/player/${pid}${query ? `?${query}` : ""}`);
    },

    async getGlobalRaceStats(days?: number): Promise<GlobalRaceStats> {
        const query = days !== undefined ? `?days=${days}` : "";
        return apiRequest<GlobalRaceStats>(`/racestats/global${query}`);
    },

    async getPlayerAnalytics(
        pid: string,
        params: { days?: number; engineClassId?: number } = {},
    ): Promise<PlayerAnalytics> {
        const searchParams = new URLSearchParams();
        if (params.days !== undefined) searchParams.append("days", params.days.toString());
        if (params.engineClassId !== undefined)
            searchParams.append("engineClassId", params.engineClassId.toString());
        const query = searchParams.toString();
        return apiRequest<PlayerAnalytics>(
            `/racestats/player/${pid}/analytics${query ? `?${query}` : ""}`,
        );
    },

    async getRaces(params: RacesParams = {}): Promise<PagedResult<RaceResult>> {
        const searchParams = new URLSearchParams();
        if (params.roomId) searchParams.append("roomId", params.roomId);
        if (params.raceNumber !== undefined) searchParams.append("raceNumber", params.raceNumber.toString());
        if (params.courseId !== undefined) searchParams.append("courseId", params.courseId.toString());
        if (params.engineClassId !== undefined) searchParams.append("engineClassId", params.engineClassId.toString());
        if (params.friendCode) searchParams.append("friendCode", params.friendCode);
        if (params.from) searchParams.append("from", params.from);
        if (params.to) searchParams.append("to", params.to);
        if (params.page !== undefined) searchParams.append("page", params.page.toString());
        if (params.pageSize !== undefined) searchParams.append("pageSize", params.pageSize.toString());
        const query = searchParams.toString();
        return apiRequest<PagedResult<RaceResult>>(`/racestats/races${query ? `?${query}` : ""}`);
    },
};
