import { A, useNavigate } from "@solidjs/router";
import { useQuery } from "@tanstack/solid-query";
import {
    createEffect,
    createMemo,
    createSignal,
    createUniqueId,
    onCleanup,
    onMount,
} from "solid-js";
import { ArrowUpRight, Clock3, Search, SearchX, X } from "lucide-solid";
import { searchContent, searchPages, SearchResult } from "../../services/api/search";
import "./siteSearch.css";

const categories = ["Tools", "Pages", "Players", "Tracks"] as const;
const historyKey = "retro-rewind:recent-searches";

function readHistory(): string[] {
    try {
        const saved: unknown = JSON.parse(localStorage.getItem(historyKey) ?? "[]");
        if (!Array.isArray(saved)) return [];
        return saved
            .filter((term): term is string => typeof term === "string")
            .map((term) => term.trim())
            .filter(
                (term, index, terms) =>
                    term.length >= 2 &&
                    term.length <= 80 &&
                    terms.findIndex((other) => other.toLowerCase() === term.toLowerCase()) ===
                        index,
            )
            .slice(0, 5);
    } catch {
        return [];
    }
}

export default function SiteSearch(props: { onOpen: () => void }) {
    const navigate = useNavigate();
    const id = createUniqueId();
    const [query, setQuery] = createSignal("");
    const [debouncedQuery, setDebouncedQuery] = createSignal("");
    const [open, setOpen] = createSignal(false);
    const expanded = () => open() || query().length > 0;
    const [active, setActive] = createSignal(-1);
    const [history, setHistory] = createSignal(readHistory());
    let root: HTMLDivElement | undefined;
    let input: HTMLInputElement | undefined;
    let trigger: HTMLButtonElement | undefined;

    createEffect(() => {
        const value = query().trim();
        const timeout = window.setTimeout(
            () => setDebouncedQuery(value),
            value.length < 2 ? 0 : 250,
        );
        onCleanup(() => window.clearTimeout(timeout));
    });

    const remote = useQuery(() => ({
        queryKey: ["site-search", debouncedQuery()],
        queryFn: ({ signal }) => searchContent(debouncedQuery(), signal),
        enabled: open() && debouncedQuery().length >= 2 && debouncedQuery() === query().trim(),
        staleTime: 60_000,
        retry: false,
    }));

    const results = createMemo<SearchResult[]>(() => {
        if (!query().trim()) return [];
        const live = debouncedQuery() === query().trim() ? (remote.data ?? []) : [];
        const found = [...searchPages(query()), ...live];
        return categories.flatMap((category) =>
            found.filter((result) => result.category === category),
        );
    });
    const groups = createMemo(() =>
        categories
            .map((category) => ({
                category,
                results: results()
                    .map((result, index) => ({ ...result, index }))
                    .filter((result) => result.category === category),
            }))
            .filter((group) => group.results.length > 0),
    );
    const pending = () =>
        query().trim().length >= 2 && (query().trim() !== debouncedQuery() || remote.isFetching);

    createEffect(() => {
        results();
        history();
        setActive(-1);
    });

    const updateHistory = (terms: string[]) => {
        setHistory(terms);
        try {
            localStorage.setItem(historyKey, JSON.stringify(terms));
        } catch {
            // Search still works when browser storage is unavailable.
        }
    };
    const rememberQuery = () => {
        const term = query().trim();
        if (term.length < 2) return;
        updateHistory(
            [
                term,
                ...history().filter((previous) => previous.toLowerCase() !== term.toLowerCase()),
            ].slice(0, 5),
        );
    };
    const repeatSearch = (term: string) => {
        input?.focus();
        setQuery(term);
        show();
    };
    const show = () => {
        setOpen(true);
        props.onOpen();
    };
    const close = (restoreFocus = false) => {
        if (open()) rememberQuery();
        setOpen(false);
        setActive(-1);
        if (restoreFocus && !query()) trigger?.focus();
    };

    onMount(() => {
        const outside = (event: PointerEvent) => {
            if (!root?.contains(event.target as Node)) close();
        };
        document.addEventListener("pointerdown", outside);
        onCleanup(() => document.removeEventListener("pointerdown", outside));
    });

    return (
        <div
            class="site-search"
            classList={{ "is-expanded": expanded() }}
            ref={(element) => {
                root = element;
            }}
            onFocusOut={(event) => {
                // Hiding the trigger during expansion briefly moves focus to the document.
                if (event.target === trigger && event.relatedTarget === null && open()) return;
                if (!root?.contains(event.relatedTarget as Node | null)) close();
            }}
        >
            <button
                ref={(element) => {
                    trigger = element;
                }}
                type="button"
                class="site-search-trigger"
                aria-label="Search anything…"
                aria-expanded={expanded()}
                aria-controls={`${id}-field`}
                onClick={() => {
                    if (open() && !query()) close(true);
                    else {
                        show();
                        window.requestAnimationFrame(() => {
                            if (open()) input?.focus();
                        });
                    }
                }}
            >
                <Search size={24} aria-hidden="true" />
                <span>Search anything…</span>
            </button>
            <div id={`${id}-field`} class="site-search-content" aria-hidden={!expanded()}>
                <div class="site-search-field">
                    <Search size={18} aria-hidden="true" />
                    <input
                        ref={(element) => {
                            input = element;
                        }}
                        type="search"
                        role="combobox"
                        aria-label="Search players, tracks, pages and tools"
                        aria-autocomplete="list"
                        aria-expanded={open()}
                        aria-controls={`${id}-results`}
                        aria-activedescendant={
                            open() && active() >= 0 ? `${id}-result-${active()}` : undefined
                        }
                        placeholder="Search anything…"
                        autocomplete="off"
                        spellcheck={false}
                        maxLength={80}
                        value={query()}
                        onFocus={show}
                        onInput={(event) => {
                            if (!event.currentTarget.value) rememberQuery();
                            setQuery(event.currentTarget.value);
                            if (query()) show();
                            else close(true);
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "Escape") {
                                event.preventDefault();
                                event.stopPropagation();
                                close(true);
                            } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                                event.preventDefault();
                                show();
                                const count = query().trim() ? results().length : history().length;
                                if (!count) return;
                                setActive((index) => {
                                    const down = event.key === "ArrowDown";
                                    if (index < 0) return down ? 0 : count - 1;
                                    return (index + (down ? 1 : count - 1)) % count;
                                });
                                document
                                    .getElementById(`${id}-result-${active()}`)
                                    ?.scrollIntoView?.({ block: "nearest" });
                            } else if (event.key === "Enter" && open()) {
                                if (!query().trim()) {
                                    const term = history()[active()];
                                    if (term) {
                                        event.preventDefault();
                                        repeatSearch(term);
                                    }
                                    return;
                                }
                                const result = results()[Math.max(0, active())];
                                if (result) {
                                    event.preventDefault();
                                    navigate(result.href);
                                    close();
                                    input?.blur();
                                } else rememberQuery();
                            }
                        }}
                    />
                    {query() && (
                        <button
                            type="button"
                            aria-label="Clear search"
                            onClick={() => {
                                rememberQuery();
                                setQuery("");
                                close(true);
                            }}
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>
                {open() && (
                    <div class="site-search-panel">
                        {!query().trim() && history().length === 0 && (
                            <div class="site-search-idle">
                                Find players, tracks, pages and tools.
                            </div>
                        )}
                        {(query().trim() || history().length > 0) && (
                            <p class="site-search-caption">
                                {query().trim() ? "Search results" : "Recent searches"}
                            </p>
                        )}
                        <div
                            id={`${id}-results`}
                            role="listbox"
                            aria-label={query().trim() ? "Search results" : "Recent searches"}
                            class="site-search-results"
                        >
                            {!query().trim() &&
                                history().map((term, index) => (
                                    <div class="site-search-history-row">
                                        <button
                                            type="button"
                                            role="option"
                                            id={`${id}-result-${index}`}
                                            aria-selected={active() === index}
                                            tabIndex={-1}
                                            class="site-search-history-term"
                                            onMouseEnter={() => setActive(index)}
                                            onClick={() => repeatSearch(term)}
                                        >
                                            <Clock3 size={16} aria-hidden="true" />
                                            <span>{term}</span>
                                        </button>
                                        <button
                                            type="button"
                                            class="site-search-history-remove"
                                            aria-label={`Remove recent search ${term}`}
                                            onClick={() => {
                                                input?.focus();
                                                updateHistory(
                                                    history().filter(
                                                        (previous) => previous !== term,
                                                    ),
                                                );
                                            }}
                                        >
                                            <X size={15} aria-hidden="true" />
                                        </button>
                                    </div>
                                ))}
                            {groups().map((group) => (
                                <div role="group" aria-label={group.category}>
                                    <p class="site-search-group" aria-hidden="true">
                                        {group.category}
                                    </p>
                                    {group.results.map((result) => (
                                        <A
                                            id={`${id}-result-${result.index}`}
                                            role="option"
                                            aria-selected={active() === result.index}
                                            tabIndex={-1}
                                            href={result.href}
                                            onMouseEnter={() => setActive(result.index)}
                                            onClick={() => close()}
                                        >
                                            <span>
                                                <strong>{result.title}</strong>
                                                <small>{result.subtitle}</small>
                                            </span>
                                            <ArrowUpRight size={15} aria-hidden="true" />
                                        </A>
                                    ))}
                                </div>
                            ))}
                        </div>
                        {query().trim().length >= 2 &&
                            !pending() &&
                            !remote.isError &&
                            results().length === 0 && (
                                <div role="status" class="site-search-empty">
                                    <span class="site-search-empty-icon">
                                        <SearchX size={26} aria-hidden="true" />
                                    </span>
                                    <strong>No results found</strong>
                                    <p>No matches for “{query().trim()}”.</p>
                                    <small>Try another name or keyword.</small>
                                </div>
                            )}
                        {query().trim() &&
                            (pending() ||
                                remote.isError ||
                                results().length > 0 ||
                                query().trim().length === 1) && (
                                <div role="status" class="site-search-status">
                                    {pending()
                                        ? "Searching players and tracks…"
                                        : remote.isError && query().trim().length >= 2
                                          ? "Player and track search is unavailable. Pages and tools still work."
                                          : query().trim().length === 1
                                            ? "Type at least 2 characters to find players and tracks."
                                            : "↑↓ navigate · Enter open · Esc close"}
                                </div>
                            )}
                    </div>
                )}
            </div>
        </div>
    );
}
