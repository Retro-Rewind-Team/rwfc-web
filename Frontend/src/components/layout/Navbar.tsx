import { A, useLocation } from "@solidjs/router";
import { createEffect, createSignal, For, on, onCleanup, Show } from "solid-js";
import { Menu, X } from "lucide-solid";
import NavLink from "./NavLink";
import { BrandIcon } from "../common";
import { SITE_LINKS } from "../../constants/siteLinks";
import ThemeToggle from "./ThemeToggle";

/*
 * Primary navigation is limited to what racers use week to week. Team, rules and privacy live in
 * the footer and in the mobile menu, which has room for them.
 */
const primaryLinks = [
    { href: "/downloads", label: "Downloads" },
    { href: "/rooms", label: "Rooms" },
    { href: "/vr", label: "VR leaderboard" },
    { href: "/tt", label: "Time trials" },
    { href: "/races", label: "Races" },
    { href: "/stats", label: "Stats" },
    { href: "/tools", label: "Tools" },
];

const secondaryLinks = [
    { href: "/team", label: "Team" },
    { href: "/rules", label: "Rules" },
    { href: "/privacy", label: "Privacy" },
];

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = createSignal(false);
    const location = useLocation();
    let menuButton: HTMLButtonElement | undefined;

    // Close the mobile menu on navigation, including back and forward.
    createEffect(
        on(
            () => location.pathname,
            () => setIsMenuOpen(false),
            { defer: true },
        ),
    );

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isMenuOpen()) {
            setIsMenuOpen(false);
            menuButton?.focus();
        }
    };
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => document.removeEventListener("keydown", onKeyDown));

    /*
     * Scroll state. The header is flat at the top of the page and gains its rule once content
     * passes under it; a thin bar shows how far through the page you are. One passive listener,
     * throttled to animation frames, writes the bar's transform directly so scrolling never
     * re-renders anything. The bar reflects the reader's own scrolling, so it stays under
     * reduced motion (its transition is already disabled there).
     */
    const [isScrolled, setIsScrolled] = createSignal(false);
    let progressBar: HTMLDivElement | undefined;
    let ticking = false;
    const update = () => {
        ticking = false;
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        setIsScrolled(window.scrollY > 8);
        if (progressBar) {
            // Short pages do not need a progress bar.
            const show = max > window.innerHeight * 0.5;
            progressBar.style.opacity = show ? "1" : "0";
            progressBar.style.transform = `scaleX(${show ? Math.min(window.scrollY / max, 1) : 0})`;
        }
    };
    const onScroll = () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onCleanup(() => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
    });
    // Page height changes on navigation and when data loads, so re-measure then too.
    createEffect(
        on(
            () => location.pathname,
            () => requestAnimationFrame(update),
        ),
    );

    return (
        <header
            class={`sticky top-0 z-40 border-b bg-canvas transition-colors duration-(--motion-base) ${
                isScrolled() || isMenuOpen() ? "border-line" : "border-transparent"
            }`}
        >
            <div
                ref={(el) => (progressBar = el)}
                class="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 origin-left bg-accent opacity-0"
                style={{ transform: "scaleX(0)" }}
                aria-hidden="true"
            />
            <a
                href="#main-content"
                class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-fg"
                onClick={(e) => {
                    // The router intercepts in-page anchors and scrolls without moving focus, so
                    // the next Tab would land back in the header. Move focus explicitly.
                    e.preventDefault();
                    const main = document.getElementById("main-content");
                    main?.focus();
                    main?.scrollIntoView();
                }}
            >
                Skip to content
            </a>
            <div class="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <A href="/" class="flex shrink-0 items-center gap-2.5 rounded-md">
                    <img
                        src="/logo-56.webp"
                        alt=""
                        width="28"
                        height="28"
                        class="h-7 w-7"
                        decoding="async"
                    />
                    <span class="text-base font-semibold tracking-tight text-fg">Retro Rewind</span>
                </A>

                <nav aria-label="Main" class="hidden lg:block">
                    <ul class="flex items-center gap-1">
                        <For each={primaryLinks}>
                            {(link) => (
                                <li>
                                    <NavLink href={link.href}>{link.label}</NavLink>
                                </li>
                            )}
                        </For>
                    </ul>
                </nav>

                <div class="flex items-center gap-1">
                    <a
                        href={SITE_LINKS.discord}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="hidden h-9 w-9 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface hover:text-fg sm:inline-flex"
                    >
                        <BrandIcon name="discord" size={18} />
                        <span class="sr-only">Retro Rewind Discord (opens in a new tab)</span>
                    </a>
                    <a
                        href={SITE_LINKS.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="hidden h-9 w-9 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface hover:text-fg sm:inline-flex"
                    >
                        <BrandIcon name="github" size={18} />
                        <span class="sr-only">Website source on GitHub (opens in a new tab)</span>
                    </a>
                    <ThemeToggle />
                    <button
                        ref={(el) => (menuButton = el)}
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted transition-colors duration-150 hover:bg-surface hover:text-fg lg:hidden"
                        aria-expanded={isMenuOpen()}
                        aria-controls="mobile-menu"
                        onClick={() => setIsMenuOpen((open) => !open)}
                    >
                        <span class="sr-only">{isMenuOpen() ? "Close menu" : "Open menu"}</span>
                        <Show when={isMenuOpen()} fallback={<Menu size={20} aria-hidden="true" />}>
                            <X size={20} aria-hidden="true" />
                        </Show>
                    </button>
                </div>
            </div>

            <Show when={isMenuOpen()}>
                <nav
                    id="mobile-menu"
                    aria-label="Main"
                    class="border-t border-line bg-canvas lg:hidden"
                >
                    <div class="mx-auto max-w-page px-4 py-3 sm:px-6">
                        <ul class="grid gap-1">
                            <li>
                                <NavLink href="/" end layout="list">
                                    Home
                                </NavLink>
                            </li>
                            <For each={primaryLinks}>
                                {(link) => (
                                    <li>
                                        <NavLink href={link.href} layout="list">
                                            {link.label}
                                        </NavLink>
                                    </li>
                                )}
                            </For>
                        </ul>
                        <ul class="mt-3 grid gap-1 border-t border-line pt-3">
                            <For each={secondaryLinks}>
                                {(link) => (
                                    <li>
                                        <NavLink href={link.href} layout="list">
                                            {link.label}
                                        </NavLink>
                                    </li>
                                )}
                            </For>
                        </ul>
                    </div>
                </nav>
            </Show>
        </header>
    );
}
