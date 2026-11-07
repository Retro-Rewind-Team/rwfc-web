import { A, useLocation, useNavigate } from "@solidjs/router";
import { createEffect, createMemo, createSignal, For, on, onCleanup, Show } from "solid-js";
import { ArrowUpRight, Search } from "lucide-solid";
import pageMeta from "../../constants/pageMeta.json";

const normalize = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();

const pages = pageMeta.routes.map((route) => ({
    title: route.path === "/" ? "Home" : route.title.split(" | ")[0],
    subtitle: route.description,
    href: route.path,
}));

/*
 * Header search. An icon button opens a small panel with a field that filters the site's pages
 * and tools as you type. Keyboard: "/" or Ctrl/Cmd+K opens, arrows move, Enter opens the result,
 * Escape closes and returns focus to the button.
 */
export default function SiteSearch() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = createSignal(false);
    const [query, setQuery] = createSignal("");
    const [active, setActive] = createSignal(0);
    let root: HTMLDivElement | undefined;
    let trigger: HTMLButtonElement | undefined;
    let input: HTMLInputElement | undefined;

    const results = createMemo(() => {
        const words = normalize(query()).trim().split(/\s+/).filter(Boolean);
        if (!words.length) return [];
        return pages
            .filter((page) =>
                words.every((word) =>
                    normalize(`${page.title} ${page.subtitle} ${page.href}`).includes(word),
                ),
            )
            .sort((a, b) => {
                const score = (p: typeof a) =>
                    words.filter((word) => normalize(p.title).includes(word)).length;
                return score(b) - score(a);
            })
            .slice(0, 8);
    });

    createEffect(on(results, () => setActive(0)));

    const open = () => {
        setIsOpen(true);
        queueMicrotask(() => input?.focus());
    };
    const close = (returnFocus = true) => {
        setIsOpen(false);
        setQuery("");
        if (returnFocus) trigger?.focus();
    };

    // Close after navigating.
    createEffect(
        on(
            () => location.pathname,
            () => close(false),
            { defer: true },
        ),
    );

    const onDocumentClick = (e: MouseEvent) => {
        if (isOpen() && root && !root.contains(e.target as Node)) close(false);
    };
    const onDocumentKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement | null;
        const typing =
            target?.tagName === "INPUT" ||
            target?.tagName === "TEXTAREA" ||
            target?.isContentEditable;
        if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
            e.preventDefault();
            open();
        }
    };
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onDocumentKeyDown);
    onCleanup(() => {
        document.removeEventListener("click", onDocumentClick);
        document.removeEventListener("keydown", onDocumentKeyDown);
    });

    const onInputKeyDown = (e: KeyboardEvent) => {
        const count = results().length;
        if (e.key === "Escape") {
            e.preventDefault();
            close();
        } else if (e.key === "ArrowDown" && count) {
            e.preventDefault();
            setActive((i) => (i + 1) % count);
        } else if (e.key === "ArrowUp" && count) {
            e.preventDefault();
            setActive((i) => (i - 1 + count) % count);
        } else if (e.key === "Enter") {
            const result = results()[active()];
            if (result) {
                e.preventDefault();
                navigate(result.href);
            }
        }
    };

    return (
        <div ref={(el) => (root = el)} class="relative">
            <button
                ref={(el) => (trigger = el)}
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted transition-colors duration-150 hover:bg-surface hover:text-fg"
                aria-haspopup="dialog"
                aria-expanded={isOpen()}
                aria-controls="site-search"
                onClick={() => (isOpen() ? close() : open())}
            >
                <span class="sr-only">Search</span>
                <Search size={18} aria-hidden="true" />
            </button>

            <Show when={isOpen()}>
                <div
                    id="site-search"
                    role="dialog"
                    aria-label="Search"
                    class="fixed inset-x-4 top-[4.5rem] z-50 rounded-lg border border-line bg-canvas p-2 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-96"
                >
                    <div class="flex h-10 items-center gap-2 rounded-md bg-surface px-3 text-fg-muted">
                        <Search size={16} aria-hidden="true" />
                        <input
                            ref={(el) => (input = el)}
                            type="search"
                            role="combobox"
                            aria-label="Search pages and tools"
                            aria-expanded={results().length > 0}
                            aria-controls="site-search-results"
                            aria-activedescendant={
                                results().length ? `site-search-result-${active()}` : undefined
                            }
                            placeholder="Search anything…"
                            autocomplete="off"
                            spellcheck={false}
                            maxLength={80}
                            class="h-full min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-muted"
                            value={query()}
                            onInput={(e) => setQuery(e.currentTarget.value)}
                            onKeyDown={onInputKeyDown}
                        />
                    </div>
                    <Show
                        when={results().length > 0}
                        fallback={
                            <p class="px-3 py-4 text-sm text-fg-muted" role="status">
                                {query().trim()
                                    ? `No pages match “${query().trim()}”.`
                                    : "Find pages and tools."}
                            </p>
                        }
                    >
                        <ul id="site-search-results" role="listbox" class="mt-2 grid grid-cols-[minmax(0,1fr)] gap-0.5">
                            <For each={results()}>
                                {(result, i) => (
                                    <li role="presentation" class="min-w-0">
                                        <A
                                            id={`site-search-result-${i()}`}
                                            role="option"
                                            aria-selected={active() === i()}
                                            tabIndex={-1}
                                            href={result.href}
                                            onMouseEnter={() => setActive(i())}
                                            class="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-fg-muted aria-selected:bg-surface aria-selected:text-fg"
                                        >
                                            <span class="min-w-0">
                                                <strong class="block truncate font-medium text-fg">
                                                    {result.title}
                                                </strong>
                                                <small class="block truncate text-xs">
                                                    {result.subtitle}
                                                </small>
                                            </span>
                                            <ArrowUpRight size={15} aria-hidden="true" />
                                        </A>
                                    </li>
                                )}
                            </For>
                        </ul>
                    </Show>
                </div>
            </Show>
        </div>
    );
}
