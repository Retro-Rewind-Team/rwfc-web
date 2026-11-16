import { createMemo, For, Match, Show, Switch } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { AlertBox, CountUp, TextLink } from "../../common";
import { queryKeys } from "../../../constants/queryKeys";
import { SITE_LINKS } from "../../../constants/siteLinks";
import { roomStatusApi } from "../../../services/api/room";
import { busiestPublicRooms, formatRelativeTime } from "../../../utils/homeData";

/*
 * A single fetch, no polling. The home page is not the room browser, and a number that silently
 * changes under the reader is harder to trust than one with a clear timestamp.
 */
export default function RoomSnapshot() {
    const snapshotQuery = useQuery(() => ({
        queryKey: queryKeys.roomSnapshot,
        queryFn: () => roomStatusApi.getLatestRoomStatus(),
        staleTime: 1000 * 60,
        refetchOnWindowFocus: false,
    }));

    const summary = createMemo(() => {
        const data = snapshotQuery.data;
        if (!data) return null;
        const publicRooms = data.rooms.filter((r) => r.isPublic).length;
        return {
            players: data.totalPlayers,
            publicRooms,
            privateRooms: data.rooms.length - publicRooms,
            takenAt: new Date(data.timestamp),
            rooms: busiestPublicRooms(data.rooms),
        };
    });

    return (
        <Switch>
            <Match when={snapshotQuery.isError}>
                <AlertBox type="info" title="Room data is unavailable right now">
                    <p>
                        Try the room browser, or ask in the{" "}
                        <TextLink href={SITE_LINKS.discord} newTab>
                            Discord
                        </TextLink>
                        .
                    </p>
                </AlertBox>
            </Match>
            <Match when={snapshotQuery.isPending}>
                <div class="h-64 rounded-lg border border-line bg-surface" aria-hidden="true" />
            </Match>
            <Match when={summary()}>
                {(s) => (
                    <div class="rounded-lg border border-line bg-canvas">
                        <p class="border-b border-line px-5 py-3 text-sm text-fg-muted">
                            Snapshot taken{" "}
                            <time datetime={s().takenAt.toISOString()} class="text-fg">
                                {formatRelativeTime(s().takenAt.toISOString())}
                            </time>{" "}
                            at{" "}
                            {s().takenAt.toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                            })}{" "}
                            your time. It does not update on this page.
                        </p>

                        <dl class="grid grid-cols-3 divide-x divide-line border-b border-line">
                            <For
                                each={[
                                    { label: "Players in rooms", value: s().players },
                                    { label: "Public rooms", value: s().publicRooms },
                                    { label: "Private rooms", value: s().privateRooms },
                                ]}
                            >
                                {(stat) => (
                                    <div class="px-5 py-4">
                                        <dt class="text-xs text-fg-muted sm:text-sm">
                                            {stat.label}
                                        </dt>
                                        <dd class="mt-1 text-2xl font-semibold tracking-tight text-fg tabular-nums">
                                            <CountUp value={stat.value} />
                                        </dd>
                                    </div>
                                )}
                            </For>
                        </dl>

                        <Show
                            when={s().rooms.length > 0}
                            fallback={
                                <p class="px-5 py-6 text-sm text-fg-muted">
                                    No public rooms had players when this snapshot was taken.
                                </p>
                            }
                        >
                            <table class="w-full text-left text-sm">
                                <caption class="px-5 pt-4 pb-2 text-left text-sm font-semibold text-fg">
                                    Busiest public rooms
                                </caption>
                                <thead class="text-xs text-fg-subtle">
                                    <tr class="border-b border-line">
                                        <th scope="col" class="px-5 py-2 font-medium">
                                            Room
                                        </th>
                                        <th scope="col" class="px-2 py-2 text-right font-medium">
                                            Players
                                        </th>
                                        <th scope="col" class="px-5 py-2 font-medium">
                                            Racing on
                                        </th>
                                        <th
                                            scope="col"
                                            class="hidden px-5 py-2 text-right font-medium sm:table-cell"
                                        >
                                            Average VR
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-line">
                                    <For each={s().rooms}>
                                        {(room) => (
                                            <tr>
                                                <td class="px-5 py-3 font-medium text-fg">
                                                    {room.roomType || "Public room"}
                                                </td>
                                                <td class="px-2 py-3 text-right text-fg tabular-nums">
                                                    {room.players.length}
                                                </td>
                                                <td class="px-5 py-3 text-fg-muted">
                                                    {room.race?.trackName ?? "Not racing"}
                                                </td>
                                                <td class="hidden px-5 py-3 text-right text-fg-muted tabular-nums sm:table-cell">
                                                    {room.averageVR?.toLocaleString() ?? "Unknown"}
                                                </td>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                        </Show>
                    </div>
                )}
            </Match>
        </Switch>
    );
}
