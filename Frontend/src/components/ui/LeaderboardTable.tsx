import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { Player } from "../../types";
import { formatLastSeen, getVRGainClass } from "../../utils";
import { MiiComponent, PlayerBadges, VRTierNumberPlate } from "../ui";

interface LeaderboardTableProps {
    players: Player[];
    showLegacy: boolean;
    sortBy: string;
    ascending: boolean;
    timePeriod: string;
    onSort: (field: string) => void;
    getVRGain: (player: Player) => number;
}

export default function LeaderboardTable(props: LeaderboardTableProps) {
    const getTimePeriodLabel = () => {
        if (props.timePeriod === "24") return "24h";
        if (props.timePeriod === "week") return "7d";
        return "30d";
    };

    const getVRGainSortField = () => {
        if (props.timePeriod === "24") return "vrgain24";
        if (props.timePeriod === "week") return "vrgain7";
        return "vrgain30";
    };

    return (
        <div class="overflow-x-auto">
            <table class="w-full table-fixed">
                <thead class={props.showLegacy ? "bg-amber-600 text-white" : "bg-blue-600 text-white"}>
                    <tr>
                        <th
                            class={`px-6 py-4 text-center cursor-pointer transition-colors ${
                                props.showLegacy ? "hover:bg-amber-700" : "hover:bg-blue-700"
                            }`}
                            onClick={() => props.onSort("rank")}
                        >
                            <div class="flex items-center justify-center space-x-2">
                                <span class="font-bold">Rank</span>
                                <Show when={props.sortBy === "rank"}>
                                    <span class="text-sm">{props.ascending ? "↑" : "↓"}</span>
                                </Show>
                            </div>
                        </th>
                        <th class="px-6 py-4 text-center font-bold">User</th>
                        <th
                            class={`px-6 py-4 text-center cursor-pointer transition-colors ${
                                props.showLegacy ? "hover:bg-amber-700" : "hover:bg-blue-700"
                            }`}
                            onClick={() => props.onSort("vr")}
                        >
                            <div class="flex items-center justify-center space-x-2">
                                <span class="font-bold">VR</span>
                                <Show when={props.sortBy === "vr"}>
                                    <span class="text-sm">{props.ascending ? "↓" : "↑"}</span>
                                </Show>
                            </div>
                        </th>
                        <th class="px-6 py-4 text-center hidden md:table-cell font-bold">
                            Friend Code
                        </th>
                        
                        <Show when={!props.showLegacy}>
                            <th
                                class="px-6 py-4 text-center cursor-pointer hover:bg-blue-700 transition-colors hidden md:table-cell"
                                onClick={() => props.onSort("lastSeen")}
                            >
                                <div class="flex items-center justify-center space-x-2">
                                    <span class="font-bold">Last Seen</span>
                                    <Show when={props.sortBy === "lastSeen"}>
                                        <span class="text-sm">{props.ascending ? "↓" : "↑"}</span>
                                    </Show>
                                </div>
                            </th>

                            <th
                                class="px-6 py-4 text-center cursor-pointer hover:bg-blue-700 transition-colors"
                                onClick={() => props.onSort(getVRGainSortField())}
                            >
                                <div class="flex items-center justify-center space-x-2">
                                    <span class="font-bold">VR Change ({getTimePeriodLabel()})</span>
                                    <Show when={props.sortBy === getVRGainSortField()}>
                                        <span class="text-sm">{props.ascending ? "↓" : "↑"}</span>
                                    </Show>
                                </div>
                            </th>
                        </Show>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    <For each={props.players}>
                        {(player) => {
                            const vrGain = !props.showLegacy ? props.getVRGain(player) : 0;
                            const isOnline = !props.showLegacy && formatLastSeen(player.lastSeen) === "Now Online";

                            return (
                                <tr
                                    class={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                                        player.isSuspicious ? "bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500" : ""
                                    }`}
                                >
                                    <td class="px-6 py-4 text-center">
                                        <div class="flex items-center justify-center">
                                            <VRTierNumberPlate
                                                rank={player.rank}
                                                vr={player.vr}
                                                isSuspicious={player.isSuspicious}
                                                size="sm"
                                            />
                                        </div>
                                    </td>

                                    <td class="px-6 py-4 align-top">
                                        <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 md:gap-6 w-full">
                                            <A
                                                href={`/player/${player.friendCode}`}
                                                class="flex-shrink-0 mx-auto sm:mx-0"
                                            >
                                                <MiiComponent
                                                    playerName={player.name}
                                                    friendCode={player.friendCode}
                                                    size="md"
                                                    className="transition-opacity hover:opacity-80"
                                                    lazy={true}
                                                />
                                            </A>

                                            <div class="w-full sm:flex-1 text-center sm:text-left">
                                                <A
                                                    href={`/player/${player.friendCode}`}
                                                    class="block font-bold text-lg text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors whitespace-normal break-words"
                                                >
                                                    {player.name}
                                                </A>

                                                <div class="hidden sm:flex flex-wrap gap-2 mt-1 justify-center sm:justify-start">
                                                    <Show when={player.isSuspicious}>
                                                        <span class="inline-flex items-center text-xs bg-red-200 dark:bg-red-800 text-red-600 dark:text-red-400 px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                                                            ⚠️ Suspicious
                                                        </span>
                                                    </Show>
                                                    
                                                    {/*Player Badges */}
                                                    <PlayerBadges 
                                                        friendCode={player.friendCode} 
                                                        size="sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td class="px-6 py-4 text-center">
                                        <span class="text-xl font-bold text-gray-900 dark:text-white">
                                            {player.vr.toLocaleString()}
                                        </span>
                                    </td>

                                    <td class="px-6 py-4 text-center hidden md:table-cell">
                                        <code class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-sm font-mono text-gray-900 dark:text-white">
                                            {player.friendCode}
                                        </code>
                                    </td>

                                    <Show when={!props.showLegacy}>
                                        <td
                                            class={`px-6 py-4 text-center hidden md:table-cell font-medium ${
                                                isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400"
                                            }`}
                                        >
                                            {isOnline && (
                                                <span class="inline-flex items-center">
                                                    <span class="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                                                </span>
                                            )}
                                            {formatLastSeen(player.lastSeen)}
                                        </td>

                                        <td class="px-6 py-4 text-center">
                                            <span class={`text-lg font-bold ${getVRGainClass(vrGain)}`}>
                                                {vrGain > 0 ? "+" : ""}
                                                {vrGain}
                                            </span>
                                        </td>
                                    </Show>
                                </tr>
                            );
                        }}
                    </For>
                </tbody>
            </table>
        </div>
    );
}