import { apiRequest } from "./client";
import { GhostSubmission, Track, TrackLeaderboard, TrackWorldRecords, TTPlayerStats, TTProfile } from "../../types/timeTrial";

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
        glitch: boolean = false,
        page = 1,
        pageSize = 10
    ): Promise<TrackLeaderboard> {
        return apiRequest<TrackLeaderboard>(
            `/timetrial/leaderboard?trackId=${trackId}&cc=${cc}&glitch=${glitch}&page=${page}&pageSize=${pageSize}`
        );
    },

    async getTopTimes(
        trackId: number,
        cc: 150 | 200,
        glitch: boolean = false,
        count = 10
    ): Promise<GhostSubmission[]> {
        return apiRequest<GhostSubmission[]>(
            `/timetrial/leaderboard/top?trackId=${trackId}&cc=${cc}&glitch=${glitch}&count=${count}`
        );
    },

    async getWorldRecord(
        trackId: number,
        cc: 150 | 200,
        glitch: boolean = false
    ): Promise<GhostSubmission> {
        return apiRequest<GhostSubmission>(
            `/timetrial/worldrecord?trackId=${trackId}&cc=${cc}&glitch=${glitch}`
        );
    },

    async getAllWorldRecords(): Promise<TrackWorldRecords[]> {
        return apiRequest<TrackWorldRecords[]>("/timetrial/worldrecords/all");
    },

    async getWorldRecordHistory(
        trackId: number,
        cc: 150 | 200,
        glitch: boolean = false
    ): Promise<GhostSubmission[]> {
        return apiRequest<GhostSubmission[]>(
            `/timetrial/worldrecord/history?trackId=${trackId}&cc=${cc}&glitch=${glitch}`
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

    async getProfile(ttProfileId: number): Promise<TTProfile> {
        return apiRequest<TTProfile>(`/timetrial/profile/${ttProfileId}`);
    },

    async getProfileSubmissions(
        ttProfileId: number,
        trackId?: number,
        cc?: 150 | 200
    ): Promise<GhostSubmission[]> {
        const params = new URLSearchParams();
        if (trackId) params.append("trackId", trackId.toString());
        if (cc) params.append("cc", cc.toString());

        const queryString = params.toString();
        return apiRequest<GhostSubmission[]>(
            `/timetrial/profile/${ttProfileId}/submissions${queryString ? `?${queryString}` : ""}`
        );
    },

    async getPlayerStats(ttProfileId: number): Promise<TTPlayerStats> {
        return apiRequest<TTPlayerStats>(`/timetrial/profile/${ttProfileId}/stats`);
    },
};