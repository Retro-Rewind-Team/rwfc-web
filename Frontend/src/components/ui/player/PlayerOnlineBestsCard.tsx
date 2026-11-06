import { createSignal, For, Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { Clock } from "lucide-solid";
import { queryKeys } from "../../../constants/queryKeys";
import { raceStatsApi } from "../../../services/api";

const CC_OPTIONS: { label: string; value: number }[] = [
    { label: "150cc", value: 2 },
    { label: "200cc", value: 1 },
];

interface PlayerOnlineBestsCardProps {
    pid: string;
}

export default function PlayerOnlineBestsCard(props: PlayerOnlineBestsCardProps) {
    const [engineClassId, setEngineClassId] = createSignal<number>(2); // default 150cc
    const [search, setSearch] = createSignal("");

    const bestsQuery = useQuery(() => ({
        queryKey: queryKeys.playerOnlineBests(props.pid),
        queryFn: () => raceStatsApi.getPlayerOnlineBests(props.pid),
        staleTime: 2 * 60 * 1000,
    }));

    const filteredBests = () => {
        const cc = engineClassId();
        const q = search().toLowerCase();
        return (bestsQuery.data ?? [])
            .filter((b) => b.engineClassId === cc)
            .filter((b) => !q || b.trackName.toLowerCase().includes(q));
    };

    return (
        <Show when={!bestsQuery.isLoading && (bestsQuery.data?.length ?? 0) > 0}>
            <div class="bg-canvas rounded-lg border border-line p-6">
                <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <div class="flex items-center gap-2">
                        <Clock size={20} class="text-blue-500 dark:text-blue-400" />
                        <h2 class="text-xl font-semibold text-fg">Online Best Times</h2>
                    </div>
                    <div class="flex gap-1">
                        <For each={CC_OPTIONS}>
                            {(opt) => (
                                <button
                                    type="button"
                                    onClick={() => setEngineClassId(opt.value)}
                                    class={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                        engineClassId() === opt.value
                                            ? "bg-accent text-accent-fg"
                                            : "bg-surface text-fg-muted hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            )}
                        </For>
                    </div>
                </div>

                <input
                    type="text"
                    placeholder="Search tracks..."
                    value={search()}
                    onInput={(e) => setSearch(e.currentTarget.value)}
                    class="w-full text-sm px-3 py-2 mb-4 border border-line rounded-lg bg-canvas text-fg placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                />

                <Show
                    when={filteredBests().length > 0}
                    fallback={<p class="text-sm text-fg-subtle py-4 text-center">No times found</p>}
                >
                    <div class="relative overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="text-left text-xs text-fg-subtle border-b border-line">
                                    <th class="pb-2 font-medium">Track</th>
                                    <th class="pb-2 font-medium">CC</th>
                                    <th class="pb-2 font-medium">Time</th>
                                    <th class="pb-2 font-medium hidden md:table-cell">Mode</th>
                                    <th class="pb-2 font-medium text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                                <For each={filteredBests()}>
                                    {(entry) => (
                                        <tr class="hover:bg-surface transition-colors">
                                            <td class="py-2 pr-3 text-fg">{entry.trackName}</td>
                                            <td class="py-2 pr-3 text-xs text-fg-subtle">
                                                {entry.engineClassId === 1 ? "200cc" : "150cc"}
                                            </td>
                                            <td class="py-2 pr-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                                                {entry.finishTimeDisplay}
                                            </td>
                                            <td class="py-2 pr-3 hidden md:table-cell">
                                                <span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-surface text-fg-muted">
                                                    {entry.gameMode}
                                                </span>
                                            </td>
                                            <td class="py-2 text-right text-xs text-fg-subtle whitespace-nowrap">
                                                {new Date(entry.achievedAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    )}
                                </For>
                            </tbody>
                        </table>
                    </div>
                </Show>
            </div>
        </Show>
    );
}
