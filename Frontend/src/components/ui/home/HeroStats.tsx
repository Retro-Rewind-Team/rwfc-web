import { createMemo, For, JSX, Match, Switch } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { CountUp } from "../../common";
import { queryKeys } from "../../../constants/queryKeys";
import { leaderboardApi } from "../../../services/api/leaderboard";
import { roomStatusApi } from "../../../services/api/room";
import { timeTrialApi } from "../../../services/api/timeTrial";
import { countTracks } from "../../../utils/homeData";

interface Stat {
    label: string;
    value: number | null | undefined;
    loading: boolean;
}

/*
 * The three headline numbers the old home page showed: total players, Discord members and
 * tracks. All live, from the same sources as before (player count endpoint, the Discord invite,
 * the track list). Shown as one quiet strip with dividers rather than coloured cards. Each cell
 * keeps its height while loading so nothing shifts, and says so plainly if a source fails.
 */
export default function HeroStats() {
    const pcountQuery = useQuery(() => ({
        queryKey: queryKeys.pcount,
        queryFn: () => roomStatusApi.getPlayerCount(),
        refetchInterval: 300000,
    }));

    // getDiscordMemberCount resolves to null (not an error) when Discord does not answer.
    const discordQuery = useQuery(() => ({
        queryKey: queryKeys.discordMembers,
        queryFn: () => leaderboardApi.getDiscordMemberCount(),
        refetchInterval: 300000,
    }));

    // Same key as the track sample and ticker, so this adds no request.
    const tracksQuery = useQuery(() => ({
        queryKey: queryKeys.ttTracks,
        queryFn: () => timeTrialApi.getAllTracks(),
        staleTime: 1000 * 60 * 60,
    }));

    const stats = createMemo<Stat[]>(() => [
        {
            label: "Total players",
            value: pcountQuery.data?.count,
            loading: pcountQuery.isPending,
        },
        {
            label: "Discord members",
            value: discordQuery.data,
            loading: discordQuery.isPending,
        },
        {
            label: "Tracks available",
            value: tracksQuery.data ? countTracks(tracksQuery.data).total : undefined,
            loading: tracksQuery.isPending,
        },
    ]);

    const Value = (v: { stat: Stat }): JSX.Element => (
        <Switch fallback={<span class="text-sm font-normal text-fg-muted">Not available</span>}>
            <Match when={typeof v.stat.value === "number"}>
                <CountUp value={v.stat.value!} />
            </Match>
            <Match when={v.stat.loading}>
                <span class="inline-block h-6 w-20 rounded-sm bg-surface align-middle sm:h-8 sm:w-28" />
                <span class="sr-only">Loading</span>
            </Match>
        </Switch>
    );

    return (
        <dl class="grid grid-cols-3 divide-x divide-line border-t border-line">
            <For each={stats()}>
                {(stat, i) => (
                    <div class={`py-4 sm:py-6 ${i() === 0 ? "pr-3 sm:pr-6" : "px-3 sm:px-6"}`}>
                        <dt class="text-xs text-fg-muted sm:text-sm">{stat.label}</dt>
                        <dd class="mt-1 text-xl font-semibold tracking-tight text-fg sm:text-3xl">
                            <Value stat={stat} />
                        </dd>
                    </div>
                )}
            </For>
        </dl>
    );
}
