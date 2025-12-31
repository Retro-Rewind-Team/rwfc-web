import { For, Show } from "solid-js";
import { Track } from "../../types/timeTrial";
import { LoadingSpinner } from "../common";

interface TTTrackListProps {
  tracks: Track[];
  selectedTrack: Track | null;
  category: "retro" | "custom";
  isLoading: boolean;
  isError: boolean;
  onTrackSelect: (track: Track) => void;
}

export default function TTTrackList(props: TTTrackListProps) {
    return (
        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
                <h2 class="text-lg font-bold text-white">
                    {props.category === "retro" ? "🏁 Retro Tracks" : "⭐ Custom Tracks"}
                </h2>
                <p class="text-sm text-blue-100">
                    {props.tracks.length} track{props.tracks.length !== 1 ? "s" : ""}
                </p>
            </div>

            <Show when={props.isLoading}>
                <div class="p-8 text-center">
                    <LoadingSpinner />
                </div>
            </Show>

            <Show when={props.isError}>
                <div class="p-4 text-center text-red-600 dark:text-red-400">
          Failed to load tracks
                </div>
            </Show>

            <Show when={!props.isLoading && !props.isError}>
                <div class="max-h-[600px] overflow-y-auto">
                    <For each={props.tracks}>
                        {(track) => (
                            <button
                                onClick={() => props.onTrackSelect(track)}
                                class={`w-full px-4 py-3 text-left transition-colors border-b border-gray-200 dark:border-gray-700 ${
                                    props.selectedTrack?.id === track.id
                                        ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600"
                                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                }`}
                            >
                                <div class="font-medium text-gray-900 dark:text-white">
                                    {track.name}
                                </div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">
                                    {track.laps} lap{track.laps !== 1 ? "s" : ""}
                                </div>
                            </button>
                        )}
                    </For>

                    <Show when={props.tracks.length === 0}>
                        <div class="p-8 text-center text-gray-500 dark:text-gray-400">
              No tracks found
                        </div>
                    </Show>
                </div>
            </Show>
        </div>
    );
}