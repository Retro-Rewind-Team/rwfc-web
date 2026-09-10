import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { batchMiis } from "../../services/api/miiHelpers";

/**
 * The room browser depends on the fallback path here: its own endpoint only knows players in the
 * current snapshot, so anyone it cannot answer for is retried against the leaderboard. Chunking
 * matters too, because the batch endpoints cap the number of friend codes per request.
 */
const BATCH_CHUNK_SIZE = 25;

const codes = (count: number, prefix = "fc") =>
    Array.from({ length: count }, (_, i) => `${prefix}-${i}`);

/** Records every request and answers from a per-endpoint lookup. */
function stubFetch(responders: Record<string, (codes: string[]) => Record<string, string>>) {
    const calls: { endpoint: string; friendCodes: string[] }[] = [];

    vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string, init: RequestInit) => {
            const endpoint = Object.keys(responders).find((key) => url.includes(key));
            const body = JSON.parse(init.body as string) as { friendCodes: string[] };
            calls.push({ endpoint: endpoint ?? url, friendCodes: body.friendCodes });

            if (!endpoint) {
                return new Response("not found", { status: 404 });
            }

            return new Response(JSON.stringify({ miis: responders[endpoint](body.friendCodes) }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }),
    );

    return calls;
}

describe("batchMiis", () => {
    beforeEach(() => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("makes no request at all for an empty list", async () => {
        const calls = stubFetch({ "/primary": () => ({}) });

        const result = await batchMiis("/primary", []);

        expect(result.miis).toEqual({});
        expect(calls).toHaveLength(0);
    });

    it("splits requests into chunks of the batch size", async () => {
        const calls = stubFetch({
            "/primary": (fcs) => Object.fromEntries(fcs.map((fc) => [fc, `img-${fc}`])),
        });

        const result = await batchMiis("/primary", codes(60));

        // 60 codes over a cap of 25 is three requests, the last one partial.
        expect(calls.map((c) => c.friendCodes.length)).toEqual([
            BATCH_CHUNK_SIZE,
            BATCH_CHUNK_SIZE,
            10,
        ]);
        expect(Object.keys(result.miis)).toHaveLength(60);
    });

    it("returns the images the primary endpoint provided", async () => {
        stubFetch({ "/primary": () => ({ "fc-0": "image-zero" }) });

        const result = await batchMiis("/primary", ["fc-0"]);

        expect(result.miis["fc-0"]).toBe("image-zero");
    });

    it("retries only the unanswered codes against the fallback", async () => {
        const calls = stubFetch({
            // The room endpoint knows one player; the other is not in its snapshot.
            "/primary": () => ({ "fc-0": "from-primary" }),
            "/fallback": (fcs) => Object.fromEntries(fcs.map((fc) => [fc, "from-fallback"])),
        });

        const result = await batchMiis("/primary", ["fc-0", "fc-1"], "/fallback");

        expect(result.miis["fc-0"]).toBe("from-primary");
        expect(result.miis["fc-1"]).toBe("from-fallback");

        // The fallback is asked only about the code the primary could not answer.
        const fallbackCall = calls.find((c) => c.endpoint === "/fallback");
        expect(fallbackCall?.friendCodes).toEqual(["fc-1"]);
    });

    it("skips the fallback entirely when the primary answered everything", async () => {
        const calls = stubFetch({
            "/primary": (fcs) => Object.fromEntries(fcs.map((fc) => [fc, "img"])),
            "/fallback": () => ({}),
        });

        await batchMiis("/primary", ["fc-0", "fc-1"], "/fallback");

        expect(calls.some((c) => c.endpoint === "/fallback")).toBe(false);
    });

    it("does not call a fallback that was not supplied", async () => {
        const calls = stubFetch({ "/primary": () => ({}) });

        const result = await batchMiis("/primary", ["fc-0"]);

        expect(calls).toHaveLength(1);
        expect(result.miis).toEqual({});
    });

    it("keeps the chunks it did get when one chunk fails", async () => {
        let call = 0;
        vi.stubGlobal(
            "fetch",
            vi.fn(async (_url: string, init: RequestInit) => {
                const body = JSON.parse(init.body as string) as { friendCodes: string[] };
                call++;
                // Fail the first chunk only.
                if (call === 1) return new Response("boom", { status: 500 });
                return new Response(
                    JSON.stringify({
                        miis: Object.fromEntries(body.friendCodes.map((fc) => [fc, "img"])),
                    }),
                    { status: 200, headers: { "Content-Type": "application/json" } },
                );
            }),
        );

        const result = await batchMiis("/primary", codes(30));

        // One chunk lost, the other kept: a partial page of avatars beats none.
        expect(Object.keys(result.miis)).toHaveLength(5);
    });

    it("still returns the primary results when the fallback request fails", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async (url: string, init: RequestInit) => {
                const body = JSON.parse(init.body as string) as { friendCodes: string[] };
                if (url.includes("/fallback")) return new Response("boom", { status: 500 });
                return new Response(JSON.stringify({ miis: { [body.friendCodes[0]]: "img" } }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                });
            }),
        );

        const result = await batchMiis("/primary", ["fc-0", "fc-1"], "/fallback");

        expect(result.miis["fc-0"]).toBe("img");
        expect(result.miis["fc-1"]).toBeUndefined();
    });
});
