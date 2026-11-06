import { createMemo, For, Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { A } from "@solidjs/router";
import { Meta, Title } from "@solidjs/meta";
import { ChevronRight } from "lucide-solid";
import { timeTrialApi } from "../../services/api/timeTrial";
import { queryKeys } from "../../constants/queryKeys";
import { HOME_META } from "../../constants/pageMeta";
import { ButtonLink, CountUp, Section } from "../../components/common";
import { Faq, Hero, PlatformGuide, RoomSnapshot, TrackSample } from "../../components/ui/home";
import { countTracks } from "../../utils/homeData";
import { reveal } from "../../utils/motion";

/* Feature names from the existing site copy. No descriptions are invented for them. */
const MODES = ["200cc", "500cc", "Knockout Mode", "Item Rain", "Item Storm", "Online time trials"];
const MECHANICS = ["Brake drifting", "Ultra mini-turbos", "Draggable blue shells"];

const MORE_LINKS = [
    {
        href: "/vr",
        title: "VR leaderboard",
        body: "Rankings for racers on the Retro WFC servers, up to 1,000,000 VR.",
    },
    {
        href: "/tt",
        title: "Time trials",
        body: "World records for every Retro Rewind track, across each CC and category.",
    },
    {
        href: "/races",
        title: "Races",
        body: "Recent online races and results from across the Retro WFC servers.",
    },
    {
        href: "/stats",
        title: "Race stats",
        body: "Track popularity and setup trends across all tracks and players.",
    },
    {
        href: "/tools",
        title: "Community tools",
        body: "A font patcher, rating editor, VR calculator and rank helper.",
    },
];

function Bullet() {
    // A single square pixel: the list marker carries the same small retro touch as the icons.
    return <span class="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" aria-hidden="true" />;
}

export default function HomePage() {
    const tracksQuery = useQuery(() => ({
        queryKey: queryKeys.ttTracks,
        queryFn: () => timeTrialApi.getAllTracks(),
        staleTime: 1000 * 60 * 60,
    }));

    const counts = createMemo(() => (tracksQuery.data ? countTracks(tracksQuery.data) : null));

    return (
        <>
            <Title>{HOME_META.title}</Title>
            <Meta name="description" content={HOME_META.description} />

            <Hero />

            <Section
                id="install"
                divider={false}
                title="Install and race"
                description="Choose where you play. Each guide lists the steps and links to a full walkthrough."
            >
                <PlatformGuide idPrefix="home-platform" />
            </Section>

            <Section
                id="tracks"
                title="Tracks and modes"
                description="What the current release includes. Track counts come from the live track list."
                revealBody={false}
            >
                <div class="grid gap-10 lg:grid-cols-12 lg:gap-12">
                    <div class="lg:col-span-5" {...reveal(0)}>
                        <TrackSample />
                    </div>
                    <div class="grid content-start gap-10 sm:grid-cols-2 lg:col-span-7">
                        <div class="sm:col-span-2" {...reveal(1)}>
                            <h3 class="type-heading text-fg">Tracks</h3>
                            <dl class="mt-4 grid gap-x-10 sm:grid-cols-3">
                                <For
                                    each={[
                                        { label: "Retro tracks", value: counts()?.retro },
                                        { label: "Custom tracks", value: counts()?.custom },
                                        { label: "Battle arenas", value: 40 },
                                    ]}
                                >
                                    {(row) => (
                                        <div class="flex items-baseline justify-between gap-4 border-b border-line py-3 sm:block">
                                            <dt class="text-fg-muted">{row.label}</dt>
                                            <dd class="text-2xl font-semibold tracking-tight text-fg sm:mt-1">
                                                <Show
                                                    when={row.value !== undefined}
                                                    fallback={
                                                        <span class="text-base font-normal text-fg-subtle">
                                                            Loading
                                                        </span>
                                                    }
                                                >
                                                    <CountUp value={row.value!} />
                                                </Show>
                                            </dd>
                                        </div>
                                    )}
                                </For>
                            </dl>
                        </div>
                        <div {...reveal(2)}>
                            <h3 class="type-heading text-fg">Modes</h3>
                            <ul class="mt-4 grid gap-2 text-base text-fg">
                                <For each={MODES}>
                                    {(mode) => (
                                        <li class="flex gap-3">
                                            <Bullet />
                                            {mode}
                                        </li>
                                    )}
                                </For>
                            </ul>
                        </div>
                        <div {...reveal(3)}>
                            <h3 class="type-heading text-fg">Mechanics</h3>
                            <ul class="mt-4 grid gap-2 text-base text-fg">
                                <For each={MECHANICS}>
                                    {(mechanic) => (
                                        <li class="flex gap-3">
                                            <Bullet />
                                            {mechanic}
                                        </li>
                                    )}
                                </For>
                            </ul>
                            <p class="mt-4 text-sm text-fg-muted">
                                Retro Rewind runs on the Pulsar engine.
                            </p>
                        </div>
                    </div>
                </div>
            </Section>

            <Section
                id="rooms"
                title="Room snapshot"
                description="Who was racing on Retro WFC at the time of the last snapshot."
                action={
                    <ButtonLink href="/rooms" variant="secondary">
                        Open the room browser
                    </ButtonLink>
                }
            >
                <RoomSnapshot />
            </Section>

            <Section
                id="more"
                title="Leaderboards, stats and tools"
                description="For racers who want to track their times, VR and races."
                revealBody={false}
            >
                <ul class="grid border-t border-line md:grid-cols-2 md:gap-x-10">
                    <For each={MORE_LINKS}>
                        {(link, i) => (
                            <li class="border-b border-line" {...reveal(i())}>
                                <A
                                    href={link.href}
                                    class="group flex items-center justify-between gap-4 py-4"
                                >
                                    <span>
                                        <span class="block font-medium text-fg group-hover:text-accent-text">
                                            {link.title}
                                        </span>
                                        <span class="mt-1 block text-sm text-fg-muted">
                                            {link.body}
                                        </span>
                                    </span>
                                    <ChevronRight
                                        size={18}
                                        aria-hidden="true"
                                        class="shrink-0 text-fg-subtle transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-fg"
                                    />
                                </A>
                            </li>
                        )}
                    </For>
                </ul>
            </Section>

            <Section
                id="faq"
                title="Questions"
                description="Setup, online play and where to get help."
                revealBody={false}
            >
                <Faq />
            </Section>
        </>
    );
}
