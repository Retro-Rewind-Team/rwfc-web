import { createSignal, For, Show } from "solid-js";
import { Room } from "../../types";
import PlayerCard from "./PlayerCard";

interface RoomCardProps {
    room: Room;
    getRoomUptime: (created: string) => string;
    isLatest: boolean;
    tick: number;
}

export default function RoomCard(props: RoomCardProps) {
    const [isExpanded, setIsExpanded] = createSignal(true);
    const playerCount = () => props.room.players.length;
    const isJoinable = () => props.room.isJoinable;
    
    const uptime = () => {
        if (props.isLatest) {
            void props.tick;
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