import { apiRequest } from "./client";
import { GhostSubmission, Track, TrackLeaderboard, TTProfile } from "../../types/timeTrial";

export const timeTrialApi = {
    async getAllTracks(): Promise<Track[]> {
        return apiRequest<Track[]>("/timetrial/tracks");
    },

    async getTrack(id: number): Promise<Track> {
        return apiRequest<Track>(`/timetrial/tracks/${id}`);
    },

    async getLeaderboard(
        trackId: number,
        cc: 150 | 200,
        page = 1,
        pageSize = 10
    ): Promise<TrackLeaderboard> {
        return apiRequest<TrackLeaderboard>(
            `/timetrial/leaderboard?trackId=${trackId}&cc=${cc}&page=${page}&pageSize=${pageSize}`
        );
    },

    async getTopTimes(
        trackId: number,
        cc: 150 | 200,
        count = 10
    ): Promise<GhostSubmission[]> {
        return apiRequest<GhostSubmission[]>(
            `/timetrial/leaderboard/top?trackId=${trackId}&cc=${cc}&count=${count}`
        );
    },

    async getWorldRecord(
        trackId: number,
        cc: 150 | 200
    ): Promise<GhostSubmission> {
        return apiRequest<GhostSubmission>(
            `/timetrial/worldrecord?trackId=${trackId}&cc=${cc}`
        );
    },

    async downloadGhost(id: number): Promise<Blob> {
        const response = await fetch(
            `${import.meta.env.VITE_API_URL || "/api"}/timetrial/ghost/${id}/download`
        );

        if (!response.ok) {
            throw new Error(`Failed to download ghost: ${response.statusText}`);
        }

        return response.blob();
    },

    async getProfile(discordUserId: string): Promise<TTProfile> {
        return apiRequest<TTProfile>(`/timetrial/profile/${discordUserId}`);
    },

    async getProfileSubmissions(
        discordUserId: string,
        trackId?: number,
        cc?: 150 | 200
    ): Promise<GhostSubmission[]> {
        const params = new URLSearchParams();
        if (trackId) params.append("trackId", trackId.toString());
        if (cc) params.append("cc", cc.toString());

        const queryString = params.toString();
        return apiRequest<GhostSubmission[]>(
            `/timetrial/profile/${discordUserId}/submissions${queryString ? `?${queryString}` : ""}`
        );
    },
};