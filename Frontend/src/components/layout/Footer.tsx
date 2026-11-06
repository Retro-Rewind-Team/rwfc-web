import { A } from "@solidjs/router";
import { For } from "solid-js";
import { BrandIcon, PixelIcon } from "../common";
import { SITE_LINKS } from "../../constants/siteLinks";

interface FooterLink {
    label: string;
    href: string;
    external?: boolean;
}

const columns: { title: string; links: FooterLink[] }[] = [
    {
        title: "Play",
        links: [
            { label: "Downloads", href: "/downloads" },
            { label: "Room browser", href: "/rooms" },
            { label: "Rules", href: "/rules" },
            { label: "Community tools", href: "/tools" },
        ],
    },
    {
        title: "Compete",
        links: [
            { label: "VR leaderboard", href: "/vr" },
            { label: "Time trials", href: "/tt" },
            { label: "Time trial rankings", href: "/timetrial/rankings" },
            { label: "Races", href: "/races" },
            { label: "Race stats", href: "/stats" },
        ],
    },
    {
        title: "Project",
        links: [
            { label: "Team", href: "/team" },
            { label: "Privacy policy", href: "/privacy" },
            { label: "Wiki", href: SITE_LINKS.wiki, external: true },
        ],
    },
];

const linkClass = "text-sm text-fg-muted transition-colors duration-150 hover:text-fg";

export default function Footer() {
    return (
        <footer class="border-t border-line bg-surface">
            <div class="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-8">
                <div class="grid gap-10 sm:grid-cols-3 lg:grid-cols-12">
                    <div class="sm:col-span-3 lg:col-span-6">
                        <A href="/" class="inline-flex items-center gap-2.5 rounded-md">
                            <img
                                src="/logo-56.webp"
                                alt=""
                                width="24"
                                height="24"
                                class="h-6 w-6"
                                loading="lazy"
                                decoding="async"
                            />
                            <span class="text-base font-semibold tracking-tight text-fg">
                                Retro Rewind
                            </span>
                        </A>
                        <p class="mt-3 max-w-xs text-sm text-fg-muted">
                            Custom tracks for Mario Kart Wii, raced online on the Retro WFC servers.
                        </p>
                        <ul class="mt-5 flex flex-wrap gap-2">
                            <For
                                each={[
                                    {
                                        brand: "discord" as const,
                                        label: "Discord",
                                        href: SITE_LINKS.discord,
                                    },
                                    {
                                        brand: "github" as const,
                                        label: "GitHub",
                                        href: SITE_LINKS.github,
                                    },
                                ]}
                            >
                                {(item) => (
                                    <li>
                                        <a
                                            href={item.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-canvas px-3 text-sm font-medium text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
                                        >
                                            <BrandIcon name={item.brand} />
                                            {item.label}
                                            <span class="sr-only"> (opens in a new tab)</span>
                                        </a>
                                    </li>
                                )}
                            </For>
                        </ul>
                    </div>

                    <For each={columns}>
                        {(column) => (
                            <nav aria-label={column.title} class="lg:col-span-2">
                                <h2 class="text-sm font-semibold text-fg">{column.title}</h2>
                                <ul class="mt-3 grid gap-2">
                                    <For each={column.links}>
                                        {(link) => (
                                            <li>
                                                {link.external ? (
                                                    <a
                                                        href={link.href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        class={linkClass}
                                                    >
                                                        {link.label}
                                                        <span class="sr-only">
                                                            {" "}
                                                            (opens in a new tab)
                                                        </span>
                                                    </a>
                                                ) : (
                                                    <A href={link.href} class={linkClass}>
                                                        {link.label}
                                                    </A>
                                                )}
                                            </li>
                                        )}
                                    </For>
                                </ul>
                            </nav>
                        )}
                    </For>
                </div>

                <div class="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
                    <p class="flex items-center gap-2">
                        <PixelIcon name="flag" class="text-fg-subtle" />
                        <span>
                            © {new Date().getFullYear()} Retro Rewind Team. Not affiliated with
                            Nintendo.
                        </span>
                    </p>
                    <p>
                        Website source on{" "}
                        <a
                            href={SITE_LINKS.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-1 align-bottom underline underline-offset-4 hover:text-fg"
                        >
                            <BrandIcon name="github" size={12} />
                            GitHub
                            <span class="sr-only"> (opens in a new tab)</span>
                        </a>
                        , licensed AGPL-3.0.
                    </p>
                </div>
            </div>
        </footer>
    );
}
