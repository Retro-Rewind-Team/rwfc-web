import { For, Show } from "solid-js";
import { SetupEntry, SetupWinRateEntry } from "../../../types/raceStats";

interface SetupColumnProps {
    title: string;
    mode: "usage" | "winrate" | "wincount";
    usageEntries: SetupEntry[];
    winRateEntries?: SetupWinRateEntry[];
    winCountEntries?: SetupWinRateEntry[];
}

/**
 * One ranked list, used for both win rate and win count. The two were separate components that
 * differed by a single line of stat text and had otherwise been kept in sync by hand.
 */
function RankedEntryList(props: {
    entries: SetupWinRateEntry[] | undefined;
    stat: (entry: SetupWinRateEntry) => string;
}) {
    return (
        <Show
            when={(props.entries ?? []).length > 0}
            fallback={<p class="text-xs text-fg-subtle">Not enough data for this period</p>}
        >
            <div class="space-y-3">
                <For each={props.entries ?? []}>
                    {(entry, i) => (
                        <div class="flex items-start gap-2">
                            <span class="text-xs text-fg-subtle shrink-0 mt-0.5 w-4">
                                {i() + 1}.
                            </span>
                            <div class="min-w-0">
                                <div class="text-sm font-medium text-fg leading-tight">
                                    {entry.name}
                                </div>
                                <div class="text-xs text-fg-subtle">
                                    {props.stat(entry)}{" "}
                                    <span class="text-fg-subtle">
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
            <h3 class="text-sm font-semibold text-fg-subtle mb-3">{props.title}</h3>
            <Show when={props.mode === "usage"}>
                <div class="space-y-3">
                    <For each={props.usageEntries}>
                        {(entry, i) => (
                            <div class="flex items-start gap-2">
                                <span class="text-xs text-fg-subtle shrink-0 mt-0.5 w-4">
                                    {i() + 1}.
                                </span>
                                <div class="min-w-0">
                                    <div class="text-sm font-medium text-fg leading-tight">
                                        {entry.name}
                                    </div>
                                    <div class="text-xs text-fg-subtle">
                                        {entry.raceCount.toLocaleString()} times
                                    </div>
                                </div>
                            </div>
                        )}
                    </For>
                </div>
            </Show>
            <Show when={props.mode === "winrate"}>
                <RankedEntryList
                    entries={props.winRateEntries}
                    stat={(entry) => `${entry.winRate.toFixed(1)}%`}
                />
            </Show>
            <Show when={props.mode === "wincount"}>
                <RankedEntryList
                    entries={props.winCountEntries}
                    stat={(entry) => `${entry.winCount.toLocaleString()} wins`}
                />
            </Show>
        </div>
    );
}
