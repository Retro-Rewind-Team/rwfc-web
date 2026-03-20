import { createEffect, createMemo, createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { timeTrialApi } from "../services/api/timeTrial";
import { ShroomlessFilter, VehicleFilter } from "../types/timeTrial";

export function useTTPlayer(ttProfileId: number) {
    // Filters
    const [selectedCC, setSelectedCC] = createSignal<150 | 200 | undefined>(undefined);
    const [glitchFilter, setGlitchFilter] = createSignal<boolean | undefined>(undefined);
    const [shroomlessFilter, setShroomlessFilter] = createSignal<ShroomlessFilter>("all");
    const [vehicleFilter, setVehicleFilter] = createSignal<VehicleFilter>("all");
    const [searchQuery, setSearchQuery] = createSignal("");

    // Pagination
    const [currentPage, setCurrentPage] = createSignal(1);
    const [pageSize, setPageSize] = createSignal(10);

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
        queryKey: ["tt-profile", ttProfileId],
        queryFn: () => timeTrialApi.getProfile(ttProfileId),
        retry: 1,
    }));

    // Fetch submissions with all filters and pagination server-side
    const submissionsQuery = useQuery(() => ({
        queryKey: [
            "tt-profile-submissions",
            ttProfileId,
            currentPage(),
            pageSize(),
            selectedCC(),
            glitchFilter(),
            shroomlessFilter(),
            vehicleFilter(),
        ],
        queryFn: () => timeTrialApi.getProfileSubmissions(
            ttProfileId,
            currentPage(),
            pageSize(),
            undefined,
            selectedCC(),
            glitchFilter(),
            shroomlessFilter(),
            vehicleFilter()
        ),
    }));

    // Fetch player stats - always unfiltered
    const statsQuery = useQuery(() => ({
        queryKey: ["tt-profile-stats", ttProfileId],
        queryFn: () => timeTrialApi.getPlayerStats(ttProfileId),
    }));

    // Client-side track name search - applied on top of server results
    // This is lightweight since we're only searching the current page
    const filteredSubmissions = createMemo(() => {
        const submissions = submissionsQuery.data?.submissions ?? [];
        const search = searchQuery().toLowerCase();
        if (!search) return submissions;
        return submissions.filter((sub) =>
            sub.trackName.toLowerCase().includes(search)
        );
    });

    const worldRecordsHeld = createMemo(() =>
        profileQuery.data?.currentWorldRecords ?? 0
    );

    const isPlayerNotFound = createMemo(() =>
        profileQuery.isError &&
        profileQuery.error instanceof Error &&
        profileQuery.error.message.includes("404")
    );

    const totalPages = createMemo(() =>
        submissionsQuery.data?.totalPages ?? 1
    );

    const totalSubmissions = createMemo(() =>
        submissionsQuery.data?.totalSubmissions ?? 0
    );

    const handleSearchInput = (value: string) => {
        setSearchQuery(value);
    };

    const handleCCChange = (cc: 150 | 200 | undefined) => {
        setSelectedCC(cc as 150 | 200 | undefined);
    };

    const handleGlitchFilterChange = (glitch: boolean | undefined) => {
        setGlitchFilter(glitch);
    };

    const handleShroomlessFilterChange = (filter: ShroomlessFilter) => {
        setShroomlessFilter(filter);
    };

    const handleVehicleFilterChange = (filter: VehicleFilter) => {
        setVehicleFilter(filter);
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    const handleDownloadGhost = async (submissionId: number) => {
        try {
            const blob = await timeTrialApi.downloadGhost(submissionId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const submission = submissionsQuery.data?.submissions.find(
                (s) => s.id === submissionId
            );
            a.download = submission
                ? `${submission.finishTimeDisplay.replace(":", "m").replace(".", "s")}.rkg`
                : "ghost.rkg";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
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
        // State
        selectedCC,
        glitchFilter,
        shroomlessFilter,
        vehicleFilter,
        searchQuery,
        currentPage,
        pageSize,

        // Computed
        filteredSubmissions,
        worldRecordsHeld,
        isPlayerNotFound,
        totalPages,
        totalSubmissions,

        // Queries
        profileQuery,
        submissionsQuery,
        statsQuery,

        // Handlers
        handleSearchInput,
        handleCCChange,
        handleGlitchFilterChange,
        handleShroomlessFilterChange,
        handleVehicleFilterChange,
        handlePageSizeChange,
        handleDownloadGhost,
        refreshAll,

        // Setters
        setCurrentPage,
    };
}
