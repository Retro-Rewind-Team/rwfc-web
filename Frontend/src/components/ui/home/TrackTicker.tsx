import { createMemo, createSignal, For, Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { Pause, Play } from "lucide-solid";
import { PixelIcon, Tag } from "../../common";
import { queryKeys } from "../../../constants/queryKeys";
import { timeTrialApi } from "../../../services/api/timeTrial";
import { pickTickerTracks, splitTrackName } from "../../../utils/homeData";

/*
 * A slow ticker of real track names under the hero. Motion rules it follows:
 * - It moves only transform, at roughly 30px a second, and pauses on hover or keyboard focus.
 * - A visible pause button meets WCAG 2.2.2 (anything moving for over five seconds can be stopped).
 * - Under reduced motion the CSS animation is never applied, so it is a still row of names.
 * Screen readers get one plain list; the duplicate copy that makes the loop seamless is hidden.
 */
export default function TrackTicker() {
    const [paused, setPaused] = createSignal(false);

    const tracksQuery = useQuery(() => ({
        queryKey: queryKeys.ttTracks,
        queryFn: () => timeTrialApi.getAllTracks(),
        staleTime: 1000 * 60 * 60,
    }));

    const tracks = createMemo(() => pickTickerTracks(tracksQuery.data ?? []));

    const Row = (rowProps: { hidden?: boolean }) => (
        <ul
            class="flex shrink-0 items-center gap-8 pr-8"
            aria-hidden={rowProps.hidden ? "true" : undefined}
            aria-label={rowProps.hidden ? undefined : "A sample of tracks in Retro Rewind"}
        >
            <For each={tracks()}>
                {(track) => {
                    const label = splitTrackName(track.name);
                    return (
                        <li class="flex items-center gap-2 text-sm whitespace-nowrap text-fg-muted">
                            <Tag>{label.origin ?? "Custom"}</Tag>
                            <span>{label.name}</span>
                        </li>
                    );
                }}
            </For>
        </ul>
    );

    return (
        // The bar keeps its full height while loading and the names fill in, so nothing below
        // jumps. If the track list cannot be loaded at all, the bar is left out, not shown empty.
        <Show when={!tracksQuery.isError}>
            <div
                class="ticker flex h-12 items-center border-t border-line"
                data-paused={paused() ? "true" : "false"}
            >
                <div class="flex shrink-0 items-center gap-2 border-r border-line py-3 pr-4 text-sm font-medium text-fg">
                    <PixelIcon name="flag" class="text-accent-text" />
                    <span class="hidden sm:inline">On the track list</span>
                </div>
                <div class="relative min-w-0 flex-1 overflow-hidden py-3 pl-4">
                    <div
                        class="ticker-track flex w-max"
                        style={{ "--ticker-duration": `${tracks().length * 3.2}s` }}
                    >
                        <Show when={tracks().length > 0}>
                            <Row />
                            <Row hidden />
                        </Show>
                    </div>
                </div>
                <Show when={tracks().length > 0}>
                    <button
                        type="button"
                        class="ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface hover:text-fg motion-reduce:hidden"
                        aria-pressed={paused()}
                        onClick={() => setPaused((p) => !p)}
                    >
                        <span class="sr-only">Pause the track ticker</span>
                        <Show when={paused()} fallback={<Pause size={14} aria-hidden="true" />}>
                            <Play size={14} aria-hidden="true" />
                        </Show>
                    </button>
                </Show>
            </div>
        </Show>
    );
}
