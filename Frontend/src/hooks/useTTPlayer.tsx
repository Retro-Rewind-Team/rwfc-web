import { createMemo, createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { timeTrialApi } from "../services/api/timeTrial";

export function useTTPlayer(ttProfileId: number) {
    const [selectedCC, setSelectedCC] = createSignal<150 | 200 | "all">("all");
    const [searchQuery, setSearchQuery] = createSignal("");

    // Fetch player profile
    const profileQuery = useQuery(() => ({
        queryKey: ["tt-profile", ttProfileId],
        queryFn: () => timeTrialApi.getProfile(ttProfileId),
        retry: 1,
    }));

    // Fetch player submissions
    const submissionsQuery = useQuery(() => ({
        queryKey: ["tt-profile-submissions", ttProfileId],
        queryFn: () => timeTrialApi.getProfileSubmissions(ttProfileId),
    }));

    // Fetch player stats
    const statsQuery = useQuery(() => ({
        queryKey: ["tt-profile-stats", ttProfileId],
        queryFn: () => timeTrialApi.getPlayerStats(ttProfileId),
    }));

    // Filter submissions by CC and search
    const filteredSubmissions = createMemo(() => {
        const submissions = submissionsQuery.data || [];
        const cc = selectedCC();
        const search = searchQuery().toLowerCase();

        return submissions
            .filter((sub) => {
                if (cc !== "all" && sub.cc !== cc) return false;
                if (search && !sub.trackName.toLowerCase().includes(search)) return false;
                return true;
            })
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    });

    // Group submissions by track
    const submissionsByTrack = createMemo(() => {
        const submissions = filteredSubmissions();
        const grouped = new Map<number, typeof submissions>();

        submissions.forEach((sub) => {
            const existing = grouped.get(sub.trackId) || [];
            grouped.set(sub.trackId, [...existing, sub]);
        });

        return grouped;
    });

    // Calculate world records held
    const worldRecordsHeld = createMemo(() => {
        return profileQuery.data?.currentWorldRecords || 0;
    });

    // Check if player not found
    const isPlayerNotFound = createMemo(() => {
        return (
            profileQuery.isError &&
      profileQuery.error instanceof Error &&
      profileQuery.error.message.includes("404")
        );
    });

    const handleSearchInput = (value: string) => {
        setSearchQuery(value);
    };

    const handleCCChange = (cc: 150 | 200 | "all") => {
        setSelectedCC(cc);
    };

    const handleDownloadGhost = async (submissionId: number) => {
        try {
            const blob = await timeTrialApi.downloadGhost(submissionId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
      
            // Find the submission to get the time for filename
            const submission = submissionsQuery.data?.find(s => s.id === submissionId);
            if (submission) {
                a.download = `${submission.finishTimeDisplay.replace(":", "m").replace(".", "s")}.rkg`;
            } else {
                a.download = "ghost.rkg";
            }
      
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
        searchQuery,

        // Computed
        filteredSubmissions,
        submissionsByTrack,
        worldRecordsHeld,
        isPlayerNotFound,

        // Queries
        profileQuery,
        submissionsQuery,
        statsQuery,

        // Handlers
        handleSearchInput,
        handleCCChange,
        handleDownloadGhost,
        refreshAll,
    };
}