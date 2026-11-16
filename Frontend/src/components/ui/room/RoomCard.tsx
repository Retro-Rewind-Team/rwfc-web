import { createMemo, createSignal, For, Index, Show } from "solid-js";
import {
    AlertTriangle,
    ChevronDown,
    Clock,
    Lock,
    LockOpen,
    MapPin,
    TrendingUp,
} from "lucide-solid";
import { Room } from "../../../types";
import { detectSplitGroups } from "../../../utils";
import PlayerCard from "../player/PlayerCard";

interface RoomCardProps {
    room: Room;
    getRoomUptime: (created: string) => string;
    isLatest: boolean;
    tick: number;
    highlightFc?: string;
}

/** Rooms hold up to 12 racers; the occupancy strip draws one slot for each. */
const ROOM_SIZE = 12;

/*
 * One room in the browser. The header is a single toggle button that summarises the room so
 * the list scans quickly: name, a 12-slot occupancy strip, status, and race details. Status uses
 * colour sparingly: the accent for "joinable", the warning tone for voting and split rooms,
 * neutral for everything else. Empty rooms are dimmed so active ones stand out.
 */
export default function RoomCard(props: RoomCardProps) {
    const [isExpanded, setIsExpanded] = createSignal(true);
    const playerCount = () => props.room.players.length;
    const isEmpty = () => playerCount() === 0;
    const isJoinable = () => props.room.isJoinable;
    const isVoting = () => props.room.isSuspended;
    const splitGroups = createMemo(() => detectSplitGroups(props.room.players));
    const isSplit = () => splitGroups().length > 1;
    const bodyId = () => `room-${props.room.id}-players`;

    const uptime = () => {
        void props.tick;
        return props.getRoomUptime(props.room.created);
    };

    const status = () => {
        if (isVoting()) return { label: "Voting", tone: "warn" as const };
        if (isJoinable()) return { label: "Joinable", tone: "accent" as const };
        return {
            label: playerCount() >= ROOM_SIZE ? "Full" : "Not joinable",
            tone: "neutral" as const,
        };
    };

    const toneClass = {
        accent: "border-transparent bg-accent-soft text-accent-text",
        warn: "border-warn-line bg-warn-bg text-warn-fg",
        neutral: "border-line text-fg-muted",
    };

    const Meta = (metaProps: { icon: typeof Clock; children: string | number }) => (
        <span class="inline-flex items-center gap-1.5 text-sm text-fg-muted">
            <metaProps.icon size={14} aria-hidden="true" class="shrink-0 text-fg-subtle" />
            {metaProps.children}
        </span>
    );

    return (
        <article
            // Empty rooms get a dashed edge rather than reduced opacity, which would also lower
            // their text contrast.
            class={`overflow-hidden rounded-lg border bg-canvas transition-colors hover:border-line-strong ${
                isEmpty() ? "border-dashed border-line-strong" : "border-line"
            }`}
            aria-label={`${props.room.roomType || "Room"} ${props.room.id}`}
        >
            <h2>
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded())}
                    aria-expanded={isExpanded()}
                    aria-controls={bodyId()}
                    class="block w-full p-4 text-left transition-colors hover:bg-surface sm:p-5"
                >
                    <span class="flex items-start justify-between gap-4">
                        <span class="block min-w-0 flex-1">
                            <span class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                <span class="type-heading text-fg">
                                    {props.room.roomType || "Room"}
                                </span>
                                <span class="font-mono text-xs text-fg-subtle">
                                    {props.room.id}
                                </span>
                            </span>

                            <span class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                                <span
                                    class={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-xs font-medium ${
                                        toneClass[status().tone]
                                    }`}
                                >
                                    {status().label}
                                </span>
                                <Show when={isSplit()}>
                                    <span
                                        class={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-xs font-medium ${toneClass.warn}`}
                                    >
                                        <AlertTriangle size={12} aria-hidden="true" />
                                        Split into {splitGroups().length} groups
                                    </span>
                                </Show>
                                <Meta icon={props.room.isPublic ? LockOpen : Lock}>
                                    {props.room.isPublic ? "Public" : "Private"}
                                </Meta>
                                <Show when={props.room.race?.trackName}>
                                    <Meta icon={MapPin}>{props.room.race!.trackName!}</Meta>
                                </Show>
                                {/* Hidden when split: each group shows its own average below. */}
                                <Show when={props.room.averageVR !== null && !isSplit()}>
                                    <Meta icon={TrendingUp}>
                                        {`${Math.round(props.room.averageVR!).toLocaleString()} avg VR`}
                                    </Meta>
                                </Show>
                                <Show when={props.isLatest}>
                                    <Meta icon={Clock}>{uptime()}</Meta>
                                </Show>
                            </span>
                        </span>

                        <span class="flex shrink-0 items-start gap-3">
                            <span class="block text-right">
                                <span class="block text-lg font-semibold text-fg tabular-nums">
                                    {playerCount()}
                                    <span class="text-sm font-normal text-fg-subtle">
                                        /{ROOM_SIZE}
                                    </span>
                                </span>
                                <span class="mt-1.5 hidden gap-0.5 sm:flex" aria-hidden="true">
                                    <Index each={Array.from({ length: ROOM_SIZE })}>
                                        {(_, i) => (
                                            <span
                                                class={`h-2 w-2 ${
                                                    i < playerCount() ? "bg-accent" : "bg-line"
                                                }`}
                                            />
                                        )}
                                    </Index>
                                </span>
                                <span class="sr-only">players</span>
                            </span>
                            <ChevronDown
                                size={20}
                                aria-hidden="true"
                                class={`mt-1 text-fg-subtle transition-transform duration-(--motion-base) ${
                                    isExpanded() ? "rotate-180" : ""
                                }`}
                            />
                        </span>
                    </span>
                </button>
            </h2>

            <Show when={isExpanded()}>
                <div id={bodyId()} class="border-t border-line p-4 sm:p-5">
                    <Show
                        when={!isEmpty()}
                        fallback={
                            <p class="text-sm text-fg-subtle">Nobody is in this room right now.</p>
                        }
                    >
                        <Show
                            when={isSplit()}
                            fallback={
                                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    <For each={props.room.players}>
                                        {(player) => (
                                            <PlayerCard
                                                player={player}
                                                showOpenHost={props.room.isPublic}
                                                highlightFc={props.highlightFc}
                                            />
                                        )}
                                    </For>
                                </div>
                            }
                        >
                            <div class="space-y-5">
                                <For each={splitGroups()}>
                                    {(group, i) => {
                                        const withVr = group.filter(
                                            (p) => p.vr !== null && p.vr! > 0,
                                        );
                                        const avgVr =
                                            withVr.length > 0
                                                ? Math.round(
                                                      withVr.reduce((sum, p) => sum + p.vr!, 0) /
                                                          withVr.length,
                                                  )
                                                : null;
                                        return (
                                            <div>
                                                {/* Groups label A to Z; clamped defensively (rooms hold 12 at most). */}
                                                <h3 class="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-2 text-sm">
                                                    <span class="font-semibold text-warn-fg">
                                                        Group{" "}
                                                        {String.fromCharCode(
                                                            65 + Math.min(i(), 25),
                                                        )}
                                                    </span>
                                                    <span class="text-fg-muted">
                                                        {group.length}{" "}
                                                        {group.length === 1 ? "player" : "players"}
                                                    </span>
                                                    <Show when={avgVr !== null}>
                                                        <span class="text-fg-muted tabular-nums">
                                                            {avgVr!.toLocaleString()} avg VR
                                                        </span>
                                                    </Show>
                                                </h3>
                                                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                                    <For each={group}>
                                                        {(player) => (
                                                            <PlayerCard
                                                                player={player}
                                                                showOpenHost={props.room.isPublic}
                                                                highlightFc={props.highlightFc}
                                                            />
                                                        )}
                                                    </For>
                                                </div>
                                            </div>
                                        );
                                    }}
                                </For>
                            </div>
                        </Show>
                    </Show>
                </div>
            </Show>
        </article>
    );
}
