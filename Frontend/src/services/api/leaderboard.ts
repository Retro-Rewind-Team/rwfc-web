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
    async getLeaderboard(params: LeaderboardRequest = {}): Promise<LeaderboardResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });

        return apiRequest<LeaderboardResponse>(`/leaderboard?${searchParams}`);
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

    async getPlayerHistoryByRange(
        friendCode: string,
        from: Date,
        to: Date,
    ): Promise<VRHistoryResponse> {
        const params = new URLSearchParams({
            from: from.toISOString(),
            to: to.toISOString(),
        });
        return apiRequest<VRHistoryResponse>(`/leaderboard/player/${friendCode}/history?${params}`);
    },

    async getPlayerRecentHistory(friendCode: string, count = 50): Promise<VRHistoryEntry[]> {
        return apiRequest<VRHistoryEntry[]>(
            `/leaderboard/player/${friendCode}/history/recent?count=${count}`,
        );
    },

    async getPlayerMii(friendCode: string): Promise<MiiResponse | null> {
        try {
            return await apiRequest<MiiResponse>(`/leaderboard/player/${friendCode}/mii`);
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
                "https://update.rwfc.net/RetroRewind/RetroRewindVersion.txt",
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
                "https://update.rwfc.net/RetroRewind",
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

    async getChannelDownloadUrl(): Promise<string> {
        const fallbackUrl = "https://github.com/Jacherr/RR-Launcher/releases/latest";

        try {
            const response = await fetch(
                "https://api.github.com/repos/Jacherr/RR-Launcher/releases/latest",
            );

            if (!response.ok) {
                throw new Error("Failed to fetch channel release");
            }

            const data = await response.json();
            const asset = data.assets?.find(
                (a: { name?: string; browser_download_url?: string }) =>
                    typeof a?.name === "string" &&
                    a.name.endsWith(".zip") &&
                    typeof a.browser_download_url === "string" &&
                    a.browser_download_url.length > 0,
            );

            if (!asset) {
                throw new Error("No zip asset found in latest release");
            }

            return asset.browser_download_url;
        } catch (error) {
            console.warn("Failed to load channel download URL:", error);
            return fallbackUrl;
        }
    },

    async getDiscordInviteIcon(inviteUrl: string): Promise<string | null> {
        try {
            const code = inviteUrl.split("/").filter(Boolean).pop();
            const response = await fetch(`https://discord.com/api/v10/invites/${code}`);

            if (!response.ok) {
                throw new Error("Failed to fetch Discord invite");
            }

            const data = await response.json();
            const icon: string | undefined = data.guild?.icon;
            const guildId: string | undefined = data.guild?.id;

            if (!icon || !guildId) {
                return null;
            }

            const extension = icon.startsWith("a_") ? "gif" : "png";
            return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${extension}`;
        } catch (error) {
            console.warn("Failed to load Discord invite icon:", error);
            return null;
        }
    },
};

export const legacyLeaderboardApi = {
    async isAvailable(): Promise<boolean> {
        return apiRequest<boolean>("/leaderboard/legacy/available");
    },

    async getLeaderboard(params: LeaderboardRequest = {}): Promise<LeaderboardResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });

        return apiRequest<LeaderboardResponse>(`/leaderboard/legacy?${searchParams}`);
    },

    async getPlayerMiisBatch(friendCodes: string[]) {
        return batchMiis("/leaderboard/legacy/miis/batch", friendCodes);
    },
};
