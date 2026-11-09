import { Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { BrandIcon, ButtonLink, TEXT_LINK_CLASS } from "../../common";
import { queryKeys } from "../../../constants/queryKeys";
import { SITE_LINKS } from "../../../constants/siteLinks";
import { leaderboardApi } from "../../../services/api/leaderboard";
import { roomStatusApi } from "../../../services/api/room";
import { formatRelativeTime } from "../../../utils/homeData";
import { enterOrder } from "../../../utils/motion";
import TrackTicker from "./TrackTicker";
import HeroStats from "./HeroStats";

/*
 * Background photo for the hero band: a Mario Kart Wii screenshot (Luigi Circuit start line),
 * supplied by the project. Set to null to go back to the plain navy band.
 *
 * It is shown blurred under a solid 85% navy overlay. Measured against the worst case (pure white
 * under the overlay), body text stays at 8.2:1 and muted text at 5.6:1, so contrast does not
 * depend on which part of the shot sits behind the words. The blur also hides that the source is
 * only 596 x 335 and is stretched across the full width.
 */
const HERO_BACKGROUND: { src: string; width: number; height: number } | null = {
    src: "/hero/luigi-circuit.jpg",
    width: 596,
    height: 335,
};

/*
 * The hero is a full-width band in the title art's own navy, in both themes. With the band and
 * the art sharing one background colour, the logo reads as part of the page instead of a picture
 * pasted onto it. A checkered start line closes the band.
 */
export default function Hero() {
    const versionQuery = useQuery(() => ({
        queryKey: queryKeys.rrVersion,
        queryFn: leaderboardApi.getRRVersion,
        staleTime: 1000 * 60 * 60,
    }));

    // Same query key as the room snapshot section, so this is one request, not two.
    const snapshotQuery = useQuery(() => ({
        queryKey: queryKeys.roomSnapshot,
        queryFn: () => roomStatusApi.getLatestRoomStatus(),
        staleTime: 1000 * 60,
        refetchOnWindowFocus: false,
    }));

    return (
        <section
            aria-labelledby="hero-title"
            class="dark hero-band full-bleed relative isolate -mt-10 overflow-hidden bg-canvas text-fg"
        >
            <Show when={HERO_BACKGROUND}>
                {(bg) => (
                    <>
                        {/* Decorative backdrop. Scaled slightly so the blur has no soft edge. */}
                        <img
                            src={bg().src}
                            width={bg().width}
                            height={bg().height}
                            alt=""
                            loading="eager"
                            decoding="async"
                            class="absolute inset-0 -z-20 h-full w-full scale-110 object-cover blur-xs"
                        />
                        <div class="absolute inset-0 -z-10 bg-canvas/85" aria-hidden="true" />
                    </>
                )}
            </Show>

            <div class="page-grid">
                <div class="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:py-24">
                    <div class="lg:col-span-6">
                        <h1
                            id="hero-title"
                            class="hero-enter type-display max-w-xl text-fg"
                            style={enterOrder(0)}
                        >
                            Every retro track, back on the grid.
                        </h1>
                        <p
                            class="hero-enter mt-6 max-w-xl text-lg text-fg-muted"
                            style={enterOrder(1)}
                        >
                            Retro Rewind puts every retro track from Super Mario Kart to Mario Kart
                            7 into Mario Kart Wii, plus tracks from Mario Kart 8, Tour, Arcade GP
                            and Mario Kart World. Install it on a Wii, in Dolphin or with Wheel
                            Wizard, and race online on Retro WFC.
                        </p>
                        <div
                            class="hero-enter mt-8 flex flex-col gap-3 sm:flex-row"
                            style={enterOrder(2)}
                        >
                            <ButtonLink href="/downloads" variant="primary" size="lg">
                                Get latest version
                            </ButtonLink>
                            <ButtonLink
                                href={SITE_LINKS.discord}
                                newTab
                                variant="secondary"
                                size="lg"
                                class="bg-transparent hover:bg-surface"
                            >
                                <BrandIcon name="discord" size={18} />
                                Join the Discord
                            </ButtonLink>
                        </div>
                        {/*
                          Space is reserved (four lines on phones, two from sm): the version and the snapshot
                          arrive after first paint and would otherwise push the page down.
                        */}
                        <div
                            class="hero-enter mt-6 grid min-h-[4lh] gap-1 text-sm text-fg-muted sm:min-h-[2lh]"
                            style={enterOrder(3)}
                        >
                            <p>
                                <Show when={versionQuery.data}>
                                    {(v) => <>Latest release: v{v().version}. </>}
                                </Show>
                                New to Retro Rewind?{" "}
                                <a href="#install" class={TEXT_LINK_CLASS}>
                                    Start with the setup guide
                                </a>
                                .
                            </p>
                            <Show when={snapshotQuery.data}>
                                {(snap) => (
                                    <p class="flex gap-2">
                                        <span
                                            class="mt-2 h-1.5 w-1.5 shrink-0 bg-accent"
                                            aria-hidden="true"
                                        />
                                        <span>
                                            <span class="font-medium text-fg tabular-nums">
                                                {snap().totalPlayers.toLocaleString()} players
                                            </span>{" "}
                                            in rooms at the last snapshot,{" "}
                                            {formatRelativeTime(snap().timestamp)}.
                                        </span>
                                    </p>
                                )}
                            </Show>
                        </div>
                    </div>

                    <div
                        class="hero-enter max-w-xl lg:col-span-6 lg:max-w-none"
                        style={enterOrder(2)}
                    >
                        {/*
                          The project's own title art. No frame: its background matches the band,
                          so only the wordmark shows. Largest image above the fold, so it loads
                          eagerly at high priority; width and height reserve its space. On phones
                          it is cropped to the wordmark, since the rest is plain navy padding.
                        */}
                        <div class="hero-drift">
                            <Show
                                when={HERO_BACKGROUND}
                                fallback={
                                    <img
                                        src="/og-image.png"
                                        width="1200"
                                        height="630"
                                        sizes="(min-width: 1024px) 36rem, calc(100vw - 2rem)"
                                        alt="Retro Rewind title art: the Mario Kart logo above the words Retro Rewind in green and yellow lettering."
                                        loading="eager"
                                        fetchpriority="high"
                                        class="block aspect-[10/3] h-auto w-full object-cover sm:aspect-[1200/630]"
                                    />
                                }
                            >
                                {/*
                                  Over the photo, the transparent logo file is used instead of the
                                  title card, so the wordmark floats with no box or frame. The
                                  file has empty margin above and below the lettering (visible
                                  rows 93 to 184 of 270), so it is cropped to that strip.
                                */}
                                <img
                                    src="/RetroRewindLogo.webp"
                                    width="480"
                                    height="270"
                                    alt="Retro Rewind title art: the Mario Kart logo above the words Retro Rewind in green and yellow lettering."
                                    loading="eager"
                                    fetchpriority="high"
                                    class="mx-auto block aspect-[480/92] h-auto w-full max-w-[36rem] object-cover"
                                />
                            </Show>
                        </div>
                    </div>
                </div>
                {/* The track ticker sits inside the band, on its last row above the start line. */}
                {/* Headline numbers, then the track ticker, as the band's last rows. */}
                <HeroStats />
                <TrackTicker />
            </div>

            {/* A two-row checkered start line closing the band. Decorative, so hidden from AT. */}
            <svg class="block h-4 w-full text-line" aria-hidden="true">
                <defs>
                    <pattern id="hero-checker" width="16" height="16" patternUnits="userSpaceOnUse">
                        <rect width="8" height="8" fill="currentColor" />
                        <rect x="8" y="8" width="8" height="8" fill="currentColor" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hero-checker)" />
            </svg>
        </section>
    );
}
