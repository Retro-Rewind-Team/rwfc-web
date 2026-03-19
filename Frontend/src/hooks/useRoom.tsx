import { createMemo, createSignal } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { roomStatusApi } from "../services/api/room";

export function useRoomStatus() {
    // undefined = live (latest), number = specific DB snapshot ID
    const [currentId, setCurrentId] = createSignal<number | undefined>(undefined);
    const [minId, setMinId] = createSignal<number>(0);
    const [maxId, setMaxId] = createSignal<number>(0);
    const [isJumping, setIsJumping] = createSignal(false);

    const statsQuery = useQuery(() => ({
        queryKey: ["roomStatus", "stats"],
        queryFn: () => roomStatusApi.getStats(),
        refetchInterval: 60000,
    }));

    const roomStatusQuery = useQuery(() => ({
        queryKey: ["roomStatus", currentId()],
        queryFn: async () => {
            const id = currentId();
            const data = id === undefined
                ? await roomStatusApi.getLatestRoomStatus()
                : await roomStatusApi.getRoomStatusById(id);
            setMinId(data.minimumId);
            setMaxId(data.maximumId);
            return data;
        },
        refetchInterval: () => currentId() === undefined ? 60000 : false,
    }));

    const isLatest = createMemo(() => currentId() === undefined);

    const canGoForward = createMemo(() => {
        if (!roomStatusQuery.data) return false;
        const id = currentId();
        if (id === undefined) return false;
        const max = maxId() > 0 ? maxId() : roomStatusQuery.data.maximumId;
        return id < max;
    });

    const canGoBackward = createMemo(() => {
        const data = roomStatusQuery.data;
        if (!data) return false;
        const id = currentId();
        if (id === undefined) return data.id > 0; 
        return id > minId();
    });

    const goForward = () => {
        const id = currentId();
        if (id === undefined || !canGoForward()) return;
        const next = id + 1;
        if (next <= maxId()) setCurrentId(next);
    };

    const goBackward = () => {
        if (!roomStatusQuery.data || !canGoBackward()) return;
        const id = currentId();
        if (id === undefined) {
            // Use the id from the live response directly
            const liveId = roomStatusQuery.data.id;
            if (liveId > 0) setCurrentId(liveId - 1);
            return;
        }
        const prev = id - 1;
        if (prev >= minId()) setCurrentId(prev);
    };

    const goToLatest = () => setCurrentId(undefined);

    const goToOldest = () => {
        const data = roomStatusQuery.data;
        if (!data) return;
        // Use minimumId from the live response directly
        const min = data.minimumId > 0 ? data.minimumId : minId();
        if (min > 0) setCurrentId(min);
    };

    const jumpByMinutes = async (minutes: number) => {
        const data = roomStatusQuery.data;
        if (!data) return;
        setIsJumping(true);
        try {
            const base = new Date(data.timestamp);
            const target = new Date(base.getTime() + minutes * 60 * 1000);
            const nearest = await roomStatusApi.getNearestStatus(target);
            setMinId(nearest.minimumId);
            setMaxId(nearest.maximumId);
            setCurrentId(nearest.id);
        } catch (e) {
            console.warn("jumpByMinutes failed:", e);
        } finally {
            setIsJumping(false);
        }
    };

    const goToDateTime = async (date: Date) => {
        setIsJumping(true);
        try {
            const nearest = await roomStatusApi.getNearestStatus(date);
            setMinId(nearest.minimumId);
            setMaxId(nearest.maximumId);
            setCurrentId(nearest.id);
        } catch (e) {
            console.warn("goToDateTime failed:", e);
        } finally {
            setIsJumping(false);
        }
    };

    const currentDateTimeLocal = createMemo(() => {
        const data = roomStatusQuery.data;
        if (!data) return "";
        const d = new Date(data.timestamp);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    });

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
                if (player.mii) friendCodes.add(player.friendCode);
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
        isLatest,
        isJumping,
        canGoForward,
        canGoBackward,
        statsQuery,
        roomStatusQuery,
        getAllFriendCodes,
        goForward,
        goBackward,
        goToLatest,
        goToOldest,
        jumpByMinutes,
        goToDateTime,
        currentDateTimeLocal,
        getRoomUptime,
        forceRefresh,
        minId,
        maxId,
    };
}
