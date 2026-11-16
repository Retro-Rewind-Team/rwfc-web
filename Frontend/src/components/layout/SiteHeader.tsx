import { A } from "@solidjs/router";
import { createSignal, onCleanup, onMount } from "solid-js";
import { ArrowUpRight, ChevronDown, Download } from "lucide-solid";
import ThemeToggle from "./ThemeToggle";
import SiteSearch from "./SiteSearch";
import "../../pages/Home/home.css";

const exploreGroups = [
    {
        title: "Race activity",
        links: [
            { href: "/vr", label: "VR Leaderboard" },
            { href: "/tt", label: "Time Trials" },
            { href: "/timetrial/rankings", label: "TT Player Rankings" },
            { href: "/rooms", label: "Room Browser" },
            { href: "/stats", label: "Race statistics" },
            { href: "/races", label: "Recent races" },
        ],
    },
    { title: "Tools", links: [{ href: "/tools", label: "All tools" }] },
    {
        title: "Community",
        links: [
            { href: "/team", label: "Team" },
            { href: "/rules", label: "Rules" },
            { href: "/privacy", label: "Privacy" },
            { href: "https://discord.gg/retrorewind", label: "Discord" },
        ],
    },
];

function ExploreLinks(props: { onNavigate: () => void }) {
    return exploreGroups.map((group) => (
        <div class="home-explore-group">
            <p>{group.title}</p>
            {group.links.map((link) => (
                <A
                    href={link.href}
                    onClick={props.onNavigate}
                    target={link.href.startsWith("https:") ? "_blank" : undefined}
                    rel={link.href.startsWith("https:") ? "noopener noreferrer" : undefined}
                >
                    {link.label}
                    {link.href.startsWith("https:") && <ArrowUpRight size={14} />}
                </A>
            ))}
            {group.title === "Community" && (
                <div class="home-explore-appearance">
                    <span>Theme</span>
                    <ThemeToggle />
                </div>
            )}
        </div>
    ));
}

export default function SiteHeader() {
    const [menuOpen, setMenuOpen] = createSignal(false);
    const [exploreOpen, setExploreOpen] = createSignal(false);
    const [headerHidden, setHeaderHidden] = createSignal(false);
    const [atPageTop, setAtPageTop] = createSignal(true);
    let headerElement: HTMLElement | undefined;
    let exploreElement: HTMLDivElement | undefined;
    let exploreButton: HTMLButtonElement | undefined;
    let mobileMenuButton: HTMLButtonElement | undefined;

    onMount(() => {
        let previousY = Math.max(0, window.scrollY);
        setAtPageTop(previousY === 0);
        const handleScroll = () => {
            const currentY = Math.max(0, window.scrollY);
            setAtPageTop(currentY === 0);
            // Keep navigation visible while its menu or keyboard focus is active.
            if (
                currentY <= (headerElement?.offsetHeight ?? 0) ||
                currentY < previousY ||
                menuOpen() ||
                exploreOpen() ||
                headerElement?.contains(document.activeElement)
            ) {
                setHeaderHidden(false);
            } else if (currentY > previousY) {
                setHeaderHidden(true);
            }
            previousY = currentY;
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        const closeOnOutsideClick = (event: PointerEvent) => {
            if (!exploreElement?.contains(event.target as Node)) setExploreOpen(false);
            if (!headerElement?.contains(event.target as Node)) setMenuOpen(false);
        };
        const closeOnResize = () => {
            setExploreOpen(false);
            setMenuOpen(false);
        };
        document.addEventListener("pointerdown", closeOnOutsideClick);
        window.addEventListener("resize", closeOnResize);
        onCleanup(() => {
            window.removeEventListener("scroll", handleScroll);
            document.removeEventListener("pointerdown", closeOnOutsideClick);
            window.removeEventListener("resize", closeOnResize);
        });
    });
    return (
        <div
            class="rewind-home site-header-shell"
            classList={{ "home-header-hidden": headerHidden() }}
            onFocusIn={() => setHeaderHidden(false)}
        >
            <a class="home-skip" href="#main-content">
                Skip to content
            </a>
            <header
                class="home-header"
                ref={(element) => {
                    headerElement = element;
                }}
                classList={{
                    "home-header-at-top": atPageTop(),
                    "home-mobile-menu-open": menuOpen(),
                }}
                onKeyDown={(event) => {
                    if (event.key !== "Escape") return;
                    if (exploreOpen()) {
                        setExploreOpen(false);
                        exploreButton?.focus();
                    } else if (menuOpen()) {
                        setMenuOpen(false);
                        mobileMenuButton?.focus();
                    }
                }}
            >
                <div class="home-nav home-wrap">
                    <A href="/" class="home-wordmark" aria-label="Retro Rewind home">
                        <img
                            class="home-header-logo"
                            src="/RetroRewindLogo.png"
                            alt="Retro Rewind"
                        />
                    </A>
                    <SiteSearch
                        onOpen={() => {
                            setExploreOpen(false);
                            setMenuOpen(false);
                        }}
                    />
                    <nav class="home-desktop-nav" aria-label="Main navigation">
                        <div
                            class="home-explore-menu"
                            ref={(element) => {
                                exploreElement = element;
                            }}
                            onFocusOut={(event) => {
                                if (!exploreElement?.contains(event.relatedTarget as Node | null)) {
                                    setExploreOpen(false);
                                }
                            }}
                        >
                            <button
                                ref={(element) => {
                                    exploreButton = element;
                                }}
                                type="button"
                                class="home-explore-toggle"
                                aria-expanded={exploreOpen()}
                                aria-controls="home-explore-panel"
                                onClick={() => setExploreOpen(!exploreOpen())}
                            >
                                Explore <ChevronDown size={15} aria-hidden="true" />
                            </button>
                            {exploreOpen() && (
                                <div id="home-explore-panel" class="home-explore-panel">
                                    <ExploreLinks onNavigate={() => setExploreOpen(false)} />
                                </div>
                            )}
                        </div>
                    </nav>
                    <A href="/downloads" class="home-button home-nav-download">
                        Get Retro Rewind <Download size={16} />
                    </A>
                    <button
                        ref={(element) => {
                            mobileMenuButton = element;
                        }}
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
                        <A href="/downloads" onClick={() => setMenuOpen(false)}>
                            Get Retro Rewind <Download size={16} />
                        </A>
                        <div class="home-mobile-explore">
                            <ExploreLinks onNavigate={() => setMenuOpen(false)} />
                        </div>
                    </nav>
                )}
            </header>
        </div>
    );
}
