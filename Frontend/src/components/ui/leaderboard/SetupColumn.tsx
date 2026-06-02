import { For, Show } from "solid-js";
import { SetupEntry, SetupWinRateEntry } from "../../../types/raceStats";

interface SetupColumnProps {
    title: string;
    mode: "usage" | "winrate" | "wincount";
    usageEntries: SetupEntry[];
    winRateEntries?: SetupWinRateEntry[];
    winCountEntries?: SetupWinRateEntry[];
}

function WinRateList(props: { entries: SetupWinRateEntry[] | undefined }) {
    return (
        <Show
            when={(props.entries ?? []).length > 0}
            fallback={
                <p class="text-xs text-gray-400 dark:text-gray-500">
                    Not enough data for this period
                </p>
            }
        >
            <div class="space-y-3">
                <For each={props.entries ?? []}>
                    {(entry, i) => (
                        <div class="flex items-start gap-2">
                            <span class="text-xs text-gray-400 dark:text-gray-500 shrink-0 mt-0.5 w-4">
                                {i() + 1}.
                            </span>
                            <div class="min-w-0">
                                <div class="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">
                                    {entry.name}
                                </div>
                                <div class="text-xs text-gray-400 dark:text-gray-500">
                                    {entry.winRate.toFixed(1)}%{" "}
                                    <span class="text-gray-300 dark:text-gray-600">
                                        ({entry.raceCount.toLocaleString()} races)
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </For>
            </div>
        </Show>
    );
}

function WinCountList(props: { entries: SetupWinRateEntry[] | undefined }) {
    return (
        <Show
            when={(props.entries ?? []).length > 0}
            fallback={
                <p class="text-xs text-gray-400 dark:text-gray-500">
                    Not enough data for this period
                </p>
            }
        >
            <div class="space-y-3">
                <For each={props.entries ?? []}>
                    {(entry, i) => (
                        <div class="flex items-start gap-2">
                            <span class="text-xs text-gray-400 dark:text-gray-500 shrink-0 mt-0.5 w-4">
                                {i() + 1}.
                            </span>
                            <div class="min-w-0">
                                <div class="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">
                                    {entry.name}
                                </div>
                                <div class="text-xs text-gray-400 dark:text-gray-500">
                                    {entry.winCount.toLocaleString()} wins{" "}
                                    <span class="text-gray-300 dark:text-gray-600">
                                        ({entry.raceCount.toLocaleString()} races)
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </For>
            </div>
        </Show>
    );
}

export default function SetupColumn(props: SetupColumnProps) {
    return (
        <div>
            <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {props.title}
            </h3>
            <Show when={props.mode === "usage"}>
                <div class="space-y-3">
                    <For each={props.usageEntries}>
                        {(entry, i) => (
                            <div class="flex items-start gap-2">
                                <span class="text-xs text-gray-400 dark:text-gray-500 shrink-0 mt-0.5 w-4">
                                    {i() + 1}.
                                </span>
                                <div class="min-w-0">
                                    <div class="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">
                                        {entry.name}
                                    </div>
                                    <div class="text-xs text-gray-400 dark:text-gray-500">
                                        {entry.raceCount.toLocaleString()} times
                                    </div>
                                </div>
                            </div>
                        )}
                    </For>
                </div>
            </Show>
            <Show when={props.mode === "winrate"}>
                <WinRateList entries={props.winRateEntries} />
            </Show>
            <Show when={props.mode === "wincount"}>
                <WinCountList entries={props.winCountEntries} />
            </Show>
        </div>
    );
}
