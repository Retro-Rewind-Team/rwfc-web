import { createEffect, createMemo, createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { timeTrialApi } from "../services/api/timeTrial";
import { GhostSubmission, ShroomlessFilter, VehicleFilter } from "../types/timeTrial";
import { ghostFilename, triggerBlobDownload } from "../utils/downloadHelpers";
import { queryKeys } from "../constants/queryKeys";
import { usePagination } from "./usePagination";

/**
 * Manages filter state, pagination, and data fetching for a time trial player
 * profile page (submissions table + WR history).
 */
export function useTTPlayer(ttProfileId: number) {
    const { currentPage, setCurrentPage, pageSize, handlePageSizeChange } = usePagination(10);

    const [selectedCC, setSelectedCC] = createSignal<150 | 200 | undefined>(undefined);
    const [glitchFilter, setGlitchFilter] = createSignal<boolean | undefined>(undefined);
    const [shroomlessFilter, setShroomlessFilter] = createSignal<ShroomlessFilter>("all");
    const [vehicleFilter, setVehicleFilter] = createSignal<VehicleFilter>("all");
    const [searchQuery, setSearchQuery] = createSignal("");

    // Reset to page 1 when any filter changes
    createEffect(() => {
        selectedCC();
        glitchFilter();
        shroomlessFilter();
        vehicleFilter();
        setCurrentPage(1);
    });

    // Fetch player profile
    const profileQuery = useQuery(() => ({
        queryKey: queryKeys.ttProfile(ttProfileId),
        queryFn: () => timeTrialApi.getProfile(ttProfileId),
        retry: 1,
    }));

    // Fetch submissions with all filters and pagination server-side
    const submissionsQuery = useQuery(() => ({
        queryKey: queryKeys.ttProfileSubmissions(
            ttProfileId,
            currentPage(),
            pageSize(),
            selectedCC(),
            glitchFilter(),
            shroomlessFilter(),
            vehicleFilter(),
        ),
        queryFn: () =>
            timeTrialApi.getProfileSubmissions(
                ttProfileId,
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
        queryKey: queryKeys.ttProfileStats(ttProfileId),
        queryFn: () => timeTrialApi.getPlayerStats(ttProfileId),
    }));

    // Client-side track name search - applied on top of server results
    // This is lightweight since we're only searching the current page
    const filteredSubmissions = createMemo(() => {
        const submissions = submissionsQuery.data?.submissions ?? [];
        const search = searchQuery().toLowerCase();
        if (!search) return submissions;
        return submissions.filter((sub) => sub.trackName.toLowerCase().includes(search));
    });

    const worldRecordsHeld = createMemo(() => profileQuery.data?.currentWorldRecords ?? 0);

    const isPlayerNotFound = createMemo(
        () =>
            profileQuery.isError &&
            profileQuery.error instanceof Error &&
            profileQuery.error.message.includes("404"),
    );

    const totalPages = createMemo(() => submissionsQuery.data?.totalPages ?? 1);

    const totalSubmissions = createMemo(() => submissionsQuery.data?.totalSubmissions ?? 0);

    const handleSearchInput = (value: string) => setSearchQuery(value);
    const handleCCChange = (cc: 150 | 200 | undefined) => setSelectedCC(cc);
    const handleGlitchFilterChange = (glitch: boolean | undefined) => setGlitchFilter(glitch);
    const handleShroomlessFilterChange = (filter: ShroomlessFilter) => setShroomlessFilter(filter);
    const handleVehicleFilterChange = (filter: VehicleFilter) => setVehicleFilter(filter);

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
            handleDownloadGhost,
            refreshAll,
        },
    };
}
