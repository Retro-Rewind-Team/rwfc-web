import { apiRequest } from "./client";
import { batchMiis } from "./miiHelpers";
import {
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
        params: LeaderboardRequest = {},
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
        days: number | null = 30,
    ): Promise<VRHistoryResponse> {
        const url =
      days === null
          ? `/leaderboard/player/${friendCode}/history`
          : `/leaderboard/player/${friendCode}/history?days=${days}`;
        return apiRequest<VRHistoryResponse>(url);
    },

    async getPlayerRecentHistory(
        friendCode: string,
        count = 50,
    ): Promise<VRHistoryEntry[]> {
        return apiRequest<VRHistoryEntry[]>(
            `/leaderboard/player/${friendCode}/history/recent?count=${count}`,
        );
    },

    async getPlayerMii(friendCode: string): Promise<MiiResponse | null> {
        try {
            return await apiRequest<MiiResponse>(
                `/leaderboard/player/${friendCode}/mii`,
            );
        } catch (error) {
            if (error instanceof Error && error.message.includes("404")) {
                return null;
            }
            throw error;
        }
    },

    async getPlayerMiisBatch(friendCodes: string[]) {
        return batchMiis("/leaderboard/miis/batch", friendCodes);
    },

    async getDiscordMemberCount(): Promise<number> {
        try {
            const response = await fetch(
                "https://discord.com/api/v10/invites/retrorewind?with_counts=true",
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

    async getRRVersion() {
        try {
            const response = await fetch(
                "https://rwfc.net/updates/RetroRewind/RetroRewindVersion.txt",
            );

            if (!response.ok) {
                throw new Error("Failed to fetch RetroRewind version");
            }

            const text = await response.text();
            const lines = text.trim().split("\n").filter(Boolean);
            const latest = lines[lines.length - 1].split(" ");
            const previous = lines[lines.length - 2]?.split(" ")[0] ?? null;

            const updateUrl = latest[1].replace(
                "http://update.rwfc.net:8000/RetroRewind",
                "https://rwfc.net/updates/RetroRewind",
            );

            return {
                version: latest[0],
                updateUrl,
                previousVersion: previous,
            };
        } catch (error) {
            console.warn("Failed to load RetroRewind version:", error);
            throw error;
        }
    },
};

export const legacyLeaderboardApi = {
    async isAvailable(): Promise<boolean> {
        return apiRequest<boolean>("/leaderboard/legacy/available");
    },

    async getLeaderboard(
        params: LeaderboardRequest = {},
    ): Promise<LeaderboardResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });

        return apiRequest<LeaderboardResponse>(
            `/leaderboard/legacy?${searchParams}`,
        );
    },

    async getPlayerMiisBatch(friendCodes: string[]) {
        return batchMiis("/leaderboard/legacy/miis/batch", friendCodes);
    },
};
