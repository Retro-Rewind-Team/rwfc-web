import { apiRequest } from "./client";
import {
    GlobalRaceStats,
    PlayerRaceStats,
    PlayerRaceStatsParams,
} from "../../types/raceStats";

export const raceStatsApi = {
    async getPlayerRaceStats(
        pid: string,
        params: PlayerRaceStatsParams = {},
    ): Promise<PlayerRaceStats> {
        const searchParams = new URLSearchParams();
        if (params.days !== undefined)
            searchParams.append("days", params.days.toString());
        if (params.courseId !== undefined)
            searchParams.append("courseId", params.courseId.toString());
        if (params.page !== undefined)
            searchParams.append("page", params.page.toString());
        if (params.pageSize !== undefined)
            searchParams.append("pageSize", params.pageSize.toString());

        const query = searchParams.toString();
        return apiRequest<PlayerRaceStats>(
            `/racestats/player/${pid}${query ? `?${query}` : ""}`,
        );
    },

    async getGlobalRaceStats(days?: number): Promise<GlobalRaceStats> {
        const query = days !== undefined ? `?days=${days}` : "";
        return apiRequest<GlobalRaceStats>(`/racestats/global${query}`);
    },
};
