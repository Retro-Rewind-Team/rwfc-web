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
        refetchInterval: 60000,
    }));

    const roomStatusQuery = useQuery(() => ({
        queryKey: ["roomStatus", currentId()],
        queryFn: () => roomStatusApi.getRoomStatus(currentId()),
        refetchInterval: () => (autoRefresh() && currentId() === undefined ? 60000 : false),
    }));

    const isLatest = createMemo(() => {
        const data = roomStatusQuery.data;
        if (!data) return true;
        return currentId() === undefined || currentId() === data.maximumId;
    });

    const canGoForward = createMemo(() => {
        const data = roomStatusQuery.data;
        if (!data) return false;
        
        const current = currentId();
        
        // Can always go forward from "min"
        if (current === "min") return true;
        
        // Can go forward if we're not at max
        if (typeof current === "number") {
            return current < data.maximumId;
        }
        
        // If undefined (latest), check if current isn't max
        return data.id < data.maximumId;
    });

    const canGoBackward = createMemo(() => {
        const data = roomStatusQuery.data;
        if (!data) return false;
        return data.minimumId < data.id;
    });

    const goForward = () => {
        const data = roomStatusQuery.data;
        if (!data || !canGoForward()) return;

        const current = currentId();
        
        // Handle "min" case by going to minimumId + 1
        if (current === "min") {
            setCurrentId(data.minimumId + 1);
            return;
        }

        // Handle number case
        if (typeof current === "number") {
            const nextId = current + 1;
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

    const getRoomUptime = (createdDate: string): string => {
        const created = new Date(createdDate);
        const now = isLatest() ? new Date() : new Date(roomStatusQuery.data?.timestamp || Date.now());
        const diff = now.getTime() - created.getTime();

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

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
        currentId,
        autoRefresh,
        isLatest,
        canGoForward,
        canGoBackward,
        statsQuery,
        roomStatusQuery,
        getAllFriendCodes,
        goForward,
        goBackward,
        goToLatest,
        goToOldest,
        setAutoRefresh,
        getRoomUptime,
        forceRefresh,
    };
}