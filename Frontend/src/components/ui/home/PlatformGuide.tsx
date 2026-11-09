import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { BookOpen } from "lucide-solid";
import { ButtonLink, TextLink, YouTubePreview } from "../../common";
import PlatformLogo from "../../common/PlatformLogo";
import VerifyMark from "../../common/VerifyMark";
import {
    detectPlatform,
    type GuideStep,
    ONLINE_CHECKLIST,
    PLATFORM_GUIDES,
    type PlatformId,
} from "../../../constants/platformGuides";
import { SITE_LINKS } from "../../../constants/siteLinks";
import { queryKeys } from "../../../constants/queryKeys";
import { leaderboardApi } from "../../../services/api/leaderboard";

interface PlatformGuideProps {
    /** Prefix for element ids, so the guide can appear on more than one page without clashes. */
    idPrefix?: string;
}

/*
 * A WAI-ARIA tabs pattern: one tab per platform, one panel visible at a time. Arrow keys move
 * between tabs (roving tabindex), Home and End jump to the ends. Tabs sit in a wrapping grid
 * rather than a horizontal scroller so all eight platforms are visible at 360px.
 */
export default function PlatformGuide(props: PlatformGuideProps) {
    const prefix = () => props.idPrefix ?? "platform";
    const [selected, setSelected] = createSignal<PlatformId>("wii");
    const tabs: HTMLButtonElement[] = [];

    onMount(() => setSelected(detectPlatform(navigator.userAgent)));

    const channelQuery = useQuery(() => ({
        queryKey: queryKeys.channelDownload,
        queryFn: leaderboardApi.getChannelDownloadUrl,
        staleTime: 1000 * 60 * 60,
    }));

    const guide = createMemo(
        () => PLATFORM_GUIDES.find((p) => p.id === selected()) ?? PLATFORM_GUIDES[0],
    );

    const focusTab = (index: number) => {
        const count = PLATFORM_GUIDES.length;
        const next = (index + count) % count;
        setSelected(PLATFORM_GUIDES[next].id);
        tabs[next]?.focus();
    };

    const onTabKeyDown = (e: KeyboardEvent, index: number) => {
        const keys: Record<string, () => void> = {
            ArrowRight: () => focusTab(index + 1),
            ArrowDown: () => focusTab(index + 1),
            ArrowLeft: () => focusTab(index - 1),
            ArrowUp: () => focusTab(index - 1),
            Home: () => focusTab(0),
            End: () => focusTab(PLATFORM_GUIDES.length - 1),
        };
        const action = keys[e.key];
        if (action) {
            e.preventDefault();
            action();
        }
    };

    const stepLink = (step: GuideStep) => {
        if (!step.link) return null;
        if (step.link === "wii-channel") {
            return {
                label: "Wii channel releases",
                href: channelQuery.data ?? SITE_LINKS.wiiChannelFallback,
            };
        }
        return step.link;
    };

    return (
        <div>
            <div
                role="tablist"
                aria-label="Choose your platform"
                class="grid grid-cols-4 gap-2 lg:grid-cols-8"
            >
                <For each={PLATFORM_GUIDES}>
                    {(platform, i) => {
                        const isSelected = () => selected() === platform.id;
                        return (
                            <button
                                ref={(el) => (tabs[i()] = el)}
                                type="button"
                                role="tab"
                                id={`${prefix()}-tab-${platform.id}`}
                                aria-selected={isSelected()}
                                aria-controls={`${prefix()}-panel`}
                                tabindex={isSelected() ? 0 : -1}
                                onClick={() => setSelected(platform.id)}
                                onKeyDown={(e) => onTabKeyDown(e, i())}
                                class={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border px-1 py-3 text-center text-xs font-medium transition-colors duration-150 sm:text-sm ${
                                    isSelected()
                                        ? "border-accent bg-accent-soft text-fg"
                                        : "border-line text-fg-muted hover:border-line-strong hover:text-fg"
                                }`}
                            >
                                {/* A fixed 48 x 32 box: logos keep their proportions inside
                                    it, so the wide Wii wordmark and square marks balance. */}
                                <PlatformLogo
                                    name={platform.logo}
                                    class={`h-8 w-12 transition-colors ${
                                        isSelected() ? "text-accent-text" : ""
                                    }`}
                                />
                                <span class="leading-tight">{platform.name}</span>
                            </button>
                        );
                    }}
                </For>
            </div>

            <div
                role="tabpanel"
                id={`${prefix()}-panel`}
                aria-labelledby={`${prefix()}-tab-${guide().id}`}
                tabindex="0"
                class="mt-4 rounded-lg border border-line bg-canvas p-5 sm:p-8"
            >
                {/* Keyed on the guide so the content is rebuilt, and fades in, on every tab change. */}
                <Show when={guide()} keyed>
                    {(_current) => (
                        <div class="panel-enter grid gap-8 lg:grid-cols-12 lg:gap-12">
                            <div class="lg:col-span-7">
                                <h3 class="type-heading text-fg">{guide().title}</h3>
                                <p class="mt-2 text-base text-fg-muted">
                                    {guide().summary}
                                    <Show when={guide().summaryVerify}>
                                        <VerifyMark />
                                    </Show>
                                </p>

                                <ol class="mt-6 grid gap-5">
                                    <For each={guide().steps}>
                                        {(step, i) => (
                                            <li class="flex gap-4">
                                                <span
                                                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-line-strong text-sm font-semibold text-fg tabular-nums"
                                                    aria-hidden="true"
                                                >
                                                    {i() + 1}
                                                </span>
                                                <div class="pt-0.5 text-base text-fg">
                                                    <p>
                                                        {step.text}
                                                        <Show when={step.verify}>
                                                            <VerifyMark />
                                                        </Show>
                                                    </p>
                                                    <Show when={stepLink(step)}>
                                                        {(link) => (
                                                            <TextLink
                                                                href={link().href}
                                                                newTab={
                                                                    !link().href.endsWith(".zip")
                                                                }
                                                                class="mt-1 inline-block text-sm"
                                                            >
                                                                {link().label}
                                                            </TextLink>
                                                        )}
                                                    </Show>
                                                </div>
                                            </li>
                                        )}
                                    </For>
                                </ol>
                            </div>

                            <div class="flex flex-col gap-6 lg:col-span-5">
                                <div>
                                    {/* Video guides play in place; the written iOS guide is a link. */}
                                    <Show
                                        when={guide().guide.kind === "video"}
                                        fallback={
                                            <ButtonLink
                                                href={guide().guide.href}
                                                newTab
                                                variant="secondary"
                                                class="w-full sm:w-auto"
                                            >
                                                <BookOpen size={16} aria-hidden="true" />
                                                Read the written guide
                                            </ButtonLink>
                                        }
                                    >
                                        <YouTubePreview
                                            url={guide().guide.href}
                                            title={guide().guide.label}
                                        />
                                    </Show>
                                    <Show when={guide().extraGuides}>
                                        <ul class="mt-3 grid gap-1">
                                            <For each={guide().extraGuides}>
                                                {(extra) => (
                                                    <li>
                                                        <TextLink
                                                            href={extra.href}
                                                            newTab
                                                            class="text-sm"
                                                        >
                                                            {extra.label}
                                                        </TextLink>
                                                    </li>
                                                )}
                                            </For>
                                        </ul>
                                    </Show>
                                </div>

                                <div class="rounded-lg bg-surface p-4 sm:p-5">
                                    <h4 class="text-sm font-semibold text-fg">
                                        Before you go online
                                    </h4>
                                    <ul class="mt-3 grid gap-3 text-sm text-fg-muted">
                                        <For each={ONLINE_CHECKLIST}>
                                            {(item) => (
                                                <li class="flex gap-3">
                                                    <span
                                                        class="mt-1.5 h-1.5 w-1.5 shrink-0 bg-accent"
                                                        aria-hidden="true"
                                                    />
                                                    <span>{item}</span>
                                                </li>
                                            )}
                                        </For>
                                        <li class="flex gap-3">
                                            <span
                                                class="mt-1.5 h-1.5 w-1.5 shrink-0 bg-accent"
                                                aria-hidden="true"
                                            />
                                            <span>
                                                Playing online on Retro WFC involves data
                                                collection.{" "}
                                                <TextLink href="/privacy">
                                                    Read the privacy policy
                                                </TextLink>
                                                .
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </Show>
            </div>
            {/* Required by the Android robot's CC BY 3.0 licence; the rest are trademark notices. */}
            <p class="mt-3 text-xs text-fg-subtle">
                Platform logos are trademarks of their owners and are used only to identify each
                platform. The Android robot is reproduced from work created and shared by Google and
                used according to the Creative Commons 3.0 Attribution License.
            </p>
        </div>
    );
}
