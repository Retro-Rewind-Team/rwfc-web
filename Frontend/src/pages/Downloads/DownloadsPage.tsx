import { createMemo, For, JSX, Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { Meta, Title } from "@solidjs/meta";
import { leaderboardApi } from "../../services/api/leaderboard";
import { timeTrialApi } from "../../services/api/timeTrial";
import { queryKeys } from "../../constants/queryKeys";
import { DOWNLOADS_META } from "../../constants/pageMeta";
import { OTHER_DISTRIBUTIONS, SITE_LINKS } from "../../constants/siteLinks";
import { BrandIcon, ButtonLink, PageHeader, Section, TextLink } from "../../components/common";
import { Download } from "lucide-solid";
import VerifyMark from "../../components/common/VerifyMark";
import { DistributionCard } from "../../components/ui";
import { PlatformGuide } from "../../components/ui/home";
import { countTracks } from "../../utils/homeData";
import { PLATFORM_GUIDES } from "../../constants/platformGuides";
import { reveal } from "../../utils/motion";

interface DownloadRow {
    name: string;
    description: JSX.Element;
    href: string | undefined;
    action: string;
    newTab?: boolean;
    primary?: boolean;
}

export default function DownloadsPage() {
    const tracksQuery = useQuery(() => ({
        queryKey: queryKeys.ttTracks,
        queryFn: () => timeTrialApi.getAllTracks(),
        staleTime: 1000 * 60 * 60,
    }));

    const versionQuery = useQuery(() => ({
        queryKey: queryKeys.rrVersion,
        queryFn: leaderboardApi.getRRVersion,
        staleTime: 1000 * 60 * 60,
    }));

    const channelQuery = useQuery(() => ({
        queryKey: queryKeys.channelDownload,
        queryFn: leaderboardApi.getChannelDownloadUrl,
        staleTime: 1000 * 60 * 60,
    }));

    const counts = createMemo(() => (tracksQuery.data ? countTracks(tracksQuery.data) : null));
    const v = () => versionQuery.data ?? null;

    const rows = createMemo<DownloadRow[]>(() => [
        {
            name: "Full download",
            description: "The complete package. Use it for a first install.",
            href: SITE_LINKS.fullDownload,
            action: "Download full package",
            primary: true,
        },
        {
            name: "Update only",
            description: v()?.previousVersion
                ? `Updates v${v()!.previousVersion} to v${v()!.version}. Use it if you already have v${v()!.previousVersion}.`
                : "Updates the previous version to the latest one.",
            href: v()?.updateUrl,
            action: "Download update",
        },
        {
            name: "Wheel Wizard",
            description: "The PC launcher. The easiest way to set up Retro Rewind in Dolphin.",
            href: SITE_LINKS.wheelWizard,
            action: "Get Wheel Wizard",
            newTab: true,
        },
        {
            name: "Wii channel",
            description: (
                <>
                    Launch Retro Rewind from the Wii Menu.
                    <VerifyMark />
                </>
            ),
            href: channelQuery.data ?? SITE_LINKS.wiiChannelFallback,
            action: "Get the Wii channel",
            newTab: true,
        },
        {
            name: "Previous versions and changelogs",
            description: "Every release and what changed in it, on the Retro Rewind wiki.",
            href: SITE_LINKS.wiki,
            action: "Open version history",
            newTab: true,
        },
    ]);

    return (
        <>
            <Title>{DOWNLOADS_META.title}</Title>
            <Meta name="description" content={DOWNLOADS_META.description} />

            <PageHeader
                page="downloads"
                title="Downloads"
                description={
                    <>
                        <Show when={v()} fallback="The latest Retro Rewind release">
                            Retro Rewind v{v()!.version}
                        </Show>
                        <Show when={counts()}>
                            {(c) => (
                                <>
                                    , with {c().retro.toLocaleString()} retro tracks and{" "}
                                    {c().custom.toLocaleString()} custom tracks
                                </>
                            )}
                        </Show>
                        . New here? Download the full package, then follow the setup guide for your
                        platform.
                    </>
                }
                meta="Setup guides for Wii, Dolphin, PC, Steam Deck, Linux, macOS, Android and iOS."
                actions={
                    <>
                        <ButtonLink href={SITE_LINKS.fullDownload} variant="primary" size="lg">
                            <Download size={18} aria-hidden="true" />
                            Download full package
                        </ButtonLink>
                        <ButtonLink
                            href="#guides"
                            variant="secondary"
                            size="lg"
                            class="bg-transparent hover:bg-surface"
                        >
                            Setup guides
                        </ButtonLink>
                    </>
                }
            />

            <section aria-labelledby="files-title" class="pb-14 sm:pb-20">
                <h2 id="files-title" class="type-heading mb-4 text-fg">
                    Files
                </h2>
                <ul class="divide-y divide-line rounded-lg border border-line">
                    <For each={rows()}>
                        {(row) => (
                            <li class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                                <div class="max-w-xl">
                                    <h3 class="type-heading text-fg">{row.name}</h3>
                                    <p class="mt-1 text-sm text-fg-muted">{row.description}</p>
                                </div>
                                <Show
                                    when={row.href}
                                    fallback={
                                        <span class="text-sm text-fg-subtle">Loading link</span>
                                    }
                                >
                                    {(href) => (
                                        <ButtonLink
                                            href={href()}
                                            newTab={row.newTab}
                                            variant={row.primary ? "primary" : "secondary"}
                                            class="w-full sm:w-auto"
                                        >
                                            {row.action}
                                        </ButtonLink>
                                    )}
                                </Show>
                            </li>
                        )}
                    </For>
                </ul>
                <p class="mt-4 text-sm text-fg-subtle">
                    Playing online on Retro WFC involves data collection.{" "}
                    <TextLink href="/privacy">Read the privacy policy</TextLink>.
                </p>
            </section>

            <Section
                id="guides"
                title="Setup guides"
                description="Choose where you play. Each guide lists the steps and links to a full walkthrough."
            >
                <PlatformGuide idPrefix="downloads-platform" />
            </Section>

            <Section
                id="video-guides"
                title="All video guides"
                description="Every walkthrough in one place, for when you already know which one you need."
                revealBody={false}
            >
                <ul class="grid gap-x-10 border-t border-line md:grid-cols-2">
                    <For
                        each={PLATFORM_GUIDES.flatMap((platform) => [
                            { platform: platform.title, ...platform.guide },
                            ...(platform.extraGuides ?? []).map((extra) => ({
                                platform: platform.title,
                                ...extra,
                            })),
                        ]).filter(
                            // Dolphin and PC share one video; list it once.
                            (g, i, all) => all.findIndex((o) => o.href === g.href) === i,
                        )}
                    >
                        {(guide, i) => (
                            <li
                                class="flex items-center justify-between gap-4 border-b border-line py-4"
                                {...reveal(i())}
                            >
                                <div class="min-w-0">
                                    <p class="font-medium text-fg">{guide.label}</p>
                                    <p class="mt-0.5 text-sm text-fg-muted">
                                        {guide.platform}
                                        {guide.kind === "written" ? ", written guide" : ""}
                                    </p>
                                </div>
                                <TextLink href={guide.href} newTab class="shrink-0 text-sm">
                                    {guide.kind === "video" ? "Watch" : "Read"}
                                </TextLink>
                            </li>
                        )}
                    </For>
                </ul>
            </Section>

            <Section
                id="help"
                title="Help and reference"
                description="Stuck on a step, or want to know what changed in a release?"
            >
                <dl class="grid gap-x-10 border-t border-line sm:grid-cols-2 lg:grid-cols-4">
                    <div class="border-b border-line py-5">
                        <dt class="font-medium text-fg">Discord</dt>
                        <dd class="mt-1 text-sm text-fg-muted">
                            Ask the community for setup help.
                            <TextLink
                                href={SITE_LINKS.discord}
                                newTab
                                class="mt-2 flex w-fit items-center gap-1.5"
                            >
                                <BrandIcon name="discord" />
                                Join the Discord
                            </TextLink>
                        </dd>
                    </div>
                    <div class="border-b border-line py-5">
                        <dt class="font-medium text-fg">Wiki</dt>
                        <dd class="mt-1 text-sm text-fg-muted">
                            Features, troubleshooting and version history.
                            <TextLink href={SITE_LINKS.wiki} newTab class="mt-2 block">
                                Open the wiki
                            </TextLink>
                        </dd>
                    </div>
                    <div class="border-b border-line py-5">
                        <dt class="font-medium text-fg">Community tools</dt>
                        <dd class="mt-1 text-sm text-fg-muted">
                            Rank helper, rating editor, VR calculator and font patcher.
                            <TextLink href="/tools" class="mt-2 block">
                                Browse the tools
                            </TextLink>
                        </dd>
                    </div>
                    <div class="border-b border-line py-5">
                        <dt class="font-medium text-fg">Track list</dt>
                        <dd class="mt-1 text-sm text-fg-muted">
                            Every track and the 40 battle arenas in this release.
                            <TextLink href={SITE_LINKS.trackList} newTab class="mt-2 block">
                                See the full track list
                            </TextLink>
                        </dd>
                    </div>
                </dl>
            </Section>

            <Section
                id="other-distributions"
                title="Other distributions on Retro WFC"
                description="These custom track distributions also use the Retro WFC servers."
                revealBody={false}
            >
                <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <For each={OTHER_DISTRIBUTIONS}>
                        {(pack, i) => (
                            <li {...reveal(i())}>
                                <DistributionCard name={pack.name} discordUrl={pack.discordUrl} />
                            </li>
                        )}
                    </For>
                </ul>
            </Section>
        </>
    );
}
