import { createMemo } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { timeTrialApi } from "../services/api/timeTrial";
import { ApiError } from "../services/api/client";
import { GhostSubmission, ShroomlessFilter, VehicleFilter } from "../types/timeTrial";
import { ghostFilename, triggerBlobDownload } from "../utils/downloadHelpers";
import { queryKeys } from "../constants/queryKeys";
import { readEnum, useUrlPagination, useUrlSearch, useUrlState } from "./useUrlState";

export const TT_PLAYER_PAGE_SIZES = [10, 25, 50] as const;

/**
 * Manages filter state, pagination, and data fetching for a time trial player
 * profile page (submissions table + WR history). Filters, the track search and the page are URL
 * params (`cc`, `glitch=yes|no`, `shroomless`, `vehicle`, `q`, `page`, `size`).
 */
export function useTTPlayer(ttProfileId: () => number) {
    const state = useUrlState();
    const { currentPage, pageSize, setCurrentPage, handlePageSizeChange, clampTo } =
        useUrlPagination(state, 10, TT_PLAYER_PAGE_SIZES);
    const { searchQuery, search, handleSearchInput, clear } = useUrlSearch(state);

    const selectedCC = createMemo((): 150 | 200 | undefined => {
        const cc = state.get("cc");
        return cc === "150" ? 150 : cc === "200" ? 200 : undefined;
    });
    const glitchFilter = createMemo((): boolean | undefined => {
        const glitch = readEnum(state.get("glitch"), ["yes", "no"] as const);
        return glitch === undefined ? undefined : glitch === "yes";
    });
    const shroomlessFilter = createMemo(
        (): ShroomlessFilter =>
            readEnum(state.get("shroomless"), ["all", "only", "exclude"] as const) ?? "all",
    );
    const vehicleFilter = createMemo(
        (): VehicleFilter =>
            readEnum(state.get("vehicle"), ["all", "karts", "bikes"] as const) ?? "all",
    );

    // Fetch player profile
    const profileQuery = useQuery(() => ({
        queryKey: queryKeys.ttProfile(ttProfileId()),
        queryFn: () => timeTrialApi.getProfile(ttProfileId()),
        retry: 1,
    }));

    // Fetch submissions with all filters and pagination server-side
    const submissionsQuery = useQuery(() => ({
        queryKey: queryKeys.ttProfileSubmissions(
            ttProfileId(),
            currentPage(),
            pageSize(),
            selectedCC(),
            glitchFilter(),
            shroomlessFilter(),
            vehicleFilter(),
        ),
        queryFn: () =>
            timeTrialApi.getProfileSubmissions(
                ttProfileId(),
                currentPage(),
                pageSize(),
                undefined,
                selectedCC(),
                glitchFilter(),
                shroomlessFilter(),
                vehicleFilter(),
            ),
    }));

    // Fetch player stats - always unfiltered
    const statsQuery = useQuery(() => ({
        queryKey: queryKeys.ttProfileStats(ttProfileId()),
        queryFn: () => timeTrialApi.getPlayerStats(ttProfileId()),
    }));

    clampTo(() => submissionsQuery.data?.totalPages);

    // Client-side track name search - applied on top of server results
    // This is lightweight since we're only searching the current page
    const filteredSubmissions = createMemo(() => {
        const submissions = submissionsQuery.data?.submissions ?? [];
        const needle = search().toLowerCase();
        if (!needle) return submissions;
        return submissions.filter((sub) => sub.trackName.toLowerCase().includes(needle));
    });

    const worldRecordsHeld = createMemo(() => profileQuery.data?.currentWorldRecords ?? 0);

    const isPlayerNotFound = createMemo(
        () =>
            profileQuery.isError &&
            profileQuery.error instanceof ApiError &&
            profileQuery.error.status === 404,
    );

    const totalPages = createMemo(() => submissionsQuery.data?.totalPages ?? 1);

    const totalSubmissions = createMemo(() => submissionsQuery.data?.totalSubmissions ?? 0);

    const handleCCChange = (cc: 150 | 200 | undefined) => state.update({ cc }, { resetPage: true });
    const handleGlitchFilterChange = (glitch: boolean | undefined) =>
        state.update(
            { glitch: glitch === undefined ? undefined : glitch ? "yes" : "no" },
            { resetPage: true },
        );
    const handleShroomlessFilterChange = (filter: ShroomlessFilter) =>
        state.update({ shroomless: filter === "all" ? undefined : filter }, { resetPage: true });
    const handleVehicleFilterChange = (filter: VehicleFilter) =>
        state.update({ vehicle: filter === "all" ? undefined : filter }, { resetPage: true });

    const hasFilters = createMemo(
        () =>
            !!search() ||
            selectedCC() !== undefined ||
            glitchFilter() !== undefined ||
            shroomlessFilter() !== "all" ||
            vehicleFilter() !== "all",
    );
    const clearFilters = () =>
        clear({ cc: undefined, glitch: undefined, shroomless: undefined, vehicle: undefined });

    const handleDownloadGhost = async (submission: GhostSubmission) => {
        try {
            const blob = await timeTrialApi.downloadGhost(submission.id);
            triggerBlobDownload(blob, ghostFilename(submission.finishTimeDisplay));
        } catch (error) {
            console.error("Failed to download ghost:", error);
        }
    };

    const refreshAll = () => {
        profileQuery.refetch();
        submissionsQuery.refetch();
        statsQuery.refetch();
    };

    return {
        filters: {
            selectedCC,
            glitchFilter,
            shroomlessFilter,
            vehicleFilter,
            searchQuery,
            search,
            hasFilters,
        },
        pagination: {
            currentPage,
            pageSize,
            setCurrentPage,
            handlePageSizeChange,
        },
        computed: {
            filteredSubmissions,
            worldRecordsHeld,
            isPlayerNotFound,
            totalPages,
            totalSubmissions,
        },
        queries: {
            profileQuery,
            submissionsQuery,
            statsQuery,
        },
        handlers: {
            handleSearchInput,
            handleCCChange,
            handleGlitchFilterChange,
            handleShroomlessFilterChange,
            handleVehicleFilterChange,
            clearFilters,
            handleDownloadGhost,
            refreshAll,
        },
    };
}
