import { apiRequest } from "./client";
import {
    GhostSubmission,
    PagedSubmissions,
    Track,
    TrackFlap,
    TrackLeaderboard,
    TrackWorldRecords,
    TTPlayerStats,
    TTProfile,
    VehicleFilter,
    ShroomlessFilter,
} from "../../types/timeTrial";

// Converts frontend filter values to API query string params
function buildCategoryParams(
    glitchAllowed: boolean,
    shroomless: ShroomlessFilter,
    vehicle: VehicleFilter
): URLSearchParams {
    const params = new URLSearchParams();
    params.append("glitchAllowed", glitchAllowed.toString());
    if (shroomless !== "all") params.append("shroomless", shroomless);
    if (vehicle !== "all") params.append("vehicle", vehicle);
    return params;
}

export const timeTrialApi = {
    // ===== TRACKS =====

    async getAllTracks(): Promise<Track[]> {
        return apiRequest<Track[]>("/timetrial/tracks");
    },

    async getTrack(id: number): Promise<Track> {
        return apiRequest<Track>(`/timetrial/tracks/${id}`);
    },

    // ===== LEADERBOARD =====

    async getLeaderboard(
        trackId: number,
        cc: 150 | 200,
        glitchAllowed: boolean,
        shroomless: ShroomlessFilter,
        vehicle: VehicleFilter,
        page = 1,
        pageSize = 10
    ): Promise<TrackLeaderboard> {
        const params = buildCategoryParams(glitchAllowed, shroomless, vehicle);
        params.append("trackId", trackId.toString());
        params.append("cc", cc.toString());
        params.append("page", page.toString());
        params.append("pageSize", pageSize.toString());
        return apiRequest<TrackLeaderboard>(`/timetrial/leaderboard?${params}`);
    },

    async getTopTimes(
        trackId: number,
        cc: 150 | 200,
        glitchAllowed: boolean,
        shroomless: ShroomlessFilter,
        vehicle: VehicleFilter,
        count = 10
    ): Promise<GhostSubmission[]> {
        const params = buildCategoryParams(glitchAllowed, shroomless, vehicle);
        params.append("trackId", trackId.toString());
        params.append("cc", cc.toString());
        params.append("count", count.toString());
        return apiRequest<GhostSubmission[]>(`/timetrial/leaderboard/top?${params}`);
    },

    // ===== WORLD RECORDS =====

    async getWorldRecord(
        trackId: number,
        cc: 150 | 200,
        glitchAllowed: boolean,
        shroomless: ShroomlessFilter = "all",
        vehicle: VehicleFilter = "all"
    ): Promise<GhostSubmission> {
        const params = buildCategoryParams(glitchAllowed, shroomless, vehicle);
        params.append("trackId", trackId.toString());
        params.append("cc", cc.toString());
        return apiRequest<GhostSubmission>(`/timetrial/worldrecord?${params}`);
    },

    async getAllWorldRecords(
        cc: 150 | 200,
        glitchAllowed: boolean,
        shroomless: ShroomlessFilter = "all",
        vehicle: VehicleFilter = "all"
    ): Promise<TrackWorldRecords[]> {
        const params = buildCategoryParams(glitchAllowed, shroomless, vehicle);
        params.append("cc", cc.toString());
        return apiRequest<TrackWorldRecords[]>(`/timetrial/worldrecords/all?${params}`);
    },

    async getWorldRecordHistory(
        trackId: number,
        cc: 150 | 200,
        glitchAllowed: boolean,
        shroomless: ShroomlessFilter = "all",
        vehicle: VehicleFilter = "all"
    ): Promise<GhostSubmission[]> {
        const params = buildCategoryParams(glitchAllowed, shroomless, vehicle);
        params.append("trackId", trackId.toString());
        params.append("cc", cc.toString());
        return apiRequest<GhostSubmission[]>(`/timetrial/worldrecord/history?${params}`);
    },

    // ===== FLAP =====

    async getFastestLap(
        trackId: number,
        cc: 150 | 200,
        glitchAllowed: boolean,
        shroomless: ShroomlessFilter = "all",
        vehicle: VehicleFilter = "all"
    ): Promise<TrackFlap> {
        const params = buildCategoryParams(glitchAllowed, shroomless, vehicle);
        params.append("trackId", trackId.toString());
        params.append("cc", cc.toString());
        return apiRequest<TrackFlap>(`/timetrial/flap?${params}`);
    },

    // ===== GHOST DOWNLOAD =====

    async downloadGhost(id: number): Promise<Blob> {
        const response = await fetch(
            `${import.meta.env.VITE_API_URL || "/api"}/timetrial/ghost/${id}/download`
        );

        if (!response.ok) {
            throw new Error(`Failed to download ghost: ${response.statusText}`);
        }

        return response.blob();
    },

    // ===== PROFILES =====

    async getProfile(ttProfileId: number): Promise<TTProfile> {
        return apiRequest<TTProfile>(`/timetrial/profile/${ttProfileId}`);
    },

    async getProfileSubmissions(
        ttProfileId: number,
        page = 1,
        pageSize = 10,
        trackId?: number,
        cc?: 150 | 200,
        glitch?: boolean,
        shroomless: ShroomlessFilter = "all",
        vehicle: VehicleFilter = "all"
    ): Promise<PagedSubmissions> {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("pageSize", pageSize.toString());
        if (trackId !== undefined) params.append("trackId", trackId.toString());
        if (cc !== undefined) params.append("cc", cc.toString());
        if (glitch !== undefined) params.append("glitch", glitch.toString());
        if (shroomless !== "all") params.append("shroomless", shroomless);
        if (vehicle !== "all") params.append("vehicle", vehicle);
        return apiRequest<PagedSubmissions>(
            `/timetrial/profile/${ttProfileId}/submissions?${params}`
        );
    },

    async getPlayerStats(ttProfileId: number): Promise<TTPlayerStats> {
        return apiRequest<TTPlayerStats>(`/timetrial/profile/${ttProfileId}/stats`);
    },
};
