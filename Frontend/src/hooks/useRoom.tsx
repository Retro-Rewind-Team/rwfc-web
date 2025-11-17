import { createMemo, createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { roomStatusApi } from "../services/api/room";

export function useRoomStatus() {
    const [currentId, setCurrentId] = createSignal<number | "min" | undefined>(
        undefined
    );
    const [autoRefresh, setAutoRefresh] = createSignal(true);

    const statsQuery = useQuery(() => ({
        queryKey: ["roomStatus", "stats"],
        queryFn: () => roomStatusApi.getStats(),
        refetchInterval: 60000, // Refresh every minute
    }));

    const roomStatusQuery = useQuery(() => ({
        queryKey: ["roomStatus", currentId()],
        queryFn: () => roomStatusApi.getRoomStatus(currentId()),
        refetchInterval: () => (autoRefresh() && currentId() === undefined ? 60000 : false),
    }));

    // Check if we're viewing the latest snapshot
    const isLatest = createMemo(() => {
        const data = roomStatusQuery.data;
        if (!data) return true;
        return currentId() === undefined || currentId() === data.maximumId;
    });

    const canGoForward = createMemo(() => {
        const data = roomStatusQuery.data;
        if (!data) return false;
        return currentId() !== undefined && currentId() !== data.maximumId;
    });

    const canGoBackward = createMemo(() => {
        const data = roomStatusQuery.data;
        if (!data) return false;
        return data.minimumId < data.id;
    });

    // Navigation handlers
    const goForward = () => {
        const data = roomStatusQuery.data;
        if (!data || !canGoForward()) return;

        if (typeof currentId() === "number") {
            const nextId = (currentId() as number) + 1;
            if (nextId <= data.maximumId) {
                setCurrentId(nextId);
            }
        }
    };

    const goBackward = () => {
        const data = roomStatusQuery.data;
        if (!data || !canGoBackward()) return;

        const current = currentId() ?? data.id;
        if (typeof current === "number") {
            const prevId = current - 1;
            if (prevId >= data.minimumId) {
                setCurrentId(prevId);
            }
        }
    };

    const goToLatest = () => {
        setCurrentId(undefined);
    };

    const goToOldest = () => {
        setCurrentId("min");
    };

    // Calculate room uptime
    const getRoomUptime = (createdDate: string): string => {
        const created = new Date(createdDate);
        const now = isLatest() ? new Date() : new Date(roomStatusQuery.data?.timestamp || Date.now());
        const diff = now.getTime() - created.getTime();

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    // Get all unique friend codes for Mii loading
    const getAllFriendCodes = createMemo(() => {
        const rooms = roomStatusQuery.data?.rooms || [];
        const friendCodes = new Set<string>();
    
        rooms.forEach(room => {
            room.players.forEach(player => {
                if (player.mii) {
                    friendCodes.add(player.friendCode);
                }
            });
        });
    
        return Array.from(friendCodes);
    });

    // Force refresh
    const forceRefresh = async () => {
        try {
            await roomStatusApi.forceRefresh();
            await roomStatusQuery.refetch();
            await statsQuery.refetch();
        } catch (error) {
            console.error("Failed to force refresh:", error);
        }
    };

    return {
    // State
        currentId,
        autoRefresh,
        isLatest,
        canGoForward,
        canGoBackward,

        // Queries
        statsQuery,
        roomStatusQuery,

        // Computed
        getAllFriendCodes,

        // Navigation
        goForward,
        goBackward,
        goToLatest,
        goToOldest,
        setAutoRefresh,

        // Utilities
        getRoomUptime,
        forceRefresh,
    };
}