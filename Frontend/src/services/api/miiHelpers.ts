import { BatchMiiResponse } from "../../types";
import { apiRequest } from "./client";

const BATCH_CHUNK_SIZE = 25;

/**
 * Fetches Mii images in batches for a list of friend codes, chunking requests
 * to respect the API's batch size limit. If a fallback endpoint is provided,
 * any friend codes that returned no image from the primary endpoint are
 * retried against it (used by the room status API to fall back to leaderboard Miis).
 */
export async function batchMiis(
    endpoint: string,
    friendCodes: string[],
    fallbackEndpoint?: string,
): Promise<BatchMiiResponse> {
    if (friendCodes.length === 0) return { miis: {} };

    const chunks: string[][] = [];
    for (let i = 0; i < friendCodes.length; i += BATCH_CHUNK_SIZE)
        chunks.push(friendCodes.slice(i, i + BATCH_CHUNK_SIZE));

    const allMiis: Record<string, string> = {};

    for (const chunk of chunks) {
        try {
            const response = await apiRequest<BatchMiiResponse>(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ friendCodes: chunk }),
            });
            Object.assign(allMiis, response.miis);

            if (fallbackEndpoint) {
                const missingFcs = chunk.filter((fc) => !response.miis[fc]);
                if (missingFcs.length > 0) {
                    try {
                        const fallback = await apiRequest<BatchMiiResponse>(fallbackEndpoint, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ friendCodes: missingFcs }),
                        });
                        Object.assign(allMiis, fallback.miis);
                    } catch (e) {
                        console.warn("Fallback Mii fetch failed:", e);
                    }
                }
            }
        } catch (e) {
            console.warn(`Failed to load Mii batch for ${chunk.length} players:`, e);
        }
    }

    return { miis: allMiis };
}
