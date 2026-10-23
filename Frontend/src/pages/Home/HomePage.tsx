import { createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { ArrowUpRight, Download, MonitorPlay, Timer, Trophy, Zap } from "lucide-solid";
import { leaderboardApi } from "../../services/api/leaderboard";
import { roomStatusApi } from "../../services/api/room";
import { timeTrialApi } from "../../services/api/timeTrial";
import { queryKeys } from "../../constants/queryKeys";
import { HOME_META } from "../../constants/pageMeta";
import "./home.css";
import { A } from "@solidjs/router";
import { Meta, Title } from "@solidjs/meta";

const destinations = [
    {
        icon: Trophy,
        title: "VR Leaderboard",
        label: "Climb the ranks",
        href: "/vr",
        color: "#ffcf24",
        description: "Every race counts. See where you stand against the Retro WFC community.",
    },
    {
        icon: Timer,
        title: "Time Trials",
        label: "Chase the perfect lap",
        href: "/tt",
        color: "#73c8ff",
        description:
            "Find your next challenge, compare records, and shave off those last milliseconds.",
    },
    {
        icon: MonitorPlay,
        title: "Room Browser",
        label: "Find your next race",
        href: "/rooms",
        color: "#b39bff",
        description: "See who's racing and discover active rooms across the Retro WFC network.",
    },
    {
        icon: Zap,
        title: "Community Tools",
        label: "Make it your own",
        href: "/tools",
        color: "#8de0ad",
        description:
            "Rating editors, rank calculators, and helpful tools built for your next session.",
    },
];

export default function HomePage() {
    const [menuOpen, setMenuOpen] = createSignal(false);
    const [headerHidden, setHeaderHidden] = createSignal(false);
    const [atPageTop, setAtPageTop] = createSignal(true);
    let headerElement: HTMLElement | undefined;

    onMount(() => {
        let previousY = Math.max(0, window.scrollY);
        setAtPageTop(previousY === 0);
        const handleScroll = () => {
            const currentY = Math.max(0, window.scrollY);
            setAtPageTop(currentY === 0);
            // Keep navigation visible while its menu or keyboard focus is active.
            if (currentY <= (headerElement?.offsetHeight ?? 0) || currentY < previousY || menuOpen() ||
                headerElement?.contains(document.activeElement)) {
                setHeaderHidden(false);
            } else if (currentY > previousY) {
                setHeaderHidden(true);
            }
            previousY = currentY;
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        onCleanup(() => window.removeEventListener("scroll", handleScroll));
    });
    const pcountQuery = useQuery(() => ({
        queryKey: queryKeys.pcount,
        queryFn: () => roomStatusApi.getPlayerCount(),
        refetchInterval: 300000,
    }));

    const discordQuery = useQuery(() => ({
        queryKey: queryKeys.discordMembers,
        queryFn: () => leaderboardApi.getDiscordMemberCount(),
        refetchInterval: 300000,
    }));

    const tracksQuery = useQuery(() => ({
        queryKey: queryKeys.ttTracks,
        queryFn: () => timeTrialApi.getAllTracks(),
        staleTime: 1000 * 60 * 60,
    }));

    const totalTrackCount = createMemo(
        () =>
            tracksQuery.data?.filter(
                (track) =>
                    !track.isHidden && (track.category === "retro" || track.category === "custom"),
            ).length ?? 0,
    );

    return (
        <div class="rewind-home">
            <Title>{HOME_META.title}</Title>
            <Meta name="description" content={HOME_META.description} />
            <a class="home-skip" href="#main-content">
                Skip to content
            </a>
            <header class="home-header" ref={(element) => { headerElement = element; }}
                classList={{ "home-header-hidden": headerHidden(), "home-header-at-top": atPageTop() }}
                onFocusIn={() => setHeaderHidden(false)}
            >
                <div class="home-nav home-wrap">
                    <A href="/" class="home-wordmark" aria-label="Retro Rewind home">
                        <img
                            class="home-header-logo"
                            src="/RetroRewindLogo.png"
                            alt="Retro Rewind"
                        />
                    </A>
                    <nav class="home-desktop-nav" aria-label="Main navigation">
                        <A href="/vr">VR Leaderboard</A>
                        <A href="/tt">Time Trials</A>
                        <A href="/rooms">Rooms</A>
                        <A href="/team">Team</A>
                    </nav>
                    <A href="/downloads" class="home-button home-nav-download">
                        Get Retro Rewind <Download size={16} />
                    </A>
                    <button
                        class="home-menu-toggle"
                        classList={{ "is-open": menuOpen() }}
                        type="button"
                        aria-label={menuOpen() ? "Close navigation" : "Open navigation"}
                        aria-expanded={menuOpen()}
                        aria-controls="home-mobile-nav"
                        onClick={() => setMenuOpen(!menuOpen())}
                    >
                        <span class="home-menu-bars" aria-hidden="true">
                            <span />
                            <span />
                            <span />
                        </span>
                    </button>
                </div>
                {menuOpen() && (
                    <nav
                        id="home-mobile-nav"
                        class="home-mobile-nav"
                        aria-label="Mobile navigation"
                    >
                        {[
                            ["/vr", "VR Leaderboard"],
                            ["/tt", "Time Trials"],
                            ["/rooms", "Rooms"],
                            ["/team", "Team"],
                            ["/downloads", "Downloads"],
                        ].map(([href, label]) => (
                            <A href={href} onClick={() => setMenuOpen(false)}>
                                {label}
                                <ArrowUpRight size={16} />
                            </A>
                        ))}
                    </nav>
                )}
            </header>
            <main id="main-content">
                <section class="home-hero" aria-labelledby="home-title">
                    <img
                        class="home-hero-image"
                        src="/images/home-track.jpeg"
                        alt="Luigi racing around a retro Mario Kart circuit at sunset"
                        fetchpriority="high"
                    />
                    <div class="home-hero-shade" />
                    <div class="home-hero-content home-wrap">
                        <h1 id="home-title">
                            Welcome to
                            <br />
                            <span>Retro Rewind</span>
                        </h1>
                        <p class="home-hero-description">
                            Your favorite tracks from Super Mario Kart to Mario Kart 7 and beyond,
                            together in Mario Kart Wii. Chase faster times and race with the
                            community on Retro WFC.
                        </p>
                        <div class="home-hero-actions">
                            <A href="/downloads" class="home-button home-button-yellow">
                                <Download size={18} /> Get Retro Rewind
                            </A>
                            <A href="/rooms" class="home-button home-button-glass">
                                Find a race <ArrowUpRight size={18} />
                            </A>
                        </div>
                    </div>
                </section>
                <section
                    class="home-stats home-wrap"
                    aria-label="Retro Rewind community statistics"
                >
                    <div>
                        <strong>{pcountQuery.data?.count.toLocaleString() ?? "—"}</strong>
                        <span>Registered players</span>
                    </div>
                    <div>
                        <strong>{totalTrackCount().toLocaleString()}</strong>
                        <span>Available tracks</span>
                    </div>
                    <div>
                        <strong>{discordQuery.data?.toLocaleString() ?? "—"}</strong>
                        <span>Discord members</span>
                    </div>
                    <a
                        href="https://discord.gg/retrorewind"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="home-community-link"
                    >
                        <span>
                            There's a place for you here.
                            <b>
                                <svg
                                    class="home-discord-icon"
                                    aria-hidden="true"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z M9.75 12.5a1.75 2 0 1 0-3.5 0 1.75 2 0 1 0 3.5 0z M17.75 12.5a1.75 2 0 1 0-3.5 0 1.75 2 0 1 0 3.5 0z"
                                    />
                                </svg>
                                Join the community <ArrowUpRight size={17} />
                            </b>
                        </span>
                    </a>
                </section>
                <section class="home-explore home-wrap" aria-labelledby="home-explore-title">
                    <div class="home-section-heading">
                        <div>
                            <p class="home-eyebrow">THE NEXT RACE IS YOURS</p>
                            <h2 id="home-explore-title">
                                A little competition.
                                <br />A lot of good company.
                            </h2>
                        </div>
                    </div>
                    <div class="home-feature-list">
                        {destinations.map((card, index) => (
                            <A
                                href={card.href}
                                class="home-feature-row"
                                style={{ "--card-accent": card.color }}
                            >
                                <span class="home-feature-number">0{index + 1}</span>
                                <span class="home-feature-icon">
                                    <card.icon size={26} strokeWidth={1.5} />
                                </span>
                                <div class="home-feature-copy">
                                    <h3>{card.title}</h3>
                                    <p class="home-card-description">{card.description}</p>
                                </div>
                                <span class="home-card-arrow" aria-hidden="true">
                                    <ArrowUpRight size={21} />
                                </span>
                            </A>
                        ))}
                    </div>
                </section>
                <section class="home-about home-wrap" aria-labelledby="home-about-title">
                    <h2 id="home-about-title">About Retro Rewind</h2>
                    <div class="home-about-grid">
                        <article>
                            <h3>What is Retro Rewind?</h3>
                            <p>
                                A custom track distribution by ZPL featuring every retro track from
                                Super Mario Kart to Mario Kart 7, plus tracks from Mario Kart 8,
                                Tour, Arcade GP and Mario Kart World. Built on the Pulsar engine and
                                connected to Retro WFC servers.
                            </p>
                        </article>
                        <article>
                            <h3>Advanced Features</h3>
                            <p>
                                Experience 200cc and 500cc modes, brake drifting, ultra mini-turbos,
                                draggable blue shells, and custom modes like Knockout Mode and Item
                                Rain.
                            </p>
                        </article>
                        <article>
                            <h3>Powered by Retro WFC</h3>
                            <p>
                                Connect to dedicated Retro WFC servers for stable online racing with
                                players worldwide. No patching required, just install and race.
                            </p>
                        </article>
                    </div>
                </section>
            </main>
            <footer class="home-footer">
                <div class="home-footer-inner home-wrap">
                    <nav aria-label="Footer navigation">
                        <A href="/rules">Rules</A>
                        <A href="/privacy">Privacy</A>
                        <A href="/stats">Stats</A>
                        <A href="/races">Races</A>
                        <a
                            href="https://discord.gg/retrorewind"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Discord <ArrowUpRight size={13} />
                        </a>
                        <a
                            href="https://github.com/Retro-Rewind-Team/rwfc-web"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            GitHub <ArrowUpRight size={13} />
                        </a>
                    </nav>
                    <p class="home-footer-legal">
                        © {new Date().getFullYear()} Retro Rewind Team. This project is not
                        affiliated with Nintendo.
                    </p>
                </div>
            </footer>
        </div>
    );
}
