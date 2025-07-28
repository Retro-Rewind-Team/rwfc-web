import { createSignal, createEffect, onCleanup } from "solid-js";
import { leaderboardApi } from "../services/api/leaderboard";

interface MiiCache {
  [friendCode: string]: string | null | "loading";
}

interface UseMiiLoaderReturn {
  getMiiImage: (friendCode: string) => string | null | undefined;
  loadMii: (friendCode: string) => Promise<void>;
  loadMiisBatch: (friendCodes: string[]) => Promise<void>;
  isLoading: (friendCode: string) => boolean;
}

const globalMiiCache: MiiCache = {};
const loadingPromises = new Map<string, Promise<void>>();

export function useMiiLoader(): UseMiiLoaderReturn {
  const [, setForceUpdate] = createSignal(0);

  const forceUpdate = () => setForceUpdate((prev) => prev + 1);

  const getMiiImage = (friendCode: string): string | null | undefined => {
    const cached = globalMiiCache[friendCode];
    if (cached === "loading") return undefined;
    return cached;
  };

  const isLoading = (friendCode: string): boolean => {
    return globalMiiCache[friendCode] === "loading";
  };

  const loadMii = async (friendCode: string): Promise<void> => {
    if (globalMiiCache[friendCode] !== undefined) {
      return;
    }

    if (loadingPromises.has(friendCode)) {
      return loadingPromises.get(friendCode)!;
    }

    globalMiiCache[friendCode] = "loading";
    forceUpdate();

    const loadPromise = (async () => {
      try {
        const response = await leaderboardApi.getPlayerMii(friendCode);
        globalMiiCache[friendCode] = response?.miiImageBase64 || null;
      } catch (error) {
        console.warn(`Failed to load Mii for ${friendCode}:`, error);
        globalMiiCache[friendCode] = null;
      } finally {
        loadingPromises.delete(friendCode);
        forceUpdate();
      }
    })();

    loadingPromises.set(friendCode, loadPromise);
    return loadPromise;
  };

  const loadMiisBatch = async (friendCodes: string[]): Promise<void> => {
    const uncachedFriendCodes = friendCodes.filter(
      (fc) => globalMiiCache[fc] === undefined && !loadingPromises.has(fc)
    );

    if (uncachedFriendCodes.length === 0) {
      return;
    }

    uncachedFriendCodes.forEach((fc) => {
      globalMiiCache[fc] = "loading";
    });
    forceUpdate();

    try {
      const response =
        await leaderboardApi.getPlayerMiisBatch(uncachedFriendCodes);

      uncachedFriendCodes.forEach((fc) => {
        globalMiiCache[fc] = response.miis[fc] || null;
      });
    } catch (error) {
      console.warn("Failed to load Miis batch:", error);
      uncachedFriendCodes.forEach((fc) => {
        globalMiiCache[fc] = null;
      });
    } finally {
      forceUpdate();
    }
  };

  return {
    getMiiImage,
    loadMii,
    loadMiisBatch,
    isLoading,
  };
}

export function useMiiImage(friendCode: string): {
  miiImage: () => string | null | undefined;
  isLoading: () => boolean;
  loadMii: () => void;
} {
  const miiLoader = useMiiLoader();
  const [miiImage, setMiiImage] = createSignal<string | null | undefined>(
    miiLoader.getMiiImage(friendCode)
  );

  createEffect(() => {
    const checkForUpdates = () => {
      const current = miiLoader.getMiiImage(friendCode);
      if (current !== miiImage()) {
        setMiiImage(current);
      }
    };

    checkForUpdates();

    const interval = setInterval(checkForUpdates, 200);

    onCleanup(() => {
      clearInterval(interval);
    });
  });

  return {
    miiImage,
    isLoading: () => miiLoader.isLoading(friendCode),
    loadMii: () => {
      miiLoader.loadMii(friendCode);
    },
  };
}

export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
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
      }
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
