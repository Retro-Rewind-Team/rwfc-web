import { render, waitFor } from "@solidjs/testing-library";
import { createMemoryHistory, MemoryRouter, Route } from "@solidjs/router";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { expect } from "vitest";

/**
 * Runs a hook inside a memory router, which is what every URL-backed hook needs. Returns the hook's
 * result and the history, so a test can read the URL a change produced and step Back through it.
 *
 * The router mounts asynchronously, so this resolves once the hook has run.
 */
export async function renderHook<T>(hook: () => T, startAt = "/") {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const history = createMemoryHistory();
    history.set({ value: startAt });

    let result: T | undefined;
    function Probe() {
        result = hook();
        return null;
    }

    render(() => (
        <MemoryRouter history={history}>
            <Route
                path="/"
                component={() => (
                    <QueryClientProvider client={client}>
                        <Probe />
                    </QueryClientProvider>
                )}
            />
        </MemoryRouter>
    ));

    await waitFor(() => expect(result).toBeDefined());
    return { result: result as T, history };
}

/** Waits for the URL to settle on `expected`. Navigation is not synchronous. */
export const expectUrl = (history: { get: () => string }, expected: string) =>
    waitFor(() => expect(history.get()).toBe(expected));
