import { createEffect, createSignal, For, onCleanup, Show } from "solid-js";
import { useRoomStatus } from "../../hooks/useRoom";
import { useMiiLoader } from "../../hooks/useMiiLoader";
import { MiiComponent } from "../../components/ui";
import type { Room, RoomPlayer } from "../../services/api/room";

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

    // Format timestamp
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
    };

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
                            <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 p-6 transition-all hover:shadow-lg hover:scale-105">
                                <div class="flex items-center justify-center gap-3 mb-2">
                                    <span class="text-3xl">👥</span>
                                    <div class="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {statsQuery.data!.totalPlayers}
                                    </div>
                                </div>
                                <div class="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Players Online</div>
                            </div>
                            <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-xl border-2 border-blue-200 dark:border-blue-800 p-6 transition-all hover:shadow-lg hover:scale-105">
                                <div class="flex items-center justify-center gap-3 mb-2">
                                    <span class="text-3xl">🏁</span>
                                    <div class="text-4xl font-bold text-blue-600 dark:text-blue-400">
                                        {statsQuery.data!.totalRooms}
                                    </div>
                                </div>
                                <div class="text-sm font-semibold text-blue-700 dark:text-blue-300">Active Rooms</div>
                            </div>
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
                        {(room) => <RoomCard room={room} getRoomUptime={getRoomUptime} isLatest={isLatest()} tick={tick()} />}
                    </For>
                </div>
            </Show>
        </div>
    );
}

// Room Card Component
function RoomCard(props: {
    room: Room;
    getRoomUptime: (created: string) => string;
    isLatest: boolean;
    tick: number;
}) {
    const [isExpanded, setIsExpanded] = createSignal(true);
    const playerCount = () => props.room.players.length;
    const isJoinable = () => props.room.isJoinable;
    
    // Force reactive dependency on tick for uptime updates
    const uptime = () => {
        if (props.isLatest) {
            // Access tick to create dependency
            void props.tick; // This creates the reactive dependency
            return props.getRoomUptime(props.room.created);
        }
        return props.getRoomUptime(props.room.created);
    };

    return (
        <div class="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all overflow-hidden hover:border-gray-300 dark:hover:border-gray-600">
            {/* Room Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded())}
                class={`w-full p-5 text-left transition-all ${props.room.isSplit 
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600" 
                    : "bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700"
                } hover:opacity-95`}
            >
                <div class="flex items-start justify-between gap-4">
                    {/* Left side: Main info */}
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-3 mb-3">
                            {/* Room Type - Large and Prominent */}
                            <Show when={props.room.roomType}>
                                <h3 class="text-white text-2xl sm:text-3xl font-extrabold drop-shadow-lg truncate">
                                    {props.room.roomType}
                                </h3>
                            </Show>
                            
                            {/* Split warning */}
                            <Show when={props.room.isSplit}>
                                <span class="flex-shrink-0 px-3 py-1.5 bg-white rounded-lg text-amber-700 text-xs font-bold shadow-lg border-2 border-amber-200">
                                    ⚠️ SPLIT
                                </span>
                            </Show>
                        </div>

                        {/* Status row - individual colored badges */}
                        <div class="flex flex-wrap items-center gap-2">
                            {/* Public/Private Badge */}
                            <div class={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs shadow-md ${
                                props.room.isPublic
                                    ? "bg-emerald-500/90 text-white"
                                    : "bg-red-500/90 text-white"
                            }`}>
                                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <Show when={props.room.isPublic} fallback={
                                        <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                                    }>
                                        <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                                    </Show>
                                </svg>
                                <span>{props.room.isPublic ? "Public" : "Private"}</span>
                            </div>

                            {/* Joinability Badge */}
                            <div class={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs shadow-md ${
                                props.room.isSplit 
                                    ? "bg-amber-500/90 text-white"
                                    : isJoinable()
                                        ? "bg-emerald-500/90 text-white"
                                        : "bg-gray-500/90 text-white"
                            }`}>
                                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <Show when={isJoinable() && !props.room.isSplit} fallback={
                                        props.room.isSplit ? (
                                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                                        ) : (
                                            <path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd" />
                                        )
                                    }>
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                    </Show>
                                </svg>
                                <span>
                                    {props.room.isSplit ? "Split Room" : isJoinable() ? "Joinable" : "Not Joinable"}
                                </span>
                            </div>

                            {/* Player count Badge */}
                            <div class="flex items-center gap-1.5 px-3 py-1.5 bg-white/25 backdrop-blur-sm rounded-lg font-bold text-xs text-white shadow-md">
                                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                </svg>
                                <span>{playerCount()}/12 Players</span>
                            </div>

                            {/* Uptime Badge */}
                            <Show when={props.isLatest}>
                                <div class="flex items-center gap-1.5 px-3 py-1.5 bg-white/25 backdrop-blur-sm rounded-lg font-bold text-xs text-white shadow-md">
                                    <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                                    </svg>
                                    <span>{uptime()}</span>
                                </div>
                            </Show>
                        </div>
                    </div>

                    {/* Right side: Expand button */}
                    <div class="flex-shrink-0">
                        <div class="bg-white/25 backdrop-blur-sm p-2.5 rounded-lg hover:bg-white/35 transition-colors shadow-lg border border-white/30">
                            <svg 
                                class={`w-5 h-5 text-white transition-transform drop-shadow-md ${isExpanded() ? "rotate-180" : ""}`}
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                            >
                                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>
            </button>

            {/* Players Grid - Collapsible */}
            <Show when={isExpanded()}>
                <div class="p-5 bg-gray-50 dark:bg-gray-900/30">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        <For each={props.room.players}>
                            {(player) => <PlayerCard player={player} showOpenHost={props.room.isPublic} />}
                        </For>
                    </div>
                </div>
            </Show>
        </div>
    );
}

function PlayerCard(props: { player: RoomPlayer; showOpenHost: boolean }) {
    const cardContent = (
        <div class="flex items-center gap-3">
            {/* Mii */}
            <div class="flex-shrink-0">
                <Show
                    when={props.player.mii}
                    fallback={
                        <div class="w-14 h-14 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 shadow-md">
                            <span class="text-sm font-bold text-gray-600 dark:text-gray-300">
                                {props.player.name.substring(0, 2).toUpperCase()}
                            </span>
                        </div>
                    }
                >
                    <MiiComponent
                        playerName={props.player.name}
                        friendCode={props.player.friendCode}
                        size="sm"
                        lazy={true}
                    />
                </Show>
            </div>

            {/* Player Info */}
            <div class="flex-1 min-w-0">
                <div class="font-bold text-gray-900 dark:text-white truncate text-sm">
                    {props.player.mii?.name || props.player.name}
                </div>
                <code class="text-xs font-mono text-gray-500 dark:text-gray-400 block mb-1">
                    {props.player.friendCode}
                </code>
                <div class="flex items-center flex-wrap gap-1.5">
                    <span class="text-xs bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-semibold">
                        VR {props.player.vr ?? "??"}
                    </span>
                    <span class="text-xs bg-cyan-100 dark:bg-cyan-900/40 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-md font-semibold">
                        BR {props.player.br ?? "??"}
                    </span>
                    <Show when={props.showOpenHost}>
                        <span class={`text-xs border px-2 py-0.5 rounded-md font-semibold ${
                            props.player.isOpenHost 
                                ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300" 
                                : "bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                        }`}>
                            {props.player.isOpenHost ? "OH ✓" : "OH ✗"}
                        </span>
                    </Show>
                </div>
            </div>
        </div>
    );

    return (
        <Show
            when={props.showOpenHost}
            fallback={
                <div class="bg-white dark:bg-gray-800 rounded-xl p-3.5 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:shadow-md">
                    {cardContent}
                </div>
            }
        >
            <a
                href={`/player/${props.player.friendCode}`}
                class="block bg-white dark:bg-gray-800 rounded-xl p-3.5 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:shadow-md hover:scale-[1.02]"
            >
                {cardContent}
            </a>
        </Show>
    );
}