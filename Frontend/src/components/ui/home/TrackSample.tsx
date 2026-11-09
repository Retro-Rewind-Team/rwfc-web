import { createMemo, For, Match, Switch } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { Tag, TextLink } from "../../common";
import { queryKeys } from "../../../constants/queryKeys";
import { SITE_LINKS } from "../../../constants/siteLinks";
import { timeTrialApi } from "../../../services/api/timeTrial";
import {
    countTracks,
    pickTrackSample,
    splitTrackName,
    TRACK_ORIGINS,
} from "../../../utils/homeData";

/*
 * The hero's one piece of character: real track names from the live track list, laid out like a
 * course select, oldest console first. It is a sample, so it says so, and links to the full list.
 */
export default function TrackSample() {
    const tracksQuery = useQuery(() => ({
        queryKey: queryKeys.ttTracks,
        queryFn: () => timeTrialApi.getAllTracks(),
        staleTime: 1000 * 60 * 60,
    }));

    const sample = createMemo(() => pickTrackSample(tracksQuery.data ?? []));
    const counts = createMemo(() => countTracks(tracksQuery.data ?? []));

    return (
        <div class="rounded-lg border border-line bg-canvas">
            <div class="flex items-baseline justify-between gap-4 border-b border-line px-5 py-4">
                <p id="track-sample-label" class="text-sm font-semibold text-fg">
                    From the track list
                </p>
                <Switch>
                    <Match when={tracksQuery.data}>
                        <p class="text-sm text-fg-subtle tabular-nums">
                            {counts().total.toLocaleString()} tracks
                        </p>
                    </Match>
                </Switch>
            </div>

            <Switch>
                <Match when={tracksQuery.isError}>
                    <p class="px-5 py-6 text-sm text-fg-muted">
                        The track list could not be loaded right now. The full list is still
                        available as a spreadsheet.
                    </p>
                </Match>
                <Match when={tracksQuery.isPending}>
                    <ul aria-hidden="true" class="divide-y divide-line">
                        <For each={Array.from({ length: 10 })}>
                            {() => (
                                <li class="flex items-center gap-3 px-5 py-2.5">
                                    <span class="h-5 w-10 rounded-sm bg-surface" />
                                    <span class="h-4 w-40 rounded-sm bg-surface" />
                                </li>
                            )}
                        </For>
                    </ul>
                </Match>
                <Match when={tracksQuery.data}>
                    <ul aria-labelledby="track-sample-label" class="divide-y divide-line">
                        <For each={sample()}>
                            {(track) => {
                                const label = splitTrackName(track.name);
                                return (
                                    <li class="flex items-center gap-3 px-5 py-2.5 text-sm">
                                        <span class="w-12 shrink-0">
                                            <Tag tone={label.origin ? "neutral" : "accent"}>
                                                {label.origin ? (
                                                    <abbr
                                                        title={TRACK_ORIGINS[label.origin]}
                                                        class="no-underline"
                                                    >
                                                        {label.origin}
                                                    </abbr>
                                                ) : (
                                                    "Custom"
                                                )}
                                            </Tag>
                                        </span>
                                        <span class="truncate text-fg">{label.name}</span>
                                    </li>
                                );
                            }}
                        </For>
                    </ul>
                </Match>
            </Switch>

            <div class="border-t border-line px-5 py-3">
                <TextLink href={SITE_LINKS.trackList} newTab class="text-sm">
                    See the full track list
                </TextLink>
            </div>
        </div>
    );
}
