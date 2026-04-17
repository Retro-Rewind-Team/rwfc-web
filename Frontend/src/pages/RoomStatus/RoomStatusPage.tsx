import { createEffect, createMemo, createSignal, For, onCleanup, Show } from "solid-js";
import { useRoomStatus } from "../../hooks/useRoom";
import { useMiiLoader } from "../../hooks/useMiiLoader";
import { RoomCard } from "../../components/ui";
import { StatCard } from "../../components/common";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    Inbox,
    Info,
    Search,
    ServerCrash,
    TrendingUp,
    X,
} from "lucide-solid/icons/index";

export default function RoomStatusPage() {
    const {
        state: { isLatest, canGoForward, canGoBackward, currentDateTimeLocal },
        queries: { statsQuery, roomStatusQuery },
        nav: { goForward, goBackward, goToLatest, goToOldest, jumpByMinutes, goToDateTime },
        utils: { getAllFriendCodes, getRoomUptime },
    } = useRoomStatus();

    const miiLoader = useMiiLoader();
    const [tick, setTick] = createSignal(0);
    const [isJumping, setIsJumping] = createSignal(false);
    const [highlightFc, setHighlightFc] = createSignal("");

    const activeFc = createMemo(() => {
        const fc = highlightFc().trim();
        return /^\d{4}-\d{4}-\d{4}$/.test(fc) ? fc : undefined;
    });

    const visibleRooms = createMemo(() => {
        const rooms = roomStatusQuery.data?.rooms ?? [];
        const fc = activeFc();
        const filtered = fc ? rooms.filter((r) => r.players.some((p) => p.friendCode === fc)) : rooms;
        if (!sortByVR()) return filtered;
        return [...filtered].sort((a, b) => {
            if (a.averageVR === null && b.averageVR === null) return 0;
            if (a.averageVR === null) return 1;
            if (b.averageVR === null) return -1;
            return b.averageVR - a.averageVR;
        });
    });

    // Live uptime ticker
    createEffect(() => {
        const interval = setInterval(() => {
            if (isLatest()) setTick((t) => t + 1);
        }, 1000);
        onCleanup(() => clearInterval(interval));
    });

    // Auto-refresh when viewing latest, paused while a FC is highlighted
    createEffect(() => {
        let refreshInterval: ReturnType<typeof setInterval> | undefined;
        if (isLatest() && !activeFc()) {
            refreshInterval = setInterval(() => {
                roomStatusQuery.refetch();
            }, 10000);
        }
        onCleanup(() => {
            if (refreshInterval) clearInterval(refreshInterval);
        });
    });

    // Load Miis when rooms change
    createEffect(() => {
        const friendCodes = getAllFriendCodes();
        if (friendCodes.length > 0) {
            setTimeout(() => miiLoader.loadMiisBatch(friendCodes), 100);
        }
    });

    const handleJump = async (minutes: number) => {
        setIsJumping(true);
        try {
            await jumpByMinutes(minutes);
        } finally {
            setIsJumping(false);
        }
    };

    const handleDateTimeChange = async (e: Event) => {
        const input = e.target as HTMLInputElement;
        if (!input.value) return;
        setIsJumping(true);
        try {
            await goToDateTime(new Date(input.value));
        } finally {
            setIsJumping(false);
        }
    };

    return (
        <div class="space-y-8">
            {/* Hero Header */}
            <section class="py-12">
                <div class="max-w-5xl mx-auto text-center">
                    <div class="mb-8">
                        <div class="flex items-center justify-center mb-4">
                            <h1 class="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
                                Room Browser
                            </h1>
                        </div>
                        <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Real-time view of active rooms and players on RWFC servers
                        </p>
                    </div>

                    <Show when={statsQuery.data}>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            <StatCard
                                value={statsQuery.data!.totalPlayers}
                                label="Players Online"
                                colorScheme="emerald"
                            />
                            <StatCard
                                value={statsQuery.data!.totalRooms}
                                label="Active Rooms"
                                colorScheme="blue"
                            />
                            <StatCard
                                value={statsQuery.data!.peakPlayersToday}
                                label="Peak Today"
                                colorScheme="orange"
                                subtitle={`All-time: ${statsQuery.data!.peakPlayersAllTime}`}
                            />
                        </div>
                    </Show>
                </div>
            </section>

            {/* Navigation Controls */}
            <Show when={roomStatusQuery.data}>
                <div class="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-md p-4 sm:p-6">
                    <div class="flex flex-col gap-4">
                        {/* Top row: step buttons + LIVE badge + highlight FC */}
                        <div class="flex items-center justify-between gap-3 flex-wrap">
                            <div class="flex items-center gap-2">
                                {/* Jump to oldest */}
                                <button
                                    type="button"
                                    onClick={goToOldest}
                                    disabled={!canGoBackward()}
                                    class="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-all hover:scale-110 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                    title="Jump to oldest"
                                >
                                    <ChevronsLeft size={20} />
                                </button>

                                {/* Previous */}
                                <button
                                    type="button"
                                    onClick={goBackward}
                                    disabled={!canGoBackward()}
                                    class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-semibold transition-all hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                                >
                                    <ChevronLeft size={16} />
                                    <span class="hidden sm:inline">Previous</span>
                                </button>

                                {/* Next */}
                                <button
                                    type="button"
                                    onClick={goForward}
                                    disabled={!canGoForward()}
                                    class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-semibold transition-all hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                                >
                                    <span class="hidden sm:inline">Next</span>
                                    <ChevronRight size={16} />
                                </button>

                                {/* Jump to latest */}
                                <button
                                    type="button"
                                    onClick={goToLatest}
                                    disabled={isLatest()}
                                    class="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-all hover:scale-110 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                    title="Jump to latest"
                                >
                                    <ChevronsLeft size={20} class="rotate-180" />
                                </button>

                                <Show when={isLatest()}>
                                    <div class="flex items-center bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 sm:px-5 py-2.5 rounded-xl shadow-lg flex-shrink-0">
                                        <span class="w-2 h-2 bg-white rounded-full mr-2 animate-pulse shadow-lg" />
                                        <span class="text-xs sm:text-sm font-bold text-white tracking-wide">
                                            LIVE
                                        </span>
                                    </div>
                                </Show>
                            </div>

                            {/* Right side: sort toggle + highlight FC input + status indicators */}
                            <div class="flex items-center gap-2 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => setSortByVR((v) => !v)}
                                    class={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border-2 transition-colors shadow-sm ${
                                        sortByVR()
                                            ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
                                            : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-500"
                                    }`}
                                    title={sortByVR() ? "Sorted by average VR" : "Sort by average VR"}
                                >
                                    <TrendingUp size={14} />
                                    <span class="hidden sm:inline">Avg VR</span>
                                </button>

                                <div class="relative">
                                    <Search
                                        size={13}
                                        class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                    />
                                    <input
                                        type="text"
                                        value={highlightFc()}
                                        onInput={(e) => setHighlightFc(e.currentTarget.value)}
                                        placeholder="Highlight FC"
                                        maxlength={14}
                                        spellcheck={false}
                                        class="pl-8 pr-7 py-2 text-sm font-mono w-40 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors shadow-sm"
                                    />
                                    <Show when={highlightFc()}>
                                        <button
                                            type="button"
                                            onClick={() => setHighlightFc("")}
                                            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                            title="Clear"
                                        >
                                            <X size={13} />
                                        </button>
                                    </Show>
                                </div>

                                <Show when={isLatest() && activeFc()}>
                                    <span class="text-xs text-amber-600 dark:text-amber-400 font-semibold whitespace-nowrap">
                                        Auto-refresh paused
                                    </span>
                                </Show>

                                <Show when={!isLatest()}>
                                    <div class="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
                                        <Info size={14} />
                                        Historical data
                                    </div>
                                </Show>
                            </div>
                        </div>

                        {/* Bottom row: time jump controls */}
                        <div class="flex items-center gap-2 flex-wrap">
                            {/* Quick jump buttons */}
                            {([-60, -1] as const).map((mins) => (
                                <button
                                    type="button"
                                    onClick={() => handleJump(mins)}
                                    disabled={isJumping() || !canGoBackward()}
                                    class="px-3 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-gray-200 dark:border-gray-600"
                                >
                                    {mins === -60 ? "-1h" : "-1m"}
                                </button>
                            ))}

                            {/* Datetime picker */}
                            <div class="relative flex-1 min-w-[200px]">
                                <input
                                    type="datetime-local"
                                    value={currentDateTimeLocal()}
                                    onChange={handleDateTimeChange}
                                    disabled={isJumping()}
                                    class="w-full px-3 py-2 text-sm font-medium bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors disabled:opacity-50 shadow-sm"
                                />
                                <Show when={isJumping()}>
                                    <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                                        <div class="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                </Show>
                            </div>

                            {/* Quick jump buttons */}
                            {([1, 60] as const).map((mins) => (
                                <button
                                    type="button"
                                    onClick={() => handleJump(mins)}
                                    disabled={isJumping() || !canGoForward()}
                                    class="px-3 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-gray-200 dark:border-gray-600"
                                >
                                    {mins === 60 ? "+1h" : "+1m"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Show>

            {/* Loading State */}
            <Show when={roomStatusQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm p-16 text-center">
                    <div class="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto mb-6" />
                    <p class="text-xl text-gray-600 dark:text-gray-400 font-semibold">
                        Loading room data...
                    </p>
                </div>
            </Show>

            {/* Error State */}
            <Show when={roomStatusQuery.isError}>
                <div class="bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-800 rounded-xl p-12">
                    <div class="text-center">
                        <div class="flex justify-center mb-6 text-red-400 dark:text-red-500">
                            <ServerCrash size={48} />
                        </div>
                        <div class="text-red-600 dark:text-red-400 text-2xl font-bold mb-3">
                            Couldn't load room data
                        </div>
                        <p class="text-red-500 dark:text-red-400 mb-8">
                            {roomStatusQuery.error?.message || "Something went wrong"}
                        </p>
                        <button
                            type="button"
                            onClick={() => roomStatusQuery.refetch()}
                            class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-10 rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </Show>

            {/* No Data State */}
            <Show
                when={
                    roomStatusQuery.data &&
                    !roomStatusQuery.isLoading &&
                    roomStatusQuery.data.rooms.length === 0 &&
                    !activeFc()
                }
            >
                <div class="bg-white dark:bg-gray-800 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-12">
                    <div class="text-center">
                        <div class="flex justify-center mb-6 text-amber-300 dark:text-amber-600">
                            <Inbox size={48} />
                        </div>
                        <div class="text-gray-900 dark:text-white text-2xl font-bold mb-3">
                            No rooms found
                        </div>
                        <p class="text-gray-600 dark:text-gray-400 mb-2">
                            Nobody is racing right now, or the server may be experiencing issues.
                        </p>
                        <p class="text-sm text-gray-500 dark:text-gray-500">
                            Use the navigation controls to view historical data
                        </p>
                    </div>
                </div>
            </Show>

            {/* FC Not Found State */}
            <Show
                when={
                    roomStatusQuery.data &&
                    !roomStatusQuery.isLoading &&
                    activeFc() &&
                    visibleRooms().length === 0
                }
            >
                <div class="bg-white dark:bg-gray-800 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-12">
                    <div class="text-center">
                        <div class="flex justify-center mb-6 text-amber-300 dark:text-amber-600">
                            <Search size={48} />
                        </div>
                        <div class="text-gray-900 dark:text-white text-2xl font-bold mb-3">
                            Player not found
                        </div>
                        <p class="text-gray-600 dark:text-gray-400">
                            No room contains{" "}
                            <code class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                {activeFc()}
                            </code>{" "}
                            in this snapshot.
                        </p>
                    </div>
                </div>
            </Show>

            {/* Rooms List */}
            <Show
                when={
                    roomStatusQuery.data && !roomStatusQuery.isLoading && visibleRooms().length > 0
                }
            >
                <div class="space-y-6">
                    <For each={visibleRooms()}>
                        {(room) => (
                            <RoomCard
                                room={room}
                                getRoomUptime={getRoomUptime}
                                isLatest={isLatest()}
                                tick={tick()}
                                highlightFc={activeFc()}
                            />
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
}
