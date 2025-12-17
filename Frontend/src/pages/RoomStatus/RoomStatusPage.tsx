import { createEffect, createSignal, For, onCleanup, Show } from "solid-js";
import { useRoomStatus } from "../../hooks/useRoom";
import { useMiiLoader } from "../../hooks/useMiiLoader";
import { RoomCard } from "../../components/ui";
import { formatTimestamp } from "../../utils/formatter";
import { StatCard } from "../../components/common";

export default function RoomStatusPage() {
    const {
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
        getRoomUptime,
    } = useRoomStatus();

    const miiLoader = useMiiLoader();
  
    // Force re-render every second for live uptime
    const [tick, setTick] = createSignal(0);
  
    createEffect(() => {
        const interval = setInterval(() => {
            if (isLatest()) {
                setTick(t => t + 1);
            }
        }, 1000);
    
        onCleanup(() => clearInterval(interval));
    });

    // Auto-refresh room data when viewing latest
    createEffect(() => {
        let refreshInterval: ReturnType<typeof setInterval> | undefined;
        
        if (isLatest()) {
            refreshInterval = setInterval(() => {
                roomStatusQuery.refetch();
            }, 10000); // Refresh every 10 seconds when viewing live
        }
    
        onCleanup(() => {
            if (refreshInterval) clearInterval(refreshInterval);
        });
    });

    // Load Miis when rooms data changes
    createEffect(() => {
        const friendCodes = getAllFriendCodes();
        if (friendCodes.length > 0) {
            setTimeout(() => {
                miiLoader.loadMiisBatch(friendCodes);
            }, 100);
        }
    });

    return (
        <div class="space-y-8">
            {/* Hero Header Section*/}
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

                    {/* Stats Grid */}
                    <Show when={statsQuery.data}>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                            <StatCard
                                value={statsQuery.data!.totalPlayers}
                                label="Players Online"
                                colorScheme="emerald"
                                icon="👥"
                            />
                            <StatCard
                                value={statsQuery.data!.totalRooms}
                                label="Active Rooms"
                                colorScheme="blue"
                                icon="🏁"
                            />
                        </div>
                    </Show>
                </div>
            </section>

            {/* Navigation Controls */}
            <Show when={roomStatusQuery.data}>
                <div class="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-md p-6">
                    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        {/* Navigation Buttons */}
                        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div class="flex items-center gap-2">
                                <button
                                    onClick={goToOldest}
                                    disabled={!canGoBackward()}
                                    class="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-all hover:scale-110 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                    title="Jump to oldest"
                                >
                                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={goBackward}
                                    disabled={!canGoBackward()}
                                    class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-semibold transition-all hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                                >
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" />
                                    </svg>
                                    <span class="hidden sm:inline">Previous</span>
                                </button>
                                <button
                                    onClick={goForward}
                                    disabled={!canGoForward()}
                                    class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-semibold transition-all hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                                >
                                    <span class="hidden sm:inline">Next</span>
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={goToLatest}
                                    disabled={isLatest()}
                                    class="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-all hover:scale-110 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                    title="Jump to latest"
                                >
                                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" />
                                    </svg>
                                </button>

                                <Show when={isLatest()}>
                                    <div class="flex items-center bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 sm:px-5 py-2.5 rounded-xl shadow-lg flex-shrink-0">
                                        <span class="w-2 h-2 bg-white rounded-full mr-2 animate-pulse shadow-lg"></span>
                                        <span class="text-xs sm:text-sm font-bold text-white tracking-wide">
                                        LIVE
                                        </span>
                                    </div>
                                </Show>
                            </div>
                        </div>

                        {/* Data Info */}
                        <div class="text-center lg:text-right">
                            <div class="flex items-center justify-center lg:justify-end gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                                </svg>
                                <span>Snapshot #{roomStatusQuery.data!.id}</span>
                                <span class="text-gray-400 dark:text-gray-600">•</span>
                                <span>{formatTimestamp(roomStatusQuery.data!.timestamp)}</span>
                            </div>
                            <Show when={!isLatest()}>
                                <div class="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-2 flex items-center justify-center lg:justify-end gap-1.5 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 inline-flex">
                                    <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                                    </svg>
                                    <span>Historical Data</span>
                                </div>
                            </Show>
                        </div>
                    </div>
                </div>
            </Show>

            {/* Loading State */}
            <Show when={roomStatusQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm p-16 text-center">
                    <div class="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto mb-6"></div>
                    <p class="text-xl text-gray-600 dark:text-gray-400 font-semibold">
                        Loading room data...
                    </p>
                </div>
            </Show>

            {/* Error State */}
            <Show when={roomStatusQuery.isError}>
                <div class="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-xl p-12 shadow-md">
                    <div class="text-center">
                        <div class="text-7xl mb-6">😵</div>
                        <div class="text-red-600 dark:text-red-400 text-2xl font-bold mb-3">
                            Couldn't load room data
                        </div>
                        <p class="text-red-500 dark:text-red-400 mb-8 text-lg">
                            {roomStatusQuery.error?.message || "Something went wrong"}
                        </p>
                        <button
                            onClick={() => roomStatusQuery.refetch()}
                            class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-10 rounded-lg transition-all hover:scale-105 shadow-lg"
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
                    roomStatusQuery.data.rooms.length === 0
                }
            >
                <div class="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-12 shadow-md">
                    <div class="text-center">
                        <div class="text-7xl mb-6">🏜️</div>
                        <div class="text-amber-800 dark:text-amber-200 text-2xl font-bold mb-3">
                            No rooms found
                        </div>
                        <p class="text-amber-700 dark:text-amber-300 mb-2 text-lg">
                            Nobody is racing right now, or the server may be experiencing issues.
                        </p>
                        <p class="text-sm text-amber-600 dark:text-amber-400 font-medium">
                            Use the navigation arrows to view historical data
                        </p>
                    </div>
                </div>
            </Show>

            {/* Rooms List */}
            <Show
                when={
                    roomStatusQuery.data &&
                    !roomStatusQuery.isLoading &&
                    roomStatusQuery.data.rooms.length > 0
                }
            >
                <div class="space-y-6">
                    <For each={roomStatusQuery.data!.rooms}>
                        {(room) => (
                            <RoomCard 
                                room={room} 
                                getRoomUptime={getRoomUptime} 
                                isLatest={isLatest()} 
                                tick={tick()} 
                            />
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
}