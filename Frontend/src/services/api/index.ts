import { leaderboardApi } from "./leaderboard";
import { apiRequest } from "./client";

export const api = {
    ...leaderboardApi,

    // Health check
    async healthCheck(): Promise<{ status: string }> {
        return apiRequest<{ status: string }>("/health");
    },
};

export { leaderboardApi } from "./leaderboard";
export { roomStatusApi } from "./room";
export { timeTrialApi } from "./timeTrial";
export { raceStatsApi } from "./raceStats";
export { ApiError } from "./client";
