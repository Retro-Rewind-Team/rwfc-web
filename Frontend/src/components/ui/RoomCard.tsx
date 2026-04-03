import { createSignal, For, Show } from "solid-js";
import {
    ChevronDown,
    CircleCheck,
    CirclePause,
    CircleX,
    Clock,
    Lock,
    LockOpen,
    MapPin,
    TrendingUp,
    Users,
} from "lucide-solid";
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
    const isVoting = () => props.room.isSuspended;

    const uptime = () => {
        void props.tick;
        return props.getRoomUptime(props.room.created);
    };

    return (
        <div class="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
            {/* Room Header */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded())}
                class="w-full p-5 text-left bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
                <div class="flex items-start justify-between gap-4">
                    <div class="flex-1 min-w-0">
                        <Show when={props.room.roomType}>
                            <h3 class="text-white text-2xl sm:text-3xl font-extrabold truncate mb-3">
                                {props.room.roomType}
                            </h3>
                        </Show>

                        <div class="flex flex-wrap items-center gap-2">
                            {/* Public/Private */}
                            <div
                                class={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs ${
                                    props.room.isPublic
                                        ? "bg-emerald-500/90 text-white"
                                        : "bg-red-500/90 text-white"
                                }`}
                            >
                                {props.room.isPublic ? (
                                    <LockOpen size={12} />
                                ) : (
                                    <Lock size={12} />
                                )}
                                <span>{props.room.isPublic ? "Public" : "Private"}</span>
                            </div>

                            {/* Joinability */}
                            <div
                                class={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs ${
                                    isVoting()
                                        ? "bg-purple-500/90 text-white"
                                        : isJoinable()
                                            ? "bg-emerald-500/90 text-white"
                                            : "bg-gray-500/90 text-white"
                                }`}
                            >
                                {isVoting() ? (
                                    <CirclePause size={12} />
                                ) : isJoinable() ? (
                                    <CircleCheck size={12} />
                                ) : (
                                    <CircleX size={12} />
                                )}
                                <span>
                                    {isVoting()
                                        ? "Voting"
                                        : isJoinable()
                                            ? "Joinable"
                                            : playerCount() >= 12
                                                ? "Full"
                                                : "Not Joinable"}
                                </span>
                            </div>

                            {/* Player count */}
                            <div class="flex items-center gap-1.5 px-3 py-1.5 bg-white/25 rounded-lg font-bold text-xs text-white">
                                <Users size={12} />
                                <span>{playerCount()}/12 Players</span>
                            </div>

                            {/* Uptime */}
                            <Show when={props.isLatest}>
                                <div class="flex items-center gap-1.5 px-3 py-1.5 bg-white/25 rounded-lg font-bold text-xs text-white">
                                    <Clock size={12} />
                                    <span>{uptime()}</span>
                                </div>
                            </Show>

                            {/* Average VR */}
                            <Show when={props.room.averageVR !== null}>
                                <div class="flex items-center gap-1.5 px-3 py-1.5 bg-white/25 rounded-lg font-bold text-xs text-white">
                                    <TrendingUp size={12} />
                                    <span>Avg VR: {Math.round(props.room.averageVR!)}</span>
                                </div>
                            </Show>

                            {/* Last Played Track */}
                            <Show when={props.room.race?.trackName}>
                                <div class="flex items-center gap-1.5 px-3 py-1.5 bg-white/25 rounded-lg font-bold text-xs text-white">
                                    <MapPin size={12} />
                                    <span class="truncate max-w-[160px]">
                                        {props.room.race!.trackName}
                                    </span>
                                </div>
                            </Show>
                        </div>
                    </div>

                    {/* Expand toggle */}
                    <div class="flex-shrink-0 bg-white/25 p-2.5 rounded-lg hover:bg-white/35 transition-colors border border-white/30">
                        <ChevronDown
                            size={20}
                            class={`text-white transition-transform ${isExpanded() ? "rotate-180" : ""}`}
                        />
                    </div>
                </div>
            </button>

            {/* Players Grid */}
            <Show when={isExpanded()}>
                <div class="p-5 bg-gray-50 dark:bg-gray-900/30">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        <For each={props.room.players}>
                            {(player) => (
                                <PlayerCard
                                    player={player}
                                    showOpenHost={props.room.isPublic}
                                />
                            )}
                        </For>
                    </div>
                </div>
            </Show>
        </div>
    );
}
