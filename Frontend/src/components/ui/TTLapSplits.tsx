import { For, Show } from "solid-js";

interface TTLapSplitsProps {
  lapSplitsDisplay: string[];
  fastestLapMs: number | null; 
  lapSplitsMs: number[];
}

export default function TTLapSplits(props: TTLapSplitsProps) {
    return (
        <div class="space-y-2">
            <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Lap Times
            </div>
            <div class="space-y-1">
                <For each={props.lapSplitsDisplay}>
                    {(lapTime, index) => {
                        const isOverallFlap = props.fastestLapMs !== null && 
                                  props.lapSplitsMs[index()] === props.fastestLapMs;
                        const isFastestInRun = props.lapSplitsMs[index()] === Math.min(...props.lapSplitsMs);
            
                        return (
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600 dark:text-gray-400">
                                    Lap {index() + 1}
                                </span>
                                <div class="flex items-center gap-2">
                                    <span
                                        class={`font-mono text-sm ${
                                            isOverallFlap
                                                ? "text-green-600 dark:text-green-400 font-black text-base"
                                                : isFastestInRun
                                                    ? "text-green-600 dark:text-green-400 font-bold"
                                                    : "text-gray-900 dark:text-white font-medium"
                                        }`}
                                    >
                                        {lapTime}
                                    </span>
                                    <Show when={isOverallFlap}>
                                        <span class="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide shadow-sm">
                                            FLAP
                                        </span>
                                    </Show>
                                    <Show when={!isOverallFlap && isFastestInRun}>
                                        <span class="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-semibold">
                                            Best
                                        </span>
                                    </Show>
                                </div>
                            </div>
                        );
                    }}
                </For>
            </div>
        </div>
    );
}