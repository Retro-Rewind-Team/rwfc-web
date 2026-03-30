import { apiRequest } from "./client";
import {
    BatchMiiResponse,
    PagedResult,
    RoomSnapshot,
    RoomStatusResponse,
    RoomStatusStats,
} from "../../types";

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

    async getSnapshotHistory(
        page: number,
        pageSize: number,
    ): Promise<PagedResult<RoomSnapshot>> {
        return apiRequest<PagedResult<RoomSnapshot>>(
            `/roomstatus/history?page=${page}&pageSize=${pageSize}`,
        );
    },

    async getSnapshotsByDateRange(from: Date, to: Date): Promise<RoomSnapshot[]> {
        return apiRequest<RoomSnapshot[]>(
            `/roomstatus/history?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
        );
    },

    async getMiiImage(friendCode: string): Promise<Blob> {
        const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/roomstatus/mii/${friendCode}`,
        );
        if (!response.ok)
            throw new Error(`Failed to fetch Mii image: ${response.status}`);
        return response.blob();
    },

    async getMiisBatch(friendCodes: string[]): Promise<BatchMiiResponse> {
        if (friendCodes.length === 0) return { miis: {} };

        const chunks: string[][] = [];
        for (let i = 0; i < friendCodes.length; i += 25)
            chunks.push(friendCodes.slice(i, i + 25));

        const allMiis: Record<string, string> = {};

        for (const chunk of chunks) {
            try {
                const response = await apiRequest<BatchMiiResponse>(
                    "/roomstatus/miis/batch",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ friendCodes: chunk }),
                    },
                );
                Object.assign(allMiis, response.miis);

                const missingFcs = chunk.filter((fc) => !response.miis[fc]);
                if (missingFcs.length > 0) {
                    try {
                        const fallback = await apiRequest<BatchMiiResponse>(
                            "/leaderboard/miis/batch",
                            {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ friendCodes: missingFcs }),
                            },
                        );
                        Object.assign(allMiis, fallback.miis);
                    } catch (e) {
                        console.warn("Fallback Mii fetch failed:", e);
                    }
                }
            } catch (e) {
                console.warn(
                    `Failed to load Mii batch for ${chunk.length} players:`,
                    e,
                );
            }
        }

        return { miis: allMiis };
    },

    async forceRefresh(): Promise<void> {
        await apiRequest("/roomstatus/refresh", { method: "POST" });
    },
};
