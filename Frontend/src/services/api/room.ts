import { apiRequest } from "./client";
import {
    BatchMiiResponse,
    RoomStatusResponse,
    RoomStatusStats,
} from "../../types";

export const roomStatusApi = {
    async getRoomStatus(id?: number | "min"): Promise<RoomStatusResponse> {
        const url = id !== undefined ? `/roomstatus?id=${id}` : "/roomstatus";
        return apiRequest<RoomStatusResponse>(url);
    },

    async getStats(): Promise<RoomStatusStats> {
        return apiRequest<RoomStatusStats>("/roomstatus/stats");
    },

    async getMiiImage(friendCode: string): Promise<Blob> {
        const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/roomstatus/mii/${friendCode}`
        );
    
        if (!response.ok) {
            throw new Error(`Failed to fetch Mii image: ${response.status}`);
        }
    
        return response.blob();
    },

    async getMiisBatch(friendCodes: string[]): Promise<BatchMiiResponse> {
        if (friendCodes.length === 0) {
            return { miis: {} };
        }

        // Split into chunks of 25
        const chunks = [];
        for (let i = 0; i < friendCodes.length; i += 25) {
            chunks.push(friendCodes.slice(i, i + 25));
        }

        const allMiis: Record<string, string> = {};

        for (const chunk of chunks) {
            try {
                // Try room status Mii endpoint first
                const response = await apiRequest<BatchMiiResponse>(
                    "/roomstatus/miis/batch",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ friendCodes: chunk }),
                    }
                );

                Object.assign(allMiis, response.miis);
        
                // Find which FCs didn't get Miis
                const missingFcs = chunk.filter(fc => !response.miis[fc]);
        
                // Fallback to leaderboard endpoint for missing Miis
                if (missingFcs.length > 0) {
                    try {
                        const fallbackResponse = await apiRequest<BatchMiiResponse>(
                            "/leaderboard/miis/batch",
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ friendCodes: missingFcs }),
                            }
                        );
            
                        Object.assign(allMiis, fallbackResponse.miis);
                    } catch (fallbackError) {
                        console.warn("Fallback Mii fetch also failed:", fallbackError);
                    }
                }
            } catch (error) {
                console.warn(
                    `Failed to load Mii batch for ${chunk.length} players:`,
                    error
                );
            }
        }

        return { miis: allMiis };
    },

    async forceRefresh(): Promise<void> {
        await apiRequest("/roomstatus/refresh", {
            method: "POST",
        });
    },
};