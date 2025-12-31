import { apiRequest } from "./client";
import {
    BatchMiiResponse,
    LeaderboardRequest,
    LeaderboardResponse,
    LeaderboardStats,
    MiiResponse,
    Player,
    VRHistoryEntry,
    VRHistoryResponse,
} from "../../types";

export const leaderboardApi = {
    async getLeaderboard(
        params: LeaderboardRequest = {}
    ): Promise<LeaderboardResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });

        return apiRequest<LeaderboardResponse>(`/leaderboard?${searchParams}`);
    },

    async getTopPlayers(count = 10): Promise<Player[]> {
        return apiRequest<Player[]>(`/leaderboard/top/${count}`);
    },

    async getPlayer(friendCode: string): Promise<Player> {
        return apiRequest<Player>(`/leaderboard/player/${friendCode}`);
    },

    async getLegacyPlayer(friendCode: string): Promise<Player> {
        return apiRequest<Player>(`/leaderboard/legacy/player/${friendCode}`);
    },

    async getStats(): Promise<LeaderboardStats> {
        return apiRequest<LeaderboardStats>("/leaderboard/stats");
    },

    async getPlayerHistory(
        friendCode: string,
        days: number | null = 30
    ): Promise<VRHistoryResponse> {
        const url = days === null 
            ? `/leaderboard/player/${friendCode}/history`
            : `/leaderboard/player/${friendCode}/history?days=${days}`;
        return apiRequest<VRHistoryResponse>(url);
    },

    async getPlayerRecentHistory(
        friendCode: string,
        count = 50
    ): Promise<VRHistoryEntry[]> {
        return apiRequest<VRHistoryEntry[]>(
            `/leaderboard/player/${friendCode}/history/recent?count=${count}`
        );
    },

    async getPlayerMii(friendCode: string): Promise<MiiResponse | null> {
        try {
            return await apiRequest<MiiResponse>(
                `/leaderboard/player/${friendCode}/mii`
            );
        } catch (error) {
            if (error instanceof Error && error.message.includes("404")) {
                return null;
            }
            throw error;
        }
    },

    async getPlayerMiisBatch(friendCodes: string[]): Promise<BatchMiiResponse> {
        if (friendCodes.length === 0) {
            return { miis: {} };
        }

        const chunks = [];
        for (let i = 0; i < friendCodes.length; i += 25) {
            chunks.push(friendCodes.slice(i, i + 25));
        }

        const allMiis: Record<string, string> = {};

        for (const chunk of chunks) {
            try {
                const response = await apiRequest<BatchMiiResponse>(
                    "/leaderboard/miis/batch",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ friendCodes: chunk }),
                    }
                );

                Object.assign(allMiis, response.miis);
            } catch (error) {
                console.warn(
                    `Failed to load Mii batch for ${chunk.length} players:`,
                    error
                );
            }
        }

        return { miis: allMiis };
    },

    async getDiscordMemberCount(): Promise<number> {
        try {
            const response = await fetch(
                "https://discord.com/api/v10/invites/retrorewind?with_counts=true"
            );
            
            if (!response.ok) {
                throw new Error("Discord API request failed");
            }
            
            const data = await response.json();
            return data.approximate_member_count;
        } catch (error) {
            console.warn("Failed to load Discord member count:", error);
            return 8000; // Fallback
        }
    },
};

export const legacyLeaderboardApi = {
    async isAvailable(): Promise<boolean> {
        return apiRequest<boolean>("/leaderboard/legacy/available");
    },

    async getLeaderboard(
        params: LeaderboardRequest = {}
    ): Promise<LeaderboardResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });

        return apiRequest<LeaderboardResponse>(`/leaderboard/legacy?${searchParams}`);
    },

    async getPlayerMiisBatch(friendCodes: string[]): Promise<BatchMiiResponse> {
        if (friendCodes.length === 0) {
            return { miis: {} };
        }

        const chunks = [];
        for (let i = 0; i < friendCodes.length; i += 25) {
            chunks.push(friendCodes.slice(i, i + 25));
        }

        const allMiis: Record<string, string> = {};

        for (const chunk of chunks) {
            try {
                const response = await apiRequest<BatchMiiResponse>(
                    "/leaderboard/legacy/miis/batch",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ friendCodes: chunk }),
                    }
                );

                Object.assign(allMiis, response.miis);
            } catch (error) {
                console.warn(
                    `Failed to load legacy Mii batch for ${chunk.length} players:`,
                    error
                );
            }
        }

        return { miis: allMiis };
    },
};