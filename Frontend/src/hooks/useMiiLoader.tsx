import { onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { leaderboardApi } from "../services/api/leaderboard";
import { BatchMiiResponse } from "../types";

interface MiiCache {
    [friendCode: string]: string | null | "loading";
}

/** Fetches Mii images for a set of friend codes. Both the leaderboard and room endpoints match this. */
export type MiiBatchFetcher = (friendCodes: string[]) => Promise<BatchMiiResponse>;

interface UseMiiLoaderReturn {
    getMiiImage: (friendCode: string) => string | null | undefined;
    loadMii: (friendCode: string) => Promise<void>;
    loadMiisBatch: (friendCodes: string[], fetcher?: MiiBatchFetcher) => Promise<void>;
    isLoading: (friendCode: string) => boolean;
}

/**
 * Cache shared across all `useMiiLoader` instances. Value is a base64 image, null (no Mii), or
 * "loading". A Solid store rather than a plain object so writes reach the reactive graph: with a
 * plain object nothing could observe a change, and every avatar polled the cache on a timer to
 * notice one.
 */
const [miiCache, setMiiCache] = createStore<MiiCache>({});

/** In-flight load promises keyed by friend code, preventing duplicate API calls. */
const loadingPromises = new Map<string, Promise<void>>();

/**
 * Provides Mii image loading with a cache shared across all hook instances. Individual and batch
 * loading are deduplicated so each friend code is fetched at most once per page lifecycle.
 */
export function useMiiLoader(): UseMiiLoaderReturn {
    const getMiiImage = (friendCode: string): string | null | undefined => {
        const cached = miiCache[friendCode];
        if (cached === "loading") return undefined;
        return cached;
    };

    const isLoading = (friendCode: string): boolean => miiCache[friendCode] === "loading";

    const loadMii = async (friendCode: string): Promise<void> => {
        if (miiCache[friendCode] !== undefined) {
            return;
        }

        if (loadingPromises.has(friendCode)) {
            return loadingPromises.get(friendCode)!;
        }

        setMiiCache(friendCode, "loading");

        const loadPromise = (async () => {
            try {
                const response = await leaderboardApi.getPlayerMii(friendCode);
                setMiiCache(friendCode, response?.miiImageBase64 || null);
            } catch (error) {
                console.warn(`Failed to load Mii for ${friendCode}:`, error);
                setMiiCache(friendCode, null);
            } finally {
                loadingPromises.delete(friendCode);
            }
        })();

        loadingPromises.set(friendCode, loadPromise);
        return loadPromise;
    };

    /**
     * @param fetcher Which endpoint to load from. Defaults to the leaderboard batch, which only
     * knows players present in the Players table. The room browser passes the room endpoint so
     * players visible in a room but absent from the leaderboard still get an avatar.
     */
    const loadMiisBatch = async (
        friendCodes: string[],
        fetcher: MiiBatchFetcher = leaderboardApi.getPlayerMiisBatch,
    ): Promise<void> => {
        const uncachedFriendCodes = friendCodes.filter(
            (fc) => miiCache[fc] === undefined && !loadingPromises.has(fc),
        );

        if (uncachedFriendCodes.length === 0) {
            return;
        }

        setMiiCache(
            Object.fromEntries(uncachedFriendCodes.map((fc) => [fc, "loading" as const])),
        );

        try {
            const response = await fetcher(uncachedFriendCodes);

            setMiiCache(
                Object.fromEntries(
                    uncachedFriendCodes.map((fc) => [fc, response.miis[fc] || null]),
                ),
            );
        } catch (error) {
            console.warn("Failed to load Miis batch:", error);
            setMiiCache(Object.fromEntries(uncachedFriendCodes.map((fc) => [fc, null])));
        }
    };

    return {
        getMiiImage,
        loadMii,
        loadMiisBatch,
        isLoading,
    };
}

/**
 * Reactive wrapper around `useMiiLoader` for a single friend code. The accessors read the store
 * directly, so a component using them updates when the image arrives.
 */
export function useMiiImage(friendCode: string): {
    miiImage: () => string | null | undefined;
    isLoading: () => boolean;
    loadMii: () => void;
} {
    const miiLoader = useMiiLoader();

    return {
        miiImage: () => miiLoader.getMiiImage(friendCode),
        isLoading: () => miiLoader.isLoading(friendCode),
        loadMii: () => {
            miiLoader.loadMii(friendCode);
        },
    };
}

/**
 * Calls `callback` the first time the observed element scrolls into view, then stops observing it.
 * Used to defer Mii loading until an avatar is actually on screen.
 */
export function useIntersectionObserver(
    callback: () => void,
    options: IntersectionObserverInit = {},
) {
    let element: Element | null = null;
    let observer: IntersectionObserver | null = null;

    const observe = (el: Element) => {
        if (element === el) return;

        if (observer) {
            observer.disconnect();
        }

        element = el;
        observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    callback();
                    observer?.unobserve(el);
                }
            },
            {
                rootMargin: "50px",
                threshold: 0.1,
                ...options,
            },
        );

        observer.observe(el);
    };

    onCleanup(() => {
        if (observer) {
            observer.disconnect();
        }
    });

    return observe;
}