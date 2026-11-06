import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { Player } from "../../../types";
import { formatLastSeen, getVRGainClass } from "../../../utils";
import MiiComponent from "../player/MiiComponent";
import PlayerBadges from "../player/PlayerBadges";
import VRTierNumberPlate from "../vrTier/VRTierNumberplate";
import { ArrowDown, ArrowUp } from "lucide-solid/icons/index";
import TriangleAlert from "lucide-solid/icons/triangle-alert";
import Tooltip from "../../common/Tooltip";

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

    /*
     * Sortable headers are real buttons: the old clickable <th> could not be reached by keyboard,
     * and screen readers were never told the sort order. aria-sort sits on the <th>.
     */
    const SortHeader = (h: {
        label: string;
        field: string;
        align?: "left" | "right";
        class?: string;
    }) => {
        const active = () => props.sortBy === h.field;
        return (
            <th
                scope="col"
                aria-sort={active() ? (props.ascending ? "ascending" : "descending") : "none"}
                class={`px-2 py-3 text-xs font-medium text-fg-muted sm:px-4 ${
                    h.align === "right" ? "text-right" : "text-left"
                } ${h.class ?? ""}`}
            >
                <button
                    type="button"
                    onClick={() => props.onSort(h.field)}
                    class={`inline-flex items-center gap-1 rounded-sm transition-colors hover:text-fg ${
                        active() ? "text-fg" : ""
                    }`}
                >
                    {h.label}
                    <Show when={active()}>
                        {props.ascending ? (
                            <ArrowUp size={12} aria-hidden="true" />
                        ) : (
                            <ArrowDown size={12} aria-hidden="true" />
                        )}
                    </Show>
                </button>
            </th>
        );
    };

    return (
        <div class="relative overflow-x-auto">
            <table class="w-full table-fixed">
                <thead class="border-b border-line bg-surface">
                    <tr>
                        <SortHeader label="Rank" field="rank" class="w-20 sm:w-24" />
                        <th
                            scope="col"
                            class="px-2 py-3 text-left text-xs font-medium text-fg-muted sm:px-4"
                        >
                            Player
                        </th>
                        <SortHeader label="VR" field="vr" align="right" class="w-24 sm:w-28" />
                        <th
                            scope="col"
                            class="hidden w-44 px-4 py-3 text-left text-xs font-medium text-fg-muted md:table-cell"
                        >
                            Friend code
                        </th>
                        <Show when={!props.showLegacy}>
                            <SortHeader
                                label="Last seen"
                                field="lastSeen"
                                class="hidden w-36 md:table-cell"
                            />
                            <SortHeader
                                label={`VR change (${getTimePeriodLabel()})`}
                                field={getVRGainSortField()}
                                align="right"
                                class="hidden w-32 sm:table-cell"
                            />
                        </Show>
                    </tr>
                </thead>
                <tbody class="divide-y divide-line">
                    <For each={props.players}>
                        {(player) => {
                            const vrGain = !props.showLegacy ? props.getVRGain(player) : 0;
                            const isOnline =
                                !props.showLegacy &&
                                formatLastSeen(player.lastSeen) === "Now Online";

                            return (
                                <tr
                                    class={`transition-colors hover:bg-surface ${
                                        player.isSuspicious
                                            ? "bg-warn-bg shadow-[inset_3px_0_0_var(--warn-line)]"
                                            : ""
                                    }`}
                                >
                                    <td class="px-2 py-3 sm:px-4">
                                        <VRTierNumberPlate
                                            rank={player.rank}
                                            vr={player.vr}
                                            isSuspicious={player.isSuspicious}
                                            size="sm"
                                        />
                                    </td>

                                    <td class="px-2 py-3 sm:px-4">
                                        <div class="flex items-center gap-3">
                                            {/* The Mii repeats the name link, so it is skipped by
                                                keyboard and screen readers to avoid a duplicate. */}
                                            <A
                                                href={`/player/${player.friendCode}`}
                                                class="hidden shrink-0 sm:block"
                                                tabindex="-1"
                                                aria-hidden="true"
                                            >
                                                <MiiComponent
                                                    playerName={player.name}
                                                    friendCode={player.friendCode}
                                                    size="md"
                                                    className="transition-opacity hover:opacity-80"
                                                    lazy={true}
                                                />
                                            </A>
                                            <div class="min-w-0">
                                                <A
                                                    href={`/player/${player.friendCode}`}
                                                    class="block font-semibold break-words text-fg transition-colors hover:text-accent-text"
                                                >
                                                    {player.name}
                                                </A>
                                                <div class="mt-1 hidden flex-wrap gap-2 sm:flex">
                                                    <Show when={player.isSuspicious}>
                                                        <Tooltip text="This player has been flagged for suspicious VR activity">
                                                            <span class="inline-flex cursor-help items-center gap-1 rounded-sm border border-warn-line bg-warn-bg px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-warn-fg">
                                                                <TriangleAlert
                                                                    size={12}
                                                                    aria-hidden="true"
                                                                />
                                                                Suspicious
                                                            </span>
                                                        </Tooltip>
                                                    </Show>
                                                    <PlayerBadges
                                                        badges={player.badges}
                                                        size="sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td class="px-2 py-3 text-right text-base font-semibold text-fg tabular-nums sm:px-4">
                                        {player.vr.toLocaleString()}
                                        {/* Phones have no room for the VR change column, so the
                                            change sits under the VR instead (the old site showed
                                            it on phones; it must not go missing). */}
                                        <Show when={!props.showLegacy}>
                                            <span
                                                class={`block text-xs sm:hidden ${getVRGainClass(vrGain)}`}
                                            >
                                                <span class="sr-only">
                                                    VR change ({getTimePeriodLabel()}):{" "}
                                                </span>
                                                {vrGain > 0 ? "+" : ""}
                                                {vrGain.toLocaleString()}
                                            </span>
                                        </Show>
                                    </td>

                                    <td class="hidden px-4 py-3 md:table-cell">
                                        <code class="rounded-sm bg-surface px-1.5 py-0.5 font-mono text-xs text-fg-muted">
                                            {player.friendCode}
                                        </code>
                                    </td>

                                    <Show when={!props.showLegacy}>
                                        <td
                                            class={`hidden px-4 py-3 text-sm md:table-cell ${
                                                isOnline
                                                    ? "font-medium text-accent-text"
                                                    : "text-fg-muted"
                                            }`}
                                        >
                                            <span class="inline-flex items-center gap-2">
                                                <Show when={isOnline}>
                                                    <span
                                                        class="h-2 w-2 rounded-full bg-accent"
                                                        aria-hidden="true"
                                                    />
                                                </Show>
                                                {formatLastSeen(player.lastSeen)}
                                            </span>
                                        </td>

                                        <td
                                            class={`hidden px-4 py-3 text-right font-semibold tabular-nums sm:table-cell ${getVRGainClass(vrGain)}`}
                                        >
                                            {vrGain > 0 ? "+" : ""}
                                            {vrGain.toLocaleString()}
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
