import { apiRequest } from "./client";
import { batchMiis } from "./miiHelpers";
import { PagedResult, RoomSnapshot, RoomStatusResponse, RoomStatusStats } from "../../types";

export const roomStatusApi = {
    async getLatestRoomStatus(): Promise<RoomStatusResponse> {
        return apiRequest<RoomStatusResponse>("/roomstatus");
    },

    async getRoomStatusById(id: number): Promise<RoomStatusResponse> {
        return apiRequest<RoomStatusResponse>(`/roomstatus/${id}`);
    },

    async getNearestStatus(timestamp: Date): Promise<RoomStatusResponse> {
        return apiRequest<RoomStatusResponse>(
            `/roomstatus/nearest?timestamp=${encodeURIComponent(timestamp.toISOString())}`,
        );
    },

    async getStats(): Promise<RoomStatusStats> {
        return apiRequest<RoomStatusStats>("/roomstatus/stats");
    },

    async getSnapshotHistory(page: number, pageSize: number): Promise<PagedResult<RoomSnapshot>> {
        return apiRequest<PagedResult<RoomSnapshot>>(
            `/roomstatus/history?page=${page}&pageSize=${pageSize}`,
        );
    },

    async getMiisBatch(friendCodes: string[]) {
        return batchMiis("/roomstatus/miis/batch", friendCodes, "/leaderboard/miis/batch");
    },

    async forceRefresh(): Promise<void> {
        await apiRequest("/roomstatus/refresh", { method: "POST" });
    },
};
