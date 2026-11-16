import { For, JSX, Show } from "solid-js";
import { A } from "@solidjs/router";
import { ChevronRight } from "lucide-solid";
import CheckerStrip from "./CheckerStrip";
import PixelIcon from "./PixelIcon";
import {
    DEFAULT_BACKDROP,
    HEADER_FOCUS,
    PAGE_HEADERS,
    type PageKey,
} from "../../constants/pageHeaders";

export interface Crumb {
    label: string;
    href: string;
}

interface PageHeaderProps {
    /** Looks up the page's art (or placeholder) in constants/pageHeaders.ts. */
    page: PageKey;
    title: JSX.Element;
    description?: JSX.Element;
    /** Trail back to the parent pages, for detail views. The current page is the title. */
    crumbs?: Crumb[];
    /** Primary actions for the page, such as the main download button. */
    actions?: JSX.Element;
    /** A short line of facts under the description (counts, dates). */
    meta?: JSX.Element;
    /** A page-specific visual (live stats, a Mii, rank glyphs). Overrides the registry art. */
    visual?: JSX.Element;
    /** Smaller title and padding, for detail and tool pages. */
    compact?: boolean;
}

/*
 * The shared header for every internal page: the same dark band as the home hero (so the site
 * reads as one product), with the same gameplay backdrop, the page title and a short description,
 * and optionally one visual on the right.
 * The band is always dark in both themes; the .dark class makes every token inside resolve to
 * its dark value, so contrast holds. It sits outside the content column via .full-bleed and is
 * pulled up under the header with -mt-10 to cancel <main>'s top padding.
 */
export default function PageHeader(props: PageHeaderProps) {
    const asset = () => PAGE_HEADERS[props.page];
    // Compact headers (tools, text pages, detail views) only show a visual when the page supplies
    // one: a placeholder there would add height without adding meaning.
    const media = () => (asset().art?.layout === "media" ? asset().art : null);
    // A page's own "backdrop" art wins; otherwise every header shares the default backdrop.
    const backdrop = () => (asset().art?.layout === "backdrop" ? asset().art : DEFAULT_BACKDROP);
    // The right-hand slot holds a page visual or framed art. The placeholder panel only appears
    // when there is no imagery at all (no backdrop), and never on compact headers.
    const showSlot = () =>
        !!props.visual || !!media() || (!props.compact && !asset().art && !DEFAULT_BACKDROP);

    return (
        <header
            class={`dark hero-band full-bleed relative isolate -mt-10 overflow-hidden bg-canvas text-fg ${
                props.compact ? "mb-8 sm:mb-10" : "mb-10 sm:mb-14"
            }`}
        >
            <Show when={backdrop()}>
                {(art) => (
                    <>
                        {/* Decorative. Blurred and scaled slightly so the blur has no soft edge;
                            each page frames its own part of the shot. */}
                        <img
                            src={art().src}
                            width={art().width}
                            height={art().height}
                            alt=""
                            decoding="async"
                            class="absolute inset-0 -z-20 h-full w-full scale-110 object-cover blur-xs"
                            style={{ "object-position": HEADER_FOCUS[props.page] }}
                        />
                        {/* A solid overlay, not a gradient. Worst case (white under it) keeps body
                            text at 8.2:1 and muted text at 5.6:1. */}
                        <div class="absolute inset-0 -z-10 bg-canvas/85" aria-hidden="true" />
                    </>
                )}
            </Show>

            <div class="page-grid">
                <div
                    class={`grid items-center gap-8 lg:grid-cols-12 lg:gap-12 ${
                        props.compact ? "py-8 sm:py-10" : "py-10 sm:py-14"
                    }`}
                >
                    <div class={`min-w-0 ${showSlot() ? "lg:col-span-7" : "lg:col-span-12"}`}>
                        <Show when={props.crumbs?.length}>
                            <nav aria-label="Breadcrumb" class="mb-3">
                                <ol class="flex flex-wrap items-center gap-1 text-sm text-fg-muted">
                                    <For each={props.crumbs}>
                                        {(crumb) => (
                                            <li class="flex items-center gap-1">
                                                <A
                                                    href={crumb.href}
                                                    class="transition-colors hover:text-fg"
                                                >
                                                    {crumb.label}
                                                </A>
                                                <ChevronRight size={14} aria-hidden="true" />
                                            </li>
                                        )}
                                    </For>
                                </ol>
                            </nav>
                        </Show>
                        <h1
                            class={`${props.compact ? "type-title" : "type-display"} max-w-3xl text-fg`}
                        >
                            {props.title}
                        </h1>
                        <Show when={props.description}>
                            <p
                                class={`mt-4 max-w-2xl text-fg-muted ${
                                    props.compact ? "text-base" : "text-lg"
                                }`}
                            >
                                {props.description}
                            </p>
                        </Show>
                        <Show when={props.meta}>
                            <div class="mt-4 text-sm text-fg-muted">{props.meta}</div>
                        </Show>
                        <Show when={props.actions}>
                            <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                {props.actions}
                            </div>
                        </Show>
                    </div>

                    <Show when={showSlot()}>
                        <div class="min-w-0 lg:col-span-5">
                            <Show
                                when={props.visual}
                                fallback={<HeaderArtSlot page={props.page} />}
                            >
                                {props.visual}
                            </Show>
                        </div>
                    </Show>
                </div>
            </div>

            <CheckerStrip id={`header-${props.page}`} />
        </header>
    );
}

/** Real art from the registry when it exists, otherwise the designed placeholder. */
function HeaderArtSlot(props: { page: PageKey }) {
    const asset = () => PAGE_HEADERS[props.page];
    const media = () => (asset().art?.layout === "media" ? asset().art : null);

    return (
        <Show
            when={media()}
            fallback={
                <Show when={!asset().art}>
                    {/* Placeholder: wide screens only, so phone headers stay short. */}
                    <div class="hidden lg:block">
                        <div
                            class="flex aspect-[2/1] items-center justify-center rounded-lg border border-line bg-surface text-accent-text"
                            aria-hidden="true"
                        >
                            <PixelIcon name={asset().icon} size={64} />
                        </div>
                        <Show when={import.meta.env.DEV}>
                            <p class="mt-2 text-xs text-warn-fg">Image needed: {asset().needed}</p>
                        </Show>
                    </div>
                </Show>
            }
        >
            {(art) => (
                <img
                    src={art().src}
                    width={art().width}
                    height={art().height}
                    alt={art().alt}
                    loading="eager"
                    fetchpriority="high"
                    // The transparent logo floats with no box, cropped to its lettering (rows 93
                    // to 184 of 270); the title card shares the band's navy; screenshots are framed.
                    class={`block h-auto w-full ${
                        art().src === "/RetroRewindLogo.webp"
                            ? "mx-auto aspect-[480/92] max-w-[36rem] object-cover"
                            : art().src === "/og-image.png"
                              ? "aspect-[10/3] object-cover sm:aspect-[1200/630]"
                              : "aspect-video rounded-lg border border-line object-cover"
                    }`}
                />
            )}
        </Show>
    );
}
