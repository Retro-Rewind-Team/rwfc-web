import { Show } from "solid-js";
import { RoomPlayer } from "../../types";
import { MiiComponent } from "../ui";

interface PlayerCardProps {
    player: RoomPlayer;
    showOpenHost: boolean;
}

export default function PlayerCard(props: PlayerCardProps) {
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