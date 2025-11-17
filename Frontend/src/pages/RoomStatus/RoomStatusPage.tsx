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
            <section class="py-8">
                <div class="max-w-5xl mx-auto text-center">
                    <div class="mb-6">
                        <div class="flex items-center justify-center mb-4">
                            <h1 class="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
                Room Browser
                            </h1>
                        </div>
                        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Real-time view of active rooms and players on RWFC servers
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <Show when={statsQuery.data}>
                        <div class="grid grid-cols-2 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 p-6 transition-colors shadow-lg hover:shadow-xl">
                                <div class="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                                    {statsQuery.data!.totalPlayers}
                                </div>
                                <div class="text-sm font-medium text-gray-600 dark:text-gray-400">Players Online</div>
                            </div>
                            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 p-6 transition-colors shadow-lg hover:shadow-xl">
                                <div class="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                                    {statsQuery.data!.totalRooms}
                                </div>
                                <div class="text-sm font-medium text-gray-600 dark:text-gray-400">Active Rooms</div>
                            </div>
                        </div>
                    </Show>
                </div>
            </section>

            {/* Navigation Controls */}
            <Show when={roomStatusQuery.data}>
                <div class="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm p-4">
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Navigation Buttons */}
                        <div class="flex items-center gap-2">
                            <button
                                onClick={goToOldest}
                                disabled={!canGoBackward()}
                                class="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-all hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Jump to oldest"
                            >
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                                </svg>
                            </button>
                            <button
                                onClick={goBackward}
                                disabled={!canGoBackward()}
                                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium transition-all hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" />
                                </svg>
                                <span class="hidden sm:inline">Previous</span>
                            </button>
                            <button
                                onClick={goForward}
                                disabled={!canGoForward()}
                                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium transition-all hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <span class="hidden sm:inline">Next</span>
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" />
                                </svg>
                            </button>
                            <button
                                onClick={goToLatest}
                                disabled={isLatest()}
                                class="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-all hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Jump to latest"
                            >
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" />
                                </svg>
                            </button>

                            <Show when={isLatest()}>
                                <div class="ml-4 flex items-center bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-full">
                                    <span class="w-3 h-3 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                                    <span class="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    LIVE
                                    </span>
                                </div>
                            </Show>
                        </div>

                        {/* Data Info */}
                        <div class="text-center sm:text-right">
                            <div class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Snapshot #{roomStatusQuery.data!.id}
                                <span class="mx-2 text-gray-400 dark:text-gray-600">•</span>
                                {formatTimestamp(roomStatusQuery.data!.timestamp)}
                            </div>
                            <Show when={!isLatest()}>
                                <div class="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1 flex items-center justify-center sm:justify-end gap-1">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                                    </svg>
                  Historical Data
                                </div>
                            </Show>
                        </div>
                    </div>
                </div>
            </Show>

            {/* Loading State */}
            <Show when={roomStatusQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
                    <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p class="text-lg text-gray-600 dark:text-gray-400 font-medium">
            Loading room data...
                    </p>
                </div>
            </Show>

            {/* Error State */}
            <Show when={roomStatusQuery.isError}>
                <div class="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-xl p-8 shadow-sm">
                    <div class="text-center">
                        <div class="text-6xl mb-4">😵</div>
                        <div class="text-red-600 dark:text-red-400 text-xl font-bold mb-2">
              Couldn't load room data
                        </div>
                        <p class="text-red-500 dark:text-red-400 mb-6">
                            {roomStatusQuery.error?.message || "Something went wrong"}
                        </p>
                        <button
                            onClick={() => roomStatusQuery.refetch()}
                            class="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-all hover:scale-105 shadow-lg"
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
                <div class="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-8 shadow-sm">
                    <div class="text-center">
                        <div class="text-6xl mb-4">🏜️</div>
                        <div class="text-amber-800 dark:text-amber-200 text-xl font-bold mb-2">
              No rooms found
                        </div>
                        <p class="text-amber-700 dark:text-amber-300 mb-4">
              Nobody is racing right now, or the server may be experiencing issues.
                        </p>
                        <p class="text-sm text-amber-600 dark:text-amber-400">
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

// Room Card Component - Should be in its own file eventually
function RoomCard(props: {
  room: Room;
  getRoomUptime: (created: string) => string;
  isLatest: boolean;
  tick: number;
}) {
    const playerCount = () => props.room.players.length;
    const isJoinable = () => playerCount() < 12;
  
    // Access tick to trigger recalculation
    const uptime = () => {
        void props.tick; // Access to create dependency
        return props.getRoomUptime(props.room.created);
    };

    return (
        <div class="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all overflow-hidden">
            {/* Room Header */}
            <div class="p-5 bg-blue-500 dark:bg-gray-700">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div class="flex flex-wrap items-center gap-2">
                        {/* Public/Private Badge */}
                        <span
                            class={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${
                                props.room.isPublic
                                    ? "border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30"
                                    : "border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30"
                            } border`}
                        >
                            {props.room.isPublic ? "PUBLIC" : "PRIVATE"}
                        </span>

                        {/* Room Type */}
                        <Show when={props.room.roomType}>
                            <span class="text-white font-bold text-lg px-3 py-1 bg-white/20 rounded-lg backdrop-blur-sm">
                                {props.room.roomType}
                            </span>
                        </Show>
                    </div>

                    {/* Right Side Info */}
                    <div class="flex flex-wrap items-center gap-3 text-white">
                        {/* Uptime */}
                        <div class="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                            </svg>
                            <span class="text-sm font-mono font-bold">{uptime()}</span>
                        </div>

                        {/* Player Count */}
                        <div class="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                            <span class="font-bold">{playerCount()}/12</span>
                        </div>

                        {/* Joinable Badge */}
                        <span
                            class={`px-3 py-1.5 rounded-full text-xs font-bold border shadow-lg ${
                                isJoinable()
                                    ? "border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30"
                                    : "border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30"
                            }`}
                        >
                            {isJoinable() ? "JOINABLE" : "FULL"}
                        </span>
                    </div>
                </div>

                {/* Second Row - Average VR and Room ID */}
                <div class="flex flex-wrap items-center gap-3 mt-3 text-white/90 text-sm">
                    <Show when={props.room.averageVR && props.room.averageVR > 0}>
                        <div class="flex items-center gap-2">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
                            </svg>
                            <span class="font-bold">Avg VR: {props.room.averageVR}</span>
                        </div>
                    </Show>
                    <div class="flex items-center gap-2 bg-white/10 rounded px-2 py-1">
                        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                        </svg>
                        <span class="text-xs font-mono">{props.room.id}</span>
                    </div>
                </div>
            </div>

            {/* Players Grid */}
            <div class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                <For each={props.room.players}>
                    {(player) => <PlayerCard player={player} showOpenHost={props.room.isPublic} />}
                </For>
            </div>
        </div>
    );
}

function PlayerCard(props: { player: RoomPlayer; showOpenHost: boolean }) {
    return (
        <Show
            when={props.showOpenHost}
            fallback={
                <div class="bg-white dark:bg-gray-800 rounded-lg p-3 hover:shadow-md transition-all border-2 border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-3">
                        {/* Mii */}
                        <div class="flex-shrink-0">
                            <Show
                                when={props.player.mii}
                                fallback={
                                    <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-600">
                                        <span class="text-xs font-bold text-gray-600 dark:text-gray-300">
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
                            <div class="font-bold text-gray-900 dark:text-white truncate">
                                {props.player.mii?.name || props.player.name}
                            </div>
                            <code class="text-xs font-mono text-gray-500 dark:text-gray-400 block">
                                {props.player.friendCode}
                            </code>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded font-medium">
                        VR {props.player.vr ?? "??"}
                                </span>
                                <span class="text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded font-medium">
                        BR {props.player.br ?? "??"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <a
                href={`/player/${props.player.friendCode}`}
                class="block bg-white dark:bg-gray-800 rounded-lg p-3 hover:shadow-md transition-all border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600"
            >
                <div class="flex items-center gap-3">
                    {/* Mii */}
                    <div class="flex-shrink-0">
                        <Show
                            when={props.player.mii}
                            fallback={
                                <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-600">
                                    <span class="text-xs font-bold text-gray-600 dark:text-gray-300">
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
                        <div class="font-bold text-gray-900 dark:text-white truncate">
                            {props.player.mii?.name || props.player.name}
                        </div>
                        <code class="text-xs font-mono text-gray-500 dark:text-gray-400 block">
                            {props.player.friendCode}
                        </code>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded font-medium">
                    VR {props.player.vr ?? "??"}
                            </span>
                            <span class="text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded font-medium">
                    BR {props.player.br ?? "??"}
                            </span>
                            <span class={`text-xs border px-2 py-0.5 rounded font-medium ${
                                props.player.isOpenHost 
                                    ? "border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30" 
                                    : "border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30"
                            }`}>
                                {props.player.isOpenHost ? "OH ✓" : "OH ✗"}
                            </span>
                        </div>
                    </div>
                </div>
            </a>
        </Show>
    );
}
